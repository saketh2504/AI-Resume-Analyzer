"""Auth routes: register/login/forgot/reset/me/update-profile."""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timedelta, timezone
import secrets

from models import (
    RegisterRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest,
    UpdateProfileRequest, TokenResponse, UserPublic,
)
from auth import hash_password, verify_password, create_token, get_current_user
from db import users, password_resets
import uuid

router = APIRouter(prefix="/auth", tags=["auth"])


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _to_public(u: dict) -> UserPublic:
    return UserPublic(
        id=u["id"], name=u["name"], email=u["email"],
        role=u.get("role", "user"), created_at=u["created_at"],
    )


@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest):
    existing = await users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(400, "Email already registered")
    user = {
        "id": str(uuid.uuid4()),
        "name": req.name,
        "email": req.email.lower(),
        "role": "user",
        "password_hash": hash_password(req.password),
        "created_at": _now_iso(),
    }
    await users.insert_one(user)
    token = create_token(user["id"], user["role"])
    return TokenResponse(access_token=token, user=_to_public(user))


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    u = await users.find_one({"email": req.email.lower()})
    if not u or not verify_password(req.password, u["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    token = create_token(u["id"], u.get("role", "user"))
    return TokenResponse(access_token=token, user=_to_public(u))


@router.get("/me", response_model=UserPublic)
async def me(user=Depends(get_current_user)):
    return _to_public(user)


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    u = await users.find_one({"email": req.email.lower()})
    # Always respond generically to prevent enumeration, but return token in demo mode
    if not u:
        return {"message": "If the email exists, a reset link has been sent.", "reset_token": None}
    token = secrets.token_urlsafe(24)
    await password_resets.insert_one({
        "token": token,
        "user_id": u["id"],
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
        "used": False,
    })
    # In production, email the token. For demo, return it to the client.
    return {
        "message": "Reset token generated. Use it on the reset password page.",
        "reset_token": token,
    }


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    entry = await password_resets.find_one({"token": req.token, "used": False})
    if not entry:
        raise HTTPException(400, "Invalid or used token")
    if datetime.fromisoformat(entry["expires_at"]) < datetime.now(timezone.utc):
        raise HTTPException(400, "Token expired")
    await users.update_one(
        {"id": entry["user_id"]},
        {"$set": {"password_hash": hash_password(req.new_password)}},
    )
    await password_resets.update_one({"token": req.token}, {"$set": {"used": True}})
    return {"message": "Password updated successfully."}


@router.put("/profile", response_model=UserPublic)
async def update_profile(req: UpdateProfileRequest, user=Depends(get_current_user)):
    update: dict = {}
    if req.name:
        update["name"] = req.name
    if req.email:
        # ensure no duplicate
        if req.email.lower() != user["email"]:
            existing = await users.find_one({"email": req.email.lower()})
            if existing:
                raise HTTPException(400, "Email already in use")
            update["email"] = req.email.lower()
    if req.new_password:
        if not req.current_password:
            raise HTTPException(400, "Current password is required to set a new password")
        # fetch hash
        u_full = await users.find_one({"id": user["id"]})
        if not verify_password(req.current_password, u_full["password_hash"]):
            raise HTTPException(400, "Current password is incorrect")
        update["password_hash"] = hash_password(req.new_password)
    if update:
        await users.update_one({"id": user["id"]}, {"$set": update})
    u = await users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return _to_public(u)


@router.post("/logout")
async def logout(user=Depends(get_current_user)):
    # JWT is stateless; client should discard token. Endpoint provided for symmetry.
    return {"message": "Logged out"}
