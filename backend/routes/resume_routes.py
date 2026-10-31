import sys
from pathlib import Path
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.services.resume_service import screen_resumes
from backend.services import job_service
from backend.auth_utils import get_authenticated_user
from backend.database import db
from modules.embedding_engine import SemanticEmbeddingError
from modules.reranker_engine import CrossEncoderModelError

resume_bp = Blueprint("resume_bp", __name__)


@resume_bp.route("/screen", methods=["POST"])
@jwt_required()
def screen_resumes_endpoint():
    """
    POST /api/resume/screen
    Accepts multipart/form-data:
      - job_description (string)
      - resumes (one or more PDF files)

    Validates inputs, extracts resume data, and returns candidate rankings.
    """
    try:
        user = get_authenticated_user()
        if user is None:
            return jsonify({"success": False, "error": "Invalid authorization token."}), 401

        # 1. Validate job_description
        job_description = request.form.get("job_description", "")
        if not job_description or not job_description.strip():
            return jsonify({
                "success": False,
                "error": "Field 'job_description' is required and cannot be empty."
            }), 400

        job = None
        job_id_value = request.form.get("job_id")
        if job_id_value is not None:
            try:
                job_id = int(job_id_value)
            except (TypeError, ValueError):
                return jsonify({
                    "success": False,
                    "error": "Field 'job_id' must be a valid integer.",
                }), 400

            job = job_service.get_owned_job(job_id, user.id)
            if job is None:
                return jsonify({
                    "success": False,
                    "error": "Job not found.",
                }), 404
            if job.status != "open":
                return jsonify({
                    "success": False,
                    "error": "Screenings can only be created for open jobs.",
                }), 400

        # 2. Validate uploaded resume files
        uploaded_files = request.files.getlist("resumes")
        if not uploaded_files or (len(uploaded_files) == 1 and uploaded_files[0].filename == ""):
            # Fallback to singular 'resume' field name
            uploaded_files = request.files.getlist("resume")

        # Filter out empty entries
        valid_files = [f for f in uploaded_files if f and f.filename and f.filename.strip() != ""]

        if not valid_files:
            return jsonify({
                "success": False,
                "error": "At least one PDF resume must be uploaded under the 'resumes' field."
            }), 400

        # 3. Reject non-PDF files with a clear error
        invalid_files = [f.filename for f in valid_files if not f.filename.lower().endswith(".pdf")]
        if invalid_files:
            return jsonify({
                "success": False,
                "error": f"Only PDF files are supported. Non-PDF file(s) detected: {', '.join(invalid_files)}"
            }), 400

        # 4. Process resumes through service layer
        result = screen_resumes(
            job_description=job_description.strip(),
            files=valid_files,
            user_id=user.id,
            job_title=job.title if job is not None else request.form.get("job_title") or None,
            job_id=job.id if job is not None else None,
        )

        # If all uploaded files failed parsing text
        if not result.get("success", False):
            return jsonify(result), 400

        return jsonify(result), 200

    except SemanticEmbeddingError:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": "Semantic similarity model is unavailable. Check the model installation and retry.",
        }), 503
    except CrossEncoderModelError:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": "Cross-encoder reranking is unavailable. Check the model installation and retry.",
        }), 503
    except Exception:
        db.session.rollback()
        return jsonify({
            "success": False,
            "error": "An unexpected server error occurred."
        }), 500
