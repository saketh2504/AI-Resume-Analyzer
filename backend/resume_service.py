"""Resume text extraction & entity extraction (regex-based NER)."""
import re
import io
from typing import Dict, Any, List
import fitz  # PyMuPDF
from docx import Document

# Skills catalogue used for keyword-based extraction & matching.
SKILL_CATALOG = [
    # Programming languages
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust", "ruby",
    "php", "swift", "kotlin", "scala", "r", "matlab", "perl", "dart", "sql", "bash",
    "shell", "powershell",
    # Web / frontend
    "react", "reactjs", "nextjs", "next.js", "vue", "vuejs", "angular", "svelte",
    "html", "html5", "css", "css3", "tailwind", "tailwindcss", "bootstrap", "sass",
    "less", "webpack", "vite", "redux", "graphql", "material-ui", "shadcn",
    # Backend / API
    "node", "nodejs", "node.js", "express", "fastapi", "flask", "django", "spring",
    "spring boot", "laravel", "rails", "gin", "nestjs", "rest", "grpc", "websocket",
    # Data / ML
    "pandas", "numpy", "scikit-learn", "sklearn", "tensorflow", "pytorch", "keras",
    "xgboost", "lightgbm", "spark", "hadoop", "airflow", "dbt", "kafka", "hive",
    "nlp", "computer vision", "cv", "opencv", "huggingface", "transformers",
    "sentence transformers", "faiss", "langchain", "llm", "spacy",
    # Cloud / DevOps
    "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s", "terraform",
    "ansible", "jenkins", "gitlab", "github actions", "circleci", "nginx", "linux",
    "prometheus", "grafana", "helm", "istio",
    # DB
    "mysql", "postgresql", "postgres", "mongodb", "redis", "cassandra", "dynamodb",
    "sqlite", "oracle", "elasticsearch", "snowflake", "bigquery", "redshift",
    # Tools / misc
    "git", "jira", "confluence", "figma", "postman", "swagger", "unittest", "pytest",
    "selenium", "cypress", "playwright", "agile", "scrum", "kanban",
    # Soft skills (for behavioral)
    "leadership", "communication", "teamwork", "problem solving", "time management",
]

SKILL_CATALOG_SET = {s.lower() for s in SKILL_CATALOG}

SKILL_CATEGORIES = {
    "Languages": {"python", "java", "javascript", "typescript", "c++", "c#", "go", "rust",
                  "ruby", "php", "swift", "kotlin", "scala", "r", "sql", "bash", "shell"},
    "Frontend": {"react", "reactjs", "nextjs", "next.js", "vue", "angular", "svelte",
                 "html", "html5", "css", "tailwind", "redux", "webpack", "vite"},
    "Backend": {"node", "nodejs", "express", "fastapi", "flask", "django", "spring",
                "spring boot", "laravel", "rails", "graphql", "rest"},
    "Data/ML": {"pandas", "numpy", "scikit-learn", "sklearn", "tensorflow", "pytorch",
                "keras", "xgboost", "spark", "airflow", "nlp", "opencv", "huggingface",
                "langchain", "llm", "transformers"},
    "Cloud/DevOps": {"aws", "azure", "gcp", "docker", "kubernetes", "terraform",
                     "jenkins", "github actions", "nginx", "linux", "helm"},
    "Databases": {"mysql", "postgresql", "postgres", "mongodb", "redis", "dynamodb",
                  "elasticsearch", "snowflake", "bigquery"},
    "Tools": {"git", "jira", "figma", "postman", "pytest", "selenium", "cypress",
              "playwright"},
}

ACTION_VERBS = {
    "led", "built", "designed", "developed", "implemented", "created", "launched",
    "improved", "optimized", "reduced", "increased", "delivered", "architected",
    "automated", "migrated", "shipped", "owned", "spearheaded", "streamlined",
    "engineered", "deployed", "scaled", "mentored", "coordinated", "resolved",
}

EDUCATION_KEYWORDS = [
    "bachelor", "b.tech", "btech", "b.e", "bsc", "b.sc", "bs ", "master", "m.tech",
    "mtech", "msc", "m.sc", "ms ", "mba", "phd", "ph.d", "diploma", "high school",
    "university", "college", "institute",
]


def extract_text_from_pdf(data: bytes) -> str:
    with fitz.open(stream=data, filetype="pdf") as doc:
        return "\n".join(page.get_text() for page in doc)


def extract_text_from_docx(data: bytes) -> str:
    d = Document(io.BytesIO(data))
    return "\n".join(p.text for p in d.paragraphs)


