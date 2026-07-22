"""FastAPI application entry — AI Resume Screening & Interview Assistant."""
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# Import routers (after load_dotenv so submodules see env)
from db import users
from auth import hash_password
from routes_auth import router as auth_router
from routes_resume import router as resume_router
from routes_analysis import router as analysis_router
from routes_interview import router as interview_router
from routes_dashboard import router as dashboard_router
from routes_admin import router as admin_router

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Resume Screening & Interview Assistant")

api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "AI Resume Screening API", "status": "ok"}


@api_router.get("/health")
async def health():
    return {"status": "healthy", "time": datetime.now(timezone.utc).isoformat()}


# Register domain routers
api_router.include_router(auth_router)
api_router.include_router(resume_router)
api_router.include_router(analysis_router)
api_router.include_router(interview_router)
api_router.include_router(dashboard_router)
api_router.include_router(admin_router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    """Seed default admin account if missing."""
    admin_email = "admin@demo.com"
    existing = await users.find_one({"email": admin_email})
    if not existing:
        await users.insert_one({
            "id": str(uuid.uuid4()),
            "name": "Admin",
            "email": admin_email,
            "role": "admin",
            "password_hash": hash_password("Admin@123"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Seeded default admin: %s", admin_email)
    else:
        logger.info("Admin account already exists.")
