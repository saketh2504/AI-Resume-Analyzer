from typing import Dict, Any, List

async def generate_suggestions(
    resume_text: str,
    jd_text: str,
    matched: List[str],
    missing: List[str]
) -> Dict[str, Any]:

    return {
        "missing_keywords": missing[:10],
        "weak_bullets": [],
        "rewritten_bullets": [],
        "grammar_fixes": [],
        "professional_summary": "AI suggestions are temporarily disabled.",
        "recommended_certifications": [],
        "recommended_projects": [],
        "recommended_technologies": []
    }


async def generate_interview_questions(
    role: str,
    jd_text: str,
    resume_text: str,
    types: List[str],
    difficulty: str,
    count_per_type: int
):
    return []