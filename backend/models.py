"""Pydantic models."""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _uid() -> str:
    return str(uuid.uuid4())


# ---------- Auth ----------
class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=6, max_length=128)


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = Field(default=None, min_length=6, max_length=128)


class UserPublic(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    created_at: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


# ---------- Resume / JD ----------
class ResumeRecord(BaseModel):
    id: str = Field(default_factory=_uid)
    user_id: str
    filename: str
    stored_path: str
    size_bytes: int
    text: str
    extracted: Dict[str, Any] = Field(default_factory=dict)
    created_at: str = Field(default_factory=_now)


class ResumePublic(BaseModel):
    id: str
    filename: str
    size_bytes: int
    extracted: Dict[str, Any]
    created_at: str


class JDRequest(BaseModel):
    title: Optional[str] = "Untitled Role"
    text: str = Field(min_length=10)


class JDRecord(BaseModel):
    id: str = Field(default_factory=_uid)
    user_id: str
    title: str
    text: str
    created_at: str = Field(default_factory=_now)


# ---------- Analysis ----------
class AnalyzeRequest(BaseModel):
    resume_id: str
    jd_text: Optional[str] = None
    jd_id: Optional[str] = None
    jd_title: Optional[str] = "Untitled Role"


class AnalysisRecord(BaseModel):
    id: str = Field(default_factory=_uid)
    user_id: str
    resume_id: str
    jd_title: str
    jd_text: str
    ats_score: int
    ats_breakdown: Dict[str, int]
    matched_skills: List[str]
    missing_skills: List[str]
    recommended_skills: List[str]
    skill_match_pct: float
    similarity_score: float
    interview_readiness: int
    suggestions: Dict[str, Any] = Field(default_factory=dict)
    created_at: str = Field(default_factory=_now)


# ---------- Interview ----------
class InterviewRequest(BaseModel):
    resume_id: Optional[str] = None
    analysis_id: Optional[str] = None
    jd_text: Optional[str] = None
    role: Optional[str] = "Software Engineer"
    types: List[str] = Field(default_factory=lambda: ["technical", "behavioral", "hr"])
    difficulty: str = "medium"  # easy|medium|hard
    count_per_type: int = 3


class InterviewSet(BaseModel):
    id: str = Field(default_factory=_uid)
    user_id: str
    role: str
    difficulty: str
    questions: List[Dict[str, Any]]
    created_at: str = Field(default_factory=_now)


# ---------- Suggestions ----------
class SuggestionsRequest(BaseModel):
    resume_id: str
    jd_text: Optional[str] = None
