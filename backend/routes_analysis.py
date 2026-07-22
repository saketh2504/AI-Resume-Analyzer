"""Analysis routes: /analyze, /resume-suggestions, /upload-job-description."""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import Optional
import uuid, os
from datetime import datetime, timezone

from auth import get_current_user
from db import resumes, job_descriptions, analyses
from models import AnalyzeRequest, SuggestionsRequest, JDRequest
from resume_service import extract_text
from analysis_service import (
    extract_jd_skills, skill_match, semantic_similarity, ats_score,
    interview_readiness,
)
from llm_service import generate_suggestions

router = APIRouter(tags=["analysis"])


@router.post("/upload-job-description")
async def upload_jd(
    file: Optional[UploadFile] = File(None),
    title: str = Form("Untitled Role"),
    text: Optional[str] = Form(None),
    user=Depends(get_current_user),
):
    jd_text = ""
    if file is not None:
        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext != ".pdf":
            raise HTTPException(400, "Only PDF is supported for JD upload; use paste for text")
        data = await file.read()
        if len(data) > 5 * 1024 * 1024:
            raise HTTPException(400, "File exceeds 5MB limit")
        jd_text = extract_text(file.filename, data)
    elif text:
        jd_text = text
    else:
        raise HTTPException(400, "Provide either file or text")

    jd_id = str(uuid.uuid4())
    doc = {
        "id": jd_id, "user_id": user["id"],
        "title": title or "Untitled Role",
        "text": jd_text,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await job_descriptions.insert_one(doc)
    return {"id": jd_id, "title": doc["title"], "text_preview": jd_text[:400]}


@router.post("/analyze")
async def analyze(req: AnalyzeRequest, user=Depends(get_current_user)):
    r = await resumes.find_one({"id": req.resume_id, "user_id": user["id"]})
    if not r:
        raise HTTPException(404, "Resume not found")

    jd_text = req.jd_text
    jd_title = req.jd_title or "Untitled Role"
    if not jd_text and req.jd_id:
        jd = await job_descriptions.find_one({"id": req.jd_id, "user_id": user["id"]})
        if not jd:
            raise HTTPException(404, "Job description not found")
        jd_text = jd["text"]
        jd_title = jd.get("title", jd_title)
    if not jd_text:
        raise HTTPException(400, "Provide jd_text or jd_id")

    resume_text = r["text"]
    extracted = r.get("extracted", {})
    resume_skills = extracted.get("skills", [])
    jd_skills = extract_jd_skills(jd_text)

    match = skill_match(resume_skills, jd_skills)
    sim = semantic_similarity(resume_text, jd_text)
    ats_total, ats_break, ats_suggestions = ats_score(
        resume_text, extracted, jd_skills, match["matched"]
    )
    readiness = interview_readiness(
        ats_total, sim, len(match["matched"]),
        len(extracted.get("projects", [])),
        len(extracted.get("experience", [])),
    )

    # LLM suggestions (best-effort)
    try:
        llm_suggestions = await generate_suggestions(
            resume_text, jd_text, match["matched"], match["missing"]
        )
    except Exception as e:
        llm_suggestions = {"error": str(e)}

    suggestions_bundle = {
        "ats": ats_suggestions,
        "llm": llm_suggestions,
    }

    analysis_id = str(uuid.uuid4())
    doc = {
        "id": analysis_id,
        "user_id": user["id"],
        "resume_id": req.resume_id,
        "resume_filename": r["filename"],
        "jd_title": jd_title,
        "jd_text": jd_text,
        "ats_score": ats_total,
        "ats_breakdown": ats_break,
        "matched_skills": match["matched"],
        "missing_skills": match["missing"],
        "recommended_skills": match["recommended"],
        "skill_match_pct": match["match_pct"],
        "similarity_score": sim,
        "interview_readiness": readiness,
        "suggestions": suggestions_bundle,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await analyses.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.get("/analyses")
async def list_analyses(user=Depends(get_current_user)):
    cursor = analyses.find({"user_id": user["id"]}, {"_id": 0, "jd_text": 0, "suggestions": 0}).sort("created_at", -1)
    return await cursor.to_list(200)


@router.get("/analyses/{analysis_id}")
async def get_analysis(analysis_id: str, user=Depends(get_current_user)):
    a = await analyses.find_one({"id": analysis_id, "user_id": user["id"]}, {"_id": 0})
    if not a:
        raise HTTPException(404, "Not found")
    return a


@router.post("/resume-suggestions")
async def resume_suggestions(req: SuggestionsRequest, user=Depends(get_current_user)):
    r = await resumes.find_one({"id": req.resume_id, "user_id": user["id"]})
    if not r:
        raise HTTPException(404, "Resume not found")
    jd_text = req.jd_text or ""
    matched, missing = [], []
    if jd_text:
        jd_skills = extract_jd_skills(jd_text)
        m = skill_match(r.get("extracted", {}).get("skills", []), jd_skills)
        matched, missing = m["matched"], m["missing"]
    return await generate_suggestions(r["text"], jd_text, matched, missing)
