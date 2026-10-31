from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import select

from backend.auth_utils import get_authenticated_user
from backend.database import db
from backend.models import Candidate, Screening

screenings_bp = Blueprint("screenings_bp", __name__)


def _serialize_candidate(candidate: Candidate) -> dict:
    return {
        "id": candidate.id,
        "screening_id": candidate.screening_id,
        "rank": candidate.rank,
        "candidate_name": candidate.candidate_name,
        "email": candidate.email,
        "phone": candidate.phone,
        "linkedin": candidate.linkedin,
        "github": candidate.github,
        "filename": candidate.filename,
        "final_score": candidate.final_score,
        "skill_score": candidate.skill_score,
        "tfidf_score": candidate.tfidf_score,
        "keyword_score": candidate.keyword_score,
        "match_tier": candidate.match_tier,
        "matched_skills": candidate.matched_skills,
        "missing_skills": candidate.missing_skills,
        "extra_skills": candidate.extra_skills,
        "feedback": candidate.feedback,
    }


def _serialize_screening(screening: Screening, include_candidates: bool = False) -> dict:
    data = {
        "id": screening.id,
        "job_title": screening.job_title,
        "job_description": screening.job_description,
        "created_at": screening.created_at.isoformat() if screening.created_at else None,
    }
    if include_candidates:
        data["candidates"] = [
            _serialize_candidate(candidate)
            for candidate in sorted(screening.candidates, key=lambda item: item.rank)
        ]
    else:
        data["candidate_count"] = len(screening.candidates)
    return data


@screenings_bp.get("/screenings")
@jwt_required()
def list_screenings():
    user = get_authenticated_user()
    if user is None:
        return jsonify({"success": False, "error": "Invalid authorization token."}), 401
    screenings = db.session.scalars(
        select(Screening)
        .where(Screening.user_id == user.id)
        .order_by(Screening.created_at.desc(), Screening.id.desc())
    ).all()
    return jsonify({
        "success": True,
        "count": len(screenings),
        "screenings": [_serialize_screening(item) for item in screenings],
    }), 200


@screenings_bp.get("/screenings/<int:screening_id>")
@jwt_required()
def get_screening(screening_id: int):
    user = get_authenticated_user()
    if user is None:
        return jsonify({"success": False, "error": "Invalid authorization token."}), 401
    screening = db.session.scalar(
        select(Screening).where(
            Screening.id == screening_id,
            Screening.user_id == user.id,
        )
    )
    if screening is None:
        return jsonify({
            "success": False,
            "error": "Screening not found.",
        }), 404

    return jsonify({
        "success": True,
        "screening": _serialize_screening(screening, include_candidates=True),
    }), 200


@screenings_bp.get("/candidates")
@jwt_required()
def list_candidates():
    user = get_authenticated_user()
    if user is None:
        return jsonify({"success": False, "error": "Invalid authorization token."}), 401
    candidates = db.session.scalars(
        select(Candidate)
        .join(Screening)
        .where(Screening.user_id == user.id)
        .order_by(Screening.created_at.desc(), Screening.id.desc(), Candidate.rank.asc())
    ).all()
    return jsonify({
        "success": True,
        "count": len(candidates),
        "candidates": [_serialize_candidate(candidate) for candidate in candidates],
    }), 200