import re

from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, jwt_required
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from werkzeug.security import check_password_hash, generate_password_hash

from backend.auth_utils import get_authenticated_user
from backend.database import db
from backend.models import User

auth_bp = Blueprint("auth_bp", __name__)
EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
MIN_PASSWORD_LENGTH = 8


def _public_user(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
    }


@auth_bp.post("/register")
def register():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"success": False, "error": "A JSON request body is required."}), 400

    name = payload.get("name")
    email = payload.get("email")
    password = payload.get("password")
    if not isinstance(name, str) or not name.strip():
        return jsonify({"success": False, "error": "Name is required."}), 400
    if not isinstance(email, str) or not EMAIL_PATTERN.fullmatch(email.strip()):
        return jsonify({"success": False, "error": "A valid email address is required."}), 400
    if not isinstance(password, str) or len(password) < MIN_PASSWORD_LENGTH:
        return jsonify({
            "success": False,
            "error": f"Password must be at least {MIN_PASSWORD_LENGTH} characters long.",
        }), 400

    normalized_email = email.strip().lower()
    if db.session.scalar(select(User.id).where(User.email == normalized_email)) is not None:
        return jsonify({"success": False, "error": "An account with this email already exists."}), 409

    user = User(
        name=name.strip(),
        email=normalized_email,
        password_hash=generate_password_hash(password),
    )
    try:
        db.session.add(user)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"success": False, "error": "An account with this email already exists."}), 409
    except Exception:
        db.session.rollback()
        return jsonify({"success": False, "error": "An unexpected server error occurred."}), 500

    return jsonify({
        "success": True,
        "message": "Recruiter account created",
    }), 201


@auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"success": False, "error": "A JSON request body is required."}), 400

    email = payload.get("email")
    password = payload.get("password")
    if not isinstance(email, str) or not isinstance(password, str):
        return jsonify({"success": False, "error": "Email and password are required."}), 400

    user = db.session.scalar(
        select(User).where(User.email == email.strip().lower())
    )
    if user is None or not check_password_hash(user.password_hash, password):
        return jsonify({"success": False, "error": "Invalid email or password."}), 401

    return jsonify({
        "success": True,
        "access_token": create_access_token(identity=str(user.id)),
        "user": _public_user(user),
    }), 200


@auth_bp.get("/me")
@jwt_required()
def current_user():
    user = get_authenticated_user()
    if user is None:
        return jsonify({"success": False, "error": "Invalid authorization token."}), 401
    return jsonify({"success": True, "user": _public_user(user)}), 200