"""Skill matching, ATS scoring, semantic similarity, readiness."""
from typing import Dict, Any, List, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re

from resume_service import (
    SKILL_CATALOG, SKILL_CATALOG_SET, ACTION_VERBS, EDUCATION_KEYWORDS,
    _extract_skills,
)


def extract_jd_skills(jd_text: str) -> List[str]:
    return _extract_skills(jd_text)


def skill_match(resume_skills: List[str], jd_skills: List[str]) -> Dict[str, Any]:
    r_set = {s.lower() for s in resume_skills}
    j_set = {s.lower() for s in jd_skills}
    matched = sorted(r_set & j_set)
    missing = sorted(j_set - r_set)
    # Recommended: adjacent skills from resume that aren't in JD but are in catalog
    recommended = sorted(list(r_set - j_set))[:10]
    pct = round((len(matched) / len(j_set) * 100), 1) if j_set else 0.0
    return {
        "matched": matched,
        "missing": missing,
        "recommended": recommended,
        "match_pct": pct,
    }


def semantic_similarity(resume_text: str, jd_text: str) -> float:
    """TF-IDF cosine similarity as embedding proxy (0..1)."""
    if not resume_text.strip() or not jd_text.strip():
        return 0.0
    vec = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), max_features=5000)
    tfidf = vec.fit_transform([resume_text, jd_text])
    sim = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
    return round(float(sim), 4)


def ats_score(text: str, extracted: Dict[str, Any], jd_skills: List[str],
              matched_skills: List[str]) -> Tuple[int, Dict[str, int], List[str]]:
    """Compute ATS score 0-100 across 8 parameters."""
    suggestions: List[str] = []
    lower = text.lower()

    # 1. Skills (max 20)
    skills_score = 0
    if jd_skills:
        skills_score = int(min(20, (len(matched_skills) / max(1, len(jd_skills))) * 20))
    else:
        skills_score = min(20, len(extracted.get("skills", [])))
    if skills_score < 12:
        suggestions.append("Add more relevant technical skills matching the job description.")

    # 2. Projects (max 12)
    projects = extracted.get("projects", [])
    projects_score = min(12, len(projects) * 3)
    if projects_score < 6:
        suggestions.append("Include at least 2-3 impactful projects with measurable results.")

    # 3. Education (max 10)
    education = extracted.get("education", [])
    edu_score = 0
    if education:
        edu_score = 8
    if any(k in lower for k in EDUCATION_KEYWORDS):
        edu_score = min(10, edu_score + 2)
    if edu_score < 6:
        suggestions.append("Clearly list your education with degree, institution and year.")

    # 4. Formatting (max 10) — heuristic: sections exist, length reasonable
    has_sections = sum(1 for k in ["experience", "education", "skills"] if k in lower)
    length_ok = 300 <= len(text.split()) <= 1400
    format_score = has_sections * 2 + (4 if length_ok else 0)
    format_score = min(10, format_score)
    if format_score < 7:
        suggestions.append("Use clear section headers (Experience, Education, Skills, Projects).")

    # 5. Experience (max 15)
    experience = extracted.get("experience", [])
    years = 0
    m = re.findall(r"(\d+)\s*\+?\s*years", lower)
    if m:
        try:
            years = max(int(x) for x in m)
        except Exception:
            years = 0
    exp_score = min(15, len(experience) * 2 + min(5, years))
    if exp_score < 8:
        suggestions.append("Expand your work experience with quantified achievements.")

    # 6. Keywords (max 15) — presence of JD keywords in resume text
    kw_score = 0
    if jd_skills:
        kw_score = int(min(15, (len(matched_skills) / max(1, len(jd_skills))) * 15))
    else:
        kw_score = 10
    if kw_score < 8:
        suggestions.append("Weave in more keywords from the job description naturally.")

    # 7. Action verbs (max 8)
    verb_count = sum(1 for v in ACTION_VERBS if re.search(rf"\b{v}\b", lower))
    action_score = min(8, verb_count)
    if action_score < 5:
        suggestions.append("Start bullet points with strong action verbs (Led, Built, Optimized, Delivered).")

    # 8. Achievements (max 10)
    ach = extracted.get("achievements", [])
    numbers = len(re.findall(r"\d+%|\$\d+|\d+\+", lower))
    ach_score = min(10, len(ach) * 2 + min(4, numbers))
    if ach_score < 5:
        suggestions.append("Add quantified achievements (e.g., 'Improved throughput by 35%').")

    breakdown = {
        "Skills": skills_score,
        "Projects": projects_score,
        "Education": edu_score,
        "Formatting": format_score,
        "Experience": exp_score,
        "Keywords": kw_score,
        "Action Verbs": action_score,
        "Achievements": ach_score,
    }
    total = sum(breakdown.values())
    return total, breakdown, suggestions


def interview_readiness(ats: int, similarity: float, matched_count: int,
                        projects_count: int, experience_count: int) -> int:
    """0-100 readiness combining multiple signals."""
    ats_c = ats * 0.4
    sim_c = similarity * 100 * 0.25
    skill_c = min(20, matched_count * 2)
    exp_c = min(10, projects_count * 2 + experience_count)
    total = int(ats_c + sim_c + skill_c + exp_c)
    return max(0, min(100, total))
