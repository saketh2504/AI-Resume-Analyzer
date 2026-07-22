"""End-to-end backend API test for AI Resume Screening & Interview Assistant."""
import io
import os
import time
import uuid
import pytest
import requests
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://skill-gap-finder-36.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@demo.com"
ADMIN_PASSWORD = "Admin@123"

SAMPLE_JD = (
    "We are hiring a Senior Software Engineer with strong Python, React, FastAPI, "
    "AWS, Docker, and Kubernetes experience. Familiarity with MongoDB, CI/CD, "
    "and REST APIs required. Bonus: TypeScript, GraphQL, Redis."
)


# ------------- helpers -------------
def make_pdf_resume(name="Jane Doe") -> bytes:
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    lines = [
        f"{name}",
        "Email: jane.doe@example.com | Phone: +1-555-1234",
        "",
        "SKILLS",
        "Python, React, FastAPI, AWS, Docker, MongoDB, JavaScript, SQL, Git, REST APIs",
        "",
        "EXPERIENCE",
        "- Senior Engineer @ Acme (2021-2024): Built microservices in Python and FastAPI",
        "- Software Engineer @ Beta (2018-2021): React frontends and AWS deployments",
        "",
        "EDUCATION",
        "B.S. Computer Science, Stanford University, 2018",
        "",
        "PROJECTS",
        "- Resume AI: NLP-based resume analyzer using Python and MongoDB",
        "- ChatApp: React + FastAPI real-time messaging platform on AWS",
    ]
    y = 750
    for ln in lines:
        c.drawString(50, y, ln)
        y -= 18
    c.save()
    return buf.getvalue()


@pytest.fixture(scope="session")
def s():
    return requests.Session()


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["user"]["role"] == "admin"
    return data["access_token"]


@pytest.fixture(scope="session")
def user_creds():
    return {"name": "TEST User", "email": f"test_{uuid.uuid4().hex[:8]}@example.com", "password": "User@123"}


@pytest.fixture(scope="session")
def user_token(s, user_creds):
    r = s.post(f"{API}/auth/register", json=user_creds)
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def H(t):
    return {"Authorization": f"Bearer {t}"}


# ------------- Auth tests -------------
class TestAuth:
    def test_health(self, s):
        r = s.get(f"{API}/health")
        assert r.status_code == 200

    def test_register_duplicate(self, s, user_creds, user_token):
        r = s.post(f"{API}/auth/register", json=user_creds)
        assert r.status_code == 400

    def test_login_admin(self, s):
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "admin"

    def test_me(self, s, user_token):
        r = s.get(f"{API}/auth/me", headers=H(user_token))
        assert r.status_code == 200
        assert r.json()["role"] == "user"

    def test_forgot_and_reset(self, s):
        email = f"reset_{uuid.uuid4().hex[:8]}@example.com"
        s.post(f"{API}/auth/register", json={"name": "Reset User", "email": email, "password": "Old@1234"})
        r = s.post(f"{API}/auth/forgot-password", json={"email": email})
        assert r.status_code == 200
        token = r.json().get("reset_token")
        assert token
        r2 = s.post(f"{API}/auth/reset-password", json={"token": token, "new_password": "New@1234"})
        assert r2.status_code == 200
        r3 = s.post(f"{API}/auth/login", json={"email": email, "password": "New@1234"})
        assert r3.status_code == 200

    def test_profile_update_name(self, s, user_token):
        r = s.put(f"{API}/auth/profile", headers=H(user_token), json={"name": "TEST Renamed"})
        assert r.status_code == 200
        assert r.json()["name"] == "TEST Renamed"

    def test_profile_password_requires_current(self, s, user_token):
        r = s.put(f"{API}/auth/profile", headers=H(user_token),
                  json={"new_password": "New@1234"})
        assert r.status_code == 400

    def test_profile_password_wrong_current(self, s, user_token):
        r = s.put(f"{API}/auth/profile", headers=H(user_token),
                  json={"current_password": "wrong", "new_password": "New@1234"})
        assert r.status_code == 400


