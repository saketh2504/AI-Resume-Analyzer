"""Dashboard + analytics routes."""
from fastapi import APIRouter, Depends
from collections import Counter

from auth import get_current_user
from db import resumes, analyses, interview_sets
from resume_service import skill_categories

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard")
async def dashboard(user=Depends(get_current_user)):
    uid = user["id"]
    total_resumes = await resumes.count_documents({"user_id": uid})
    total_analyses = await analyses.count_documents({"user_id": uid})

    # latest analysis for ATS + readiness
    latest = await analyses.find_one({"user_id": uid}, {"_id": 0}, sort=[("created_at", -1)])
    ats_score = latest["ats_score"] if latest else 0
    readiness = latest["interview_readiness"] if latest else 0
    matched = len(latest["matched_skills"]) if latest else 0
    missing = len(latest["missing_skills"]) if latest else 0

    # ATS history (last 10)
    hist_cursor = analyses.find({"user_id": uid}, {"_id": 0, "ats_score": 1, "created_at": 1, "jd_title": 1}).sort("created_at", 1)
    hist = await hist_cursor.to_list(50)
    ats_history = [
        {"label": (h.get("jd_title") or "Analysis")[:24], "score": h["ats_score"],
         "date": h["created_at"][:10]}
        for h in hist[-10:]
    ]

    # Skill categories from latest resume
    latest_resume = await resumes.find_one({"user_id": uid}, {"_id": 0, "extracted": 1}, sort=[("created_at", -1)])
    cats = skill_categories(latest_resume.get("extracted", {}).get("skills", [])) if latest_resume else {}
    skill_cats = [{"name": k, "value": v} for k, v in cats.items()]

    # Improvement trend: match_pct over time
    trend = [
        {"date": h["created_at"][:10] if isinstance(h.get("created_at"), str) else "",
         "match_pct": h.get("skill_match_pct", 0), "readiness": h.get("interview_readiness", 0)}
        for h in await analyses.find({"user_id": uid},
                                      {"_id": 0, "skill_match_pct": 1, "interview_readiness": 1, "created_at": 1}
                                     ).sort("created_at", 1).to_list(50)
    ][-10:]

    return {
        "cards": {
            "ats_score": ats_score,
            "total_resumes": total_resumes,
            "job_applications": total_analyses,
            "interview_readiness": readiness,
            "skills_found": matched,
            "missing_skills": missing,
        },
        "charts": {
            "ats_history": ats_history,
            "skill_categories": skill_cats,
            "improvement_trend": trend,
        },
        "latest_analysis_id": latest["id"] if latest else None,
    }


@router.get("/analytics")
async def analytics(user=Depends(get_current_user)):
    uid = user["id"]
    all_an = await analyses.find({"user_id": uid}, {"_id": 0, "missing_skills": 1,
                                                     "matched_skills": 1, "ats_score": 1,
                                                     "jd_title": 1}).to_list(500)
    missing_counter: Counter = Counter()
    matched_counter: Counter = Counter()
    industries_counter: Counter = Counter()
    for a in all_an:
        missing_counter.update(a.get("missing_skills", []))
        matched_counter.update(a.get("matched_skills", []))
        title = (a.get("jd_title") or "").split()[:2]
        if title:
            industries_counter.update([" ".join(title)])
    avg_ats = round(sum(a.get("ats_score", 0) for a in all_an) / len(all_an), 1) if all_an else 0.0
    return {
        "most_common_missing": [{"skill": k, "count": v} for k, v in missing_counter.most_common(10)],
        "top_technologies": [{"skill": k, "count": v} for k, v in matched_counter.most_common(10)],
        "most_matched_industries": [{"name": k, "count": v} for k, v in industries_counter.most_common(5)],
        "average_ats_score": avg_ats,
        "total_analyses": len(all_an),
    }
