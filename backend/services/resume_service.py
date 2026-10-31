import sys
from pathlib import Path
from typing import List, Dict, Any, Optional

# Ensure project root is in sys.path so modules can be imported consistently
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from modules.pdf_parser import extract_text_from_pdf
from modules.text_processor import extract_candidate_info
from modules.skill_extractor import extract_skills_from_text
from modules.scoring_engine import rank_all_candidates
from backend.database import db
from backend.models import Candidate, Screening


def screen_resumes(
    job_description: str,
    files: List[Any],
    user_id: int,
    job_title: Optional[str] = None,
    job_id: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Processes uploaded resumes against a job description, extracts candidate information
    and skills, and computes candidate rankings reusing the existing scoring engine.

    Args:
        job_description: The job description text to screen candidates against.
        files: List of file-like objects (e.g. Werkzeug FileStorage, bytes, or tuples).

    Returns:
        A dictionary containing success status, count of ranked candidates, ranked results,
        and per-file errors if any were encountered.
    """
    parsed_candidates: List[Dict[str, Any]] = []
    file_errors: List[Dict[str, str]] = []

    for file_item in files:
        filename = "resume.pdf"
        try:
            # Handle Werkzeug FileStorage / file-like objects
            if hasattr(file_item, "read"):
                filename = getattr(file_item, "filename", "") or "resume.pdf"
                file_bytes = file_item.read()
                if hasattr(file_item, "seek"):
                    file_item.seek(0)
            elif isinstance(file_item, tuple) and len(file_item) == 2:
                filename, file_bytes = file_item
            elif isinstance(file_item, bytes):
                file_bytes = file_item
            else:
                file_errors.append({
                    "filename": getattr(file_item, "filename", "unknown"),
                    "error": "Unsupported file input type."
                })
                continue

            # Extract text and metadata using existing PDF parser
            parsed = extract_text_from_pdf(file_bytes)

            # Check if parsing was completely unsuccessful (fatal error with zero text)
            if parsed.get("error") and not parsed.get("text"):
                file_errors.append({
                    "filename": filename,
                    "error": parsed["error"]
                })
                continue

            # Extract contact info and skills from extracted text
            cand_info = extract_candidate_info(parsed["text"], filename)
            cand_skills = extract_skills_from_text(parsed["text"])

            # Maintain exact candidate structure expected by scoring engine & Main.py
            candidate_entry = {
                "filename": filename,
                "text": parsed["text"],
                "page_count": parsed["page_count"],
                "char_count": parsed["char_count"],
                "is_scanned": parsed.get("is_scanned", False),
                "error": parsed.get("error"),
                "candidate_info": cand_info,
                "extracted_skills": sorted(list(cand_skills))
            }

            parsed_candidates.append(candidate_entry)

        except Exception as e:
            # Catch corrupt or malformed files without terminating batch processing
            file_errors.append({
                "filename": filename,
                "error": f"Failed to parse resume: {str(e)}"
            })

    # If no valid candidates could be parsed
    if not parsed_candidates:
        return {
            "success": False,
            "count": 0,
            "results": [],
            "errors": file_errors,
            "message": "No valid text could be extracted from the uploaded resumes."
        }

    # Rank all successfully parsed candidates using existing scoring engine
    ranked_results = rank_all_candidates(job_description, parsed_candidates)

    screening_id = None
    if ranked_results:
        screening = Screening(
            user_id=user_id,
            job_id=job_id,
            job_title=job_title,
            job_description=job_description,
        )
        candidates = []
        for result in ranked_results:
            skill_analysis = result.get("skill_analysis") or {}
            candidates.append(Candidate(
                screening=screening,
                rank=result["rank"],
                candidate_name=result.get("candidate_name"),
                email=result.get("email"),
                phone=result.get("phone"),
                linkedin=result.get("linkedin"),
                github=result.get("github"),
                filename=result["filename"],
                final_score=result["final_score"],
                skill_score=result["skill_score"],
                tfidf_score=result["tfidf_score"],
                keyword_score=result["keyword_score"],
                match_tier=result["match_tier"],
                matched_skills=skill_analysis.get("matched_skills", []),
                missing_skills=skill_analysis.get("missing_skills", []),
                extra_skills=skill_analysis.get("extra_skills", []),
                feedback=result.get("feedback"),
            ))

        try:
            db.session.add(screening)
            db.session.add_all(candidates)
            db.session.flush()
            screening_id = screening.id
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

    # Attach any parser warnings (e.g. scanned PDF note) and extracted skills to results
    cand_lookup = {c["filename"]: c for c in parsed_candidates}
    for res in ranked_results:
        cand_entry = cand_lookup.get(res["filename"])
        if cand_entry:
            res["error"] = cand_entry.get("error")
            res["extracted_skills"] = cand_entry.get("extracted_skills", [])

    response: Dict[str, Any] = {
        "success": True,
        "count": len(ranked_results),
        "results": ranked_results
    }
    if screening_id is not None:
        response["screening_id"] = screening_id

    if file_errors:
        response["errors"] = file_errors

    return response
