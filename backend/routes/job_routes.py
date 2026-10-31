from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from backend.auth_utils import get_authenticated_user
from backend.database import db
from backend.models import Job
from backend.services import job_service

jobs_bp = Blueprint("jobs_bp", __name__)
VALID_STATUSES = {"open", "closed", "archived"}
EDITABLE_FIELDS = {"title", "description", "status"}


def _serialize_job(job: Job) -> dict:
    return {
        "id": job.id,
        "user_id": job.user_id,
        "title": job.title,
        "description": job.description,
        "status": job.status,
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "updated_at": job.updated_at.isoformat() if job.updated_at else None,
    }


def _request_user():
    user = get_authenticated_user()
    if user is None:
        return None, (jsonify({"success": False, "error": "Invalid authorization token."}), 401)
    return user, None


def _validate_job_fields(payload: dict, required: bool = False):
    if not payload:
        return None, (jsonify({"success": False, "error": "At least one job field is required."}), 400)
    unknown_fields = set(payload) - EDITABLE_FIELDS
    if unknown_fields:
        return None, (jsonify({"success": False, "error": "Request contains unsupported fields."}), 400)

    changes = {}
    for field in ("title", "description"):
        if field not in payload:
            if required:
                return None, (jsonify({"success": False, "error": f"{field.capitalize()} is required."}), 400)
            continue
        value = payload[field]
        if not isinstance(value, str) or not value.strip():
            return None, (jsonify({"success": False, "error": f"{field.capitalize()} cannot be empty."}), 400)
        changes[field] = value.strip()

    if "status" in payload:
        status = payload["status"]
        if not isinstance(status, str) or status not in VALID_STATUSES:
            return None, (jsonify({"success": False, "error": "Status must be open, closed, or archived."}), 400)
        changes["status"] = status

    return changes, None


def _server_error():
    db.session.rollback()
    return jsonify({"success": False, "error": "An unexpected server error occurred."}), 500


@jobs_bp.post("")
@jwt_required()
def create_job():
    user, error = _request_user()
    if error:
        return error
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"success": False, "error": "A JSON request body is required."}), 400
    changes, error = _validate_job_fields(payload, required=True)
    if error:
        return error

    try:
        job = job_service.create_job(
            user_id=user.id,
            title=changes["title"],
            description=changes["description"],
            status=changes.get("status", "open"),
        )
    except Exception:
        return _server_error()
    return jsonify({"success": True, "job": _serialize_job(job)}), 201


@jobs_bp.get("")
@jwt_required()
def list_jobs():
    user, error = _request_user()
    if error:
        return error
    try:
        jobs = job_service.list_jobs_for_user(user.id)
    except Exception:
        return _server_error()
    return jsonify({
        "success": True,
        "count": len(jobs),
        "jobs": [_serialize_job(job) for job in jobs],
    }), 200


@jobs_bp.get("/<int:job_id>")
@jwt_required()
def get_job(job_id: int):
    user, error = _request_user()
    if error:
        return error
    try:
        job = job_service.get_owned_job(job_id, user.id)
    except Exception:
        return _server_error()
    if job is None:
        return jsonify({"success": False, "error": "Job not found."}), 404
    return jsonify({"success": True, "job": _serialize_job(job)}), 200


@jobs_bp.put("/<int:job_id>")
@jwt_required()
def update_job(job_id: int):
    user, error = _request_user()
    if error:
        return error
    try:
        job = job_service.get_owned_job(job_id, user.id)
    except Exception:
        return _server_error()
    if job is None:
        return jsonify({"success": False, "error": "Job not found."}), 404

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"success": False, "error": "A JSON request body is required."}), 400
    changes, error = _validate_job_fields(payload)
    if error:
        return error
    try:
        job = job_service.update_job(job, changes)
    except Exception:
        return _server_error()
    return jsonify({"success": True, "job": _serialize_job(job)}), 200


@jobs_bp.delete("/<int:job_id>")
@jwt_required()
def delete_job(job_id: int):
    user, error = _request_user()
    if error:
        return error
    try:
        job = job_service.get_owned_job(job_id, user.id)
    except Exception:
        return _server_error()
    if job is None:
        return jsonify({"success": False, "error": "Job not found."}), 404
    try:
        job = job_service.archive_job(job)
    except Exception:
        return _server_error()
    return jsonify({"success": True, "job": _serialize_job(job)}), 200