def extract_text(filename: str, data: bytes) -> str:
    name = filename.lower()
    if name.endswith(".pdf"):
        return extract_text_from_pdf(data)
    if name.endswith(".docx"):
        return extract_text_from_docx(data)
    raise ValueError("Only .pdf and .docx files are supported")


def _find_email(text: str) -> str:
    m = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    return m.group(0) if m else ""


def _find_phone(text: str) -> str:
    m = re.search(r"(\+?\d{1,3}[\s\-.]?)?\(?\d{3,4}\)?[\s\-.]?\d{3,4}[\s\-.]?\d{3,4}", text)
    return m.group(0).strip() if m else ""


def _find_name(text: str) -> str:
    # Heuristic: first non-empty line that looks like a name (2-4 capitalized words, no digits)
    for line in text.splitlines()[:15]:
        line = line.strip()
        if not line or "@" in line or any(c.isdigit() for c in line):
            continue
        tokens = line.split()
        if 1 <= len(tokens) <= 5 and all(t[0].isupper() for t in tokens if t and t[0].isalpha()):
            if len(line) <= 60:
                return line
    return ""


def _extract_skills(text: str) -> List[str]:
    lower = text.lower()
    found = []
    for skill in SKILL_CATALOG:
        # word boundary match
        pattern = r"(?<![a-zA-Z0-9])" + re.escape(skill) + r"(?![a-zA-Z0-9])"
        if re.search(pattern, lower):
            found.append(skill)
    # dedupe preserve order
    seen = set()
    out = []
    for s in found:
        if s not in seen:
            seen.add(s)
            out.append(s)
    return out


def _extract_section(text: str, header_variants: List[str], next_headers: List[str]) -> str:
    """Extract a section by header until next known header or EOF."""
    lower = text.lower()
    start_idx = -1
    for h in header_variants:
        idx = lower.find(h)
        if idx != -1:
            start_idx = idx
            break
    if start_idx == -1:
        return ""
    # find end
    end_idx = len(text)
    for h in next_headers:
        idx = lower.find(h, start_idx + 5)
        if idx != -1 and idx < end_idx:
            end_idx = idx
    return text[start_idx:end_idx].strip()


ALL_HEADERS = [
    "experience", "work experience", "professional experience", "employment",
    "education", "projects", "project", "skills", "technical skills",
    "certifications", "certificates", "achievements", "awards", "summary",
    "objective", "publications", "activities", "languages", "interests",
]


def _extract_bulleted(section: str) -> List[str]:
    if not section:
        return []
    lines = re.split(r"[\r\n]+", section)
    items = []
    for ln in lines[1:]:  # skip header line
        s = ln.strip(" \t-•●◦*·")
        if len(s) > 10:
            items.append(s)
    return items[:10]


def extract_entities(text: str) -> Dict[str, Any]:
    """Regex-based NER for resume."""
    email = _find_email(text)
    phone = _find_phone(text)
    name = _find_name(text)
    skills = _extract_skills(text)

    experience_sec = _extract_section(text, ["experience", "work experience", "employment"], ALL_HEADERS)
    education_sec = _extract_section(text, ["education"], ALL_HEADERS)
    projects_sec = _extract_section(text, ["projects", "project"], ALL_HEADERS)
    certs_sec = _extract_section(text, ["certifications", "certificates"], ALL_HEADERS)
    achievements_sec = _extract_section(text, ["achievements", "awards"], ALL_HEADERS)
    summary_sec = _extract_section(text, ["summary", "objective"], ALL_HEADERS)

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "summary": summary_sec[:600] if summary_sec else "",
        "skills": skills,
        "education": _extract_bulleted(education_sec),
        "experience": _extract_bulleted(experience_sec),
        "projects": _extract_bulleted(projects_sec),
        "certificates": _extract_bulleted(certs_sec),
        "achievements": _extract_bulleted(achievements_sec),
    }


def skill_categories(skills: List[str]) -> Dict[str, int]:
    """Group skills into categories with counts."""
    result = {k: 0 for k in SKILL_CATEGORIES}
    result["Other"] = 0
    lower_skills = [s.lower() for s in skills]
    for s in lower_skills:
        placed = False
        for cat, cat_skills in SKILL_CATEGORIES.items():
            if s in cat_skills:
                result[cat] += 1
                placed = True
                break
        if not placed:
            result["Other"] += 1
    return {k: v for k, v in result.items() if v > 0}
