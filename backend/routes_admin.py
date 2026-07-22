"""Admin routes."""
from fastapi import APIRouter, Depends, HTTPException
from collections import Counter

from auth import require_admin
from db import users, resumes, analyses

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users")
async def list_users(_=Depends(require_admin)):
    cursor = users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1)
    return await cursor.to_list(500)


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin=Depends(require_admin)):
    if user_id == admin["id"]:
        raise HTTPException(400, "Cannot delete your own admin account")
    u = await users.find_one({"id": user_id})
    if not u:
        raise HTTPException(404, "User not found")
    await users.delete_one({"id": user_id})
    await resumes.delete_many({"user_id": user_id})
    await analyses.delete_many({"user_id": user_id})
    return {"message": "User deleted"}


@router.get("/resumes")
async def list_all_resumes(_=Depends(require_admin)):
    cursor = resumes.find({}, {"_id": 0, "text": 0, "stored_path": 0}).sort("created_at", -1)
    return await cursor.to_list(500)


@router.get("/analytics")
async def admin_analytics(_=Depends(require_admin)):
    total_users = await users.count_documents({})
    total_resumes = await resumes.count_documents({})
    total_analyses = await analyses.count_documents({})
    all_an = await analyses.find({}, {"_id": 0, "ats_score": 1, "missing_skills": 1,
                                       "matched_skills": 1}).to_list(2000)
    avg_ats = round(sum(a.get("ats_score", 0) for a in all_an) / len(all_an), 1) if all_an else 0.0
    missing = Counter()
    matched = Counter()
    for a in all_an:
        missing.update(a.get("missing_skills", []))
        matched.update(a.get("matched_skills", []))
    return {
        "total_users": total_users,
        "total_resumes": total_resumes,
        "total_analyses": total_analyses,
        "average_ats_score": avg_ats,
        "top_missing_skills": [{"skill": k, "count": v} for k, v in missing.most_common(10)],
        "top_matched_skills": [{"skill": k, "count": v} for k, v in matched.most_common(10)],
    }
