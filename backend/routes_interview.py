"""Interview question generation."""
from fastapi import APIRouter, HTTPException, Depends
import uuid
from datetime import datetime, timezone

from auth import get_current_user
from db import resumes, analyses, interview_sets
from models import InterviewRequest
from llm_service import generate_interview_questions

router = APIRouter(tags=["interview"])


@router.post("/generate-interview")
async def generate_interview(req: InterviewRequest, user=Depends(get_current_user)):
    resume_text = ""
    jd_text = req.jd_text or ""
    if req.resume_id:
        r = await resumes.find_one({"id": req.resume_id, "user_id": user["id"]})
        if r:
            resume_text = r["text"]
    if req.analysis_id and not jd_text:
        a = await analyses.find_one({"id": req.analysis_id, "user_id": user["id"]})
        if a:
            jd_text = a.get("jd_text", "")
            if not resume_text:
                r = await resumes.find_one({"id": a["resume_id"], "user_id": user["id"]})
                if r:
                    resume_text = r["text"]

    valid_types = {"technical", "behavioral", "hr", "coding", "project"}
    types = [t for t in req.types if t in valid_types] or ["technical", "behavioral", "hr"]
    difficulty = req.difficulty if req.difficulty in {"easy", "medium", "hard"} else "medium"
    count = max(1, min(10, req.count_per_type))

    questions = await generate_interview_questions(
        req.role or "Software Engineer", jd_text, resume_text,
        types, difficulty, count,
    )

    set_id = str(uuid.uuid4())
    doc = {
        "id": set_id, "user_id": user["id"],
        "role": req.role or "Software Engineer",
        "difficulty": difficulty,
        "types": types,
        "questions": questions,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await interview_sets.insert_one(doc)
    doc.pop("_id", None)
    return doc


@router.get("/interview-sets")
async def list_interview_sets(user=Depends(get_current_user)):
    cursor = interview_sets.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(50)
