"""Resume upload / list / delete / download routes."""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from pathlib import Path
import uuid, os

from auth import get_current_user
from db import resumes, analyses
from resume_service import extract_text, extract_entities
from models import ResumePublic

router = APIRouter(prefix="/resume", tags=["resume"])

UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

MAX_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_EXT = {".pdf", ".docx"}


def _to_public(r: dict) -> dict:
    return {
        "id": r["id"],
        "filename": r["filename"],
        "size_bytes": r["size_bytes"],
        "extracted": r.get("extracted", {}),
        "created_at": r["created_at"],
    }


@router.post("/upload")
async def upload_resume(file: UploadFile = File(...), user=Depends(get_current_user)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(400, "Only .pdf and .docx are allowed")
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(400, "File exceeds 5MB limit")
    if len(data) == 0:
        raise HTTPException(400, "Empty file")

    try:
        text = extract_text(file.filename, data)
    except Exception as e:
        raise HTTPException(400, f"Could not parse file: {e}")

    resume_id = str(uuid.uuid4())
    stored_name = f"{resume_id}{ext}"
    stored_path = UPLOAD_DIR / stored_name
    with open(stored_path, "wb") as f:
        f.write(data)

    extracted = extract_entities(text)
    from datetime import datetime, timezone
    doc = {
        "id": resume_id,
        "user_id": user["id"],
        "filename": file.filename,
        "stored_path": str(stored_path),
        "size_bytes": len(data),
        "text": text,
        "extracted": extracted,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await resumes.insert_one(doc)
    return _to_public(doc)


@router.get("")
async def list_resumes(user=Depends(get_current_user)):
    cursor = resumes.find({"user_id": user["id"]}, {"_id": 0, "text": 0, "stored_path": 0}).sort("created_at", -1)
    items = await cursor.to_list(200)
    return [_to_public(r) for r in items]


@router.get("/{resume_id}")
async def get_resume(resume_id: str, user=Depends(get_current_user)):
    r = await resumes.find_one({"id": resume_id, "user_id": user["id"]}, {"_id": 0, "stored_path": 0})
    if not r:
        raise HTTPException(404, "Resume not found")
    return _to_public(r)


@router.get("/{resume_id}/download")
async def download_resume(resume_id: str, user=Depends(get_current_user)):
    r = await resumes.find_one({"id": resume_id, "user_id": user["id"]})
    if not r:
        raise HTTPException(404, "Resume not found")
    path = r.get("stored_path")
    if not path or not os.path.exists(path):
        raise HTTPException(404, "File missing on disk")
    return FileResponse(path, filename=r["filename"])


@router.delete("/{resume_id}")
async def delete_resume(resume_id: str, user=Depends(get_current_user)):
    r = await resumes.find_one({"id": resume_id, "user_id": user["id"]})
    if not r:
        raise HTTPException(404, "Resume not found")
    # remove file
    try:
        if r.get("stored_path") and os.path.exists(r["stored_path"]):
            os.remove(r["stored_path"])
    except Exception:
        pass
    await resumes.delete_one({"id": resume_id, "user_id": user["id"]})
    await analyses.delete_many({"resume_id": resume_id, "user_id": user["id"]})
    return {"message": "Resume deleted"}
