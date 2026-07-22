"""MongoDB client + collection accessors."""
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

_client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = _client[os.environ["DB_NAME"]]

users = db["users"]
resumes = db["resumes"]
job_descriptions = db["job_descriptions"]
analyses = db["analyses"]
interview_sets = db["interview_sets"]
password_resets = db["password_resets"]
