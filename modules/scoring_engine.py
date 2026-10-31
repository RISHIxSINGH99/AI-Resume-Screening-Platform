from typing import List, Dict, Any, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from modules.text_processor import clean_text
from modules.skill_extractor import extract_skills_from_text, analyze_skill_match, format_skill_name
from modules.embedding_engine import compute_semantic_similarity
from modules.reranker_engine import compute_reranker_scores

RERANKER_WEIGHT = 0.35
SEMANTIC_WEIGHT = 0.25
SKILL_WEIGHT = 0.25
TFIDF_WEIGHT = 0.10
KEYWORD_WEIGHT = 0.05


def compute_tfidf_similarity(jd_text: str, resume_texts: List[str]) -> List[float]:
    """
    Computes TF-IDF vector cosine similarity between Job Description and multiple resumes.
    Returns scores scaled 0 - 100.
    """
    if not jd_text or not resume_texts:
        return [0.0] * len(resume_texts)

    cleaned_jd = clean_text(jd_text)
    cleaned_resumes = [clean_text(r) for r in resume_texts]

    # Combine documents
    documents = [cleaned_jd] + cleaned_resumes

    try:
        vectorizer = TfidfVectorizer(
            stop_words='english',
            ngram_range=(1, 2),
            max_features=5000
        )
        tfidf_matrix = vectorizer.fit_transform(documents)
        
        jd_vector = tfidf_matrix[0:1]
        resume_vectors = tfidf_matrix[1:]

        similarities = cosine_similarity(jd_vector, resume_vectors).flatten()
        return [round(float(sim * 100), 2) for sim in similarities]

    except Exception:
        return [0.0] * len(resume_texts)


def compute_keyword_overlap(jd_text: str, resume_text: str) -> float:
    """
    Calculates word set overlap ratio between JD and Resume after cleaning.
    """
    cleaned_jd = set(clean_text(jd_text).split())
    cleaned_resume = set(clean_text(resume_text).split())

    if not cleaned_jd:
        return 0.0

    overlap = cleaned_jd.intersection(cleaned_resume)
    return round((len(overlap) / len(cleaned_jd)) * 100, 2)


def evaluate_candidate(
    jd_text: str,
    resume_text: str,
    tfidf_score: float,
    semantic_score: float = 0.0,
    reranker_score: float = 0.0,
) -> Dict[str, Any]:
    """
    Evaluates a candidate's resume against a job description using multi-factor scoring.
    """
    # Skill Extraction & Comparison
    jd_skills = extract_skills_from_text(jd_text)
    candidate_skills = extract_skills_from_text(resume_text)
    skill_analysis = analyze_skill_match(jd_skills, candidate_skills)

    # Keyword Overlap
    keyword_score = compute_keyword_overlap(jd_text, resume_text)

    # Keep the original formula for comparison with historical scoring behavior.
    skill_score = skill_analysis["coverage_score"]
    old_final_score = round(
        min(max((0.40 * tfidf_score) + (0.40 * skill_score) + (0.20 * keyword_score), 0.0), 100.0),
        1,
    )

    # Experimental comparison weights: reranker 35%, semantic 25%, skills 25%,
    # TF-IDF 10%, keywords 5%. These are engineering starting points, not
    # scientifically validated optima.
    # These are an initial transparent weighting, not scientifically optimized weights.
    weighted_score = (
        (RERANKER_WEIGHT * reranker_score)
        + (SEMANTIC_WEIGHT * semantic_score)
        + (SKILL_WEIGHT * skill_score)
        + (TFIDF_WEIGHT * tfidf_score)
        + (KEYWORD_WEIGHT * keyword_score)
    )
    new_final_score = round(min(max(weighted_score, 0.0), 100.0), 1)
    final_score = new_final_score

    # Determine Match Tier & Badge
    if final_score >= 80.0:
        match_tier = "Top Candidate"
        match_badge = "🌟 Top Fit"
        color = "#10B981"  # Emerald Green
    elif final_score >= 65.0:
        match_tier = "Strong Match"
        match_badge = "✅ Strong Fit"
        color = "#3B82F6"  # Blue
    elif final_score >= 50.0:
        match_tier = "Moderate Match"
        match_badge = "⚠️ Moderate Fit"
        color = "#F59E0B"  # Amber
    else:
        match_tier = "Low Match"
        match_badge = "❌ Low Fit"
        color = "#EF4444"  # Red

    # Generate Feedback Summary
    matched_str = ", ".join(skill_analysis["matched_skills"][:4]) if skill_analysis["matched_skills"] else "General experience"
    missing_str = ", ".join(skill_analysis["missing_skills"][:3]) if skill_analysis["missing_skills"] else "None"

    if final_score >= 75.0:
        feedback = f"Strong alignment with key requirements. High match in {matched_str}."
    elif final_score >= 50.0:
        feedback = f"Partial fit. Demonstrates skills in {matched_str}, but missing key requirements: {missing_str}."
    else:
        feedback = f"Low relevance to job description. Missing primary requirements: {missing_str}."

    return {
        "final_score": final_score,
        "old_final_score": old_final_score,
        "new_final_score": new_final_score,
        "semantic_score": round(min(max(semantic_score, 0.0), 100.0), 2),
        "reranker_score": round(min(max(reranker_score, 0.0), 100.0), 2),
        "tfidf_score": round(tfidf_score, 1),
        "skill_score": round(skill_score, 1),
        "keyword_score": round(keyword_score, 1),
        "match_tier": match_tier,
        "match_badge": match_badge,
        "badge_color": color,
        "skill_analysis": skill_analysis,
        "feedback": feedback
    }


def rank_all_candidates(
    jd_text: str,
    candidates: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Takes list of parsed candidate objects, computes TF-IDF and multi-factor scores,
    and returns candidates sorted by final score descending.
    """
    if not candidates or not jd_text.strip():
        return []

    resume_texts = [c["text"] for c in candidates]
    tfidf_scores = compute_tfidf_similarity(jd_text, resume_texts)
    semantic_scores = compute_semantic_similarity(jd_text, resume_texts)
    reranker_scores, reranker_errors = compute_reranker_scores(jd_text, resume_texts)

    results = []
    for idx, cand in enumerate(candidates):
        eval_result = evaluate_candidate(
            jd_text,
            cand["text"],
            tfidf_scores[idx],
            semantic_scores[idx],
            reranker_scores[idx],
        )
        if reranker_errors[idx]:
            eval_result["reranker_error"] = reranker_errors[idx]

        cand_result = {
            "rank": 0,
            "filename": cand["filename"],
            "candidate_name": cand["candidate_info"]["name"],
            "email": cand["candidate_info"]["email"],
            "phone": cand["candidate_info"]["phone"],
            "linkedin": cand["candidate_info"]["linkedin"],
            "github": cand["candidate_info"]["github"],
            "page_count": cand["page_count"],
            "char_count": cand["char_count"],
            "is_scanned": cand.get("is_scanned", False),
            **eval_result
        }
        results.append(cand_result)

    # Sort descending by final score
    results.sort(key=lambda x: x["final_score"], reverse=True)

    # Assign 1-indexed ranks
    for rank_idx, cand in enumerate(results, 1):
        cand["rank"] = rank_idx

    return results