# ------------- Resume + Analysis tests -------------
class TestResumeAnalysis:
    resume_id = None
    analysis_id = None

    def test_upload_invalid_ext(self, s, user_token):
        files = {"file": ("bad.txt", b"not a pdf", "text/plain")}
        r = s.post(f"{API}/resume/upload", headers=H(user_token), files=files)
        assert r.status_code == 400

    def test_upload_oversize(self, s, user_token):
        big = b"%PDF-1.4\n" + (b"0" * (5 * 1024 * 1024 + 100))
        files = {"file": ("big.pdf", big, "application/pdf")}
        r = s.post(f"{API}/resume/upload", headers=H(user_token), files=files)
        assert r.status_code == 400

    def test_upload_pdf(self, s, user_token):
        pdf = make_pdf_resume()
        files = {"file": ("TEST_resume.pdf", pdf, "application/pdf")}
        r = s.post(f"{API}/resume/upload", headers=H(user_token), files=files)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["id"]
        assert body["extracted"].get("skills"), "extracted skills should be non-empty"
        skills_lower = [s.lower() for s in body["extracted"]["skills"]]
        assert any("python" in x for x in skills_lower)
        TestResumeAnalysis.resume_id = body["id"]

    def test_list_resumes(self, s, user_token):
        r = s.get(f"{API}/resume", headers=H(user_token))
        assert r.status_code == 200
        assert any(x["id"] == TestResumeAnalysis.resume_id for x in r.json())

    def test_get_resume(self, s, user_token):
        r = s.get(f"{API}/resume/{TestResumeAnalysis.resume_id}", headers=H(user_token))
        assert r.status_code == 200
        assert r.json()["id"] == TestResumeAnalysis.resume_id

    def test_analyze(self, s, user_token):
        payload = {"resume_id": TestResumeAnalysis.resume_id, "jd_text": SAMPLE_JD, "jd_title": "Sr SWE"}
        r = s.post(f"{API}/analyze", headers=H(user_token), json=payload, timeout=45)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data["ats_score"], int) and 0 <= data["ats_score"] <= 100
        bd = data["ats_breakdown"]
        assert isinstance(bd, dict) and len(bd) == 8, f"ats_breakdown keys: {list(bd.keys())}"
        assert sum(bd.values()) == data["ats_score"], f"breakdown sum {sum(bd.values())} != ats {data['ats_score']}"
        assert isinstance(data["matched_skills"], list)
        assert isinstance(data["missing_skills"], list)
        assert isinstance(data["recommended_skills"], list)
        assert isinstance(data["similarity_score"], float) and 0 <= data["similarity_score"] <= 1
        assert 0 <= data["interview_readiness"] <= 100
        assert "ats" in data["suggestions"] and isinstance(data["suggestions"]["ats"], list)
        assert "llm" in data["suggestions"] and isinstance(data["suggestions"]["llm"], dict)
        TestResumeAnalysis.analysis_id = data["id"]

    def test_generate_interview(self, s, user_token):
        payload = {
            "resume_id": TestResumeAnalysis.resume_id,
            "jd_text": SAMPLE_JD,
            "role": "Software Engineer",
            "types": ["technical", "behavioral"],
            "difficulty": "medium",
            "count_per_type": 2,
        }
        r = s.post(f"{API}/generate-interview", headers=H(user_token), json=payload, timeout=45)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data.get("questions"), list) and len(data["questions"]) > 0
        q = data["questions"][0]
        for k in ("type", "difficulty", "question", "model_answer"):
            assert k in q, f"missing key {k} in question: {q}"

    def test_dashboard(self, s, user_token):
        r = s.get(f"{API}/dashboard", headers=H(user_token))
        assert r.status_code == 200
        data = r.json()
        for k in ("ats_score", "total_resumes", "job_applications", "interview_readiness",
                  "skills_found", "missing_skills"):
            assert k in data["cards"]
        for k in ("ats_history", "skill_categories", "improvement_trend"):
            assert k in data["charts"]

    def test_analytics(self, s, user_token):
        r = s.get(f"{API}/analytics", headers=H(user_token))
        assert r.status_code == 200
        data = r.json()
        assert "most_common_missing" in data
        assert "top_technologies" in data
        assert "average_ats_score" in data


# ------------- Admin tests -------------
class TestAdmin:
    def test_admin_users(self, s, admin_token):
        r = s.get(f"{API}/admin/users", headers=H(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_resumes(self, s, admin_token):
        r = s.get(f"{API}/admin/resumes", headers=H(admin_token))
        assert r.status_code == 200

    def test_admin_analytics(self, s, admin_token):
        r = s.get(f"{API}/admin/analytics", headers=H(admin_token))
        assert r.status_code == 200
        assert "total_users" in r.json()

    def test_admin_forbidden_for_user(self, s, user_token):
        r = s.get(f"{API}/admin/users", headers=H(user_token))
        assert r.status_code == 403

    def test_admin_delete_user(self, s, admin_token):
        # create a throwaway user
        email = f"del_{uuid.uuid4().hex[:8]}@example.com"
        r0 = s.post(f"{API}/auth/register", json={"name": "TEST Del", "email": email, "password": "Pass@123"})
        assert r0.status_code == 200
        uid = r0.json()["user"]["id"]
        r = s.delete(f"{API}/admin/users/{uid}", headers=H(admin_token))
        assert r.status_code == 200


# ------------- cleanup -------------
def test_zzz_delete_resume(s, user_token):
    if TestResumeAnalysis.resume_id:
        r = s.delete(f"{API}/resume/{TestResumeAnalysis.resume_id}", headers=H(user_token))
        assert r.status_code == 200
        # verify 404
        r2 = s.get(f"{API}/resume/{TestResumeAnalysis.resume_id}", headers=H(user_token))
        assert r2.status_code == 404
