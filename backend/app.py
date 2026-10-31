import os
import secrets
import sys
from datetime import timedelta
from pathlib import Path

# Ensure project root is in sys.path so modules can be imported consistently
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from flask import Flask, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
from backend.database import db
from backend.extensions import jwt

from backend.routes.resume_routes import resume_bp
from backend.routes.screening_routes import screenings_bp
from backend.routes.auth_routes import auth_bp
from backend.routes.job_routes import jobs_bp

migrate = Migrate()


def create_app() -> Flask:
    """
    Application factory for the AI Resume Screening Flask API.
    """
    app = Flask(__name__, instance_path=str(PROJECT_ROOT / "instance"))
    jwt_secret_key = os.environ.get("JWT_SECRET_KEY")
    if not jwt_secret_key and os.environ.get("APP_ENV", "development").lower() == "production":
        raise RuntimeError("JWT_SECRET_KEY must be set in production.")
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
        "DATABASE_URL", "sqlite:///resume_screening.db"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = jwt_secret_key or secrets.token_urlsafe(32)
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)

    db.init_app(app)
    jwt.init_app(app)

    from backend import models

    migrate.init_app(app, db)

    @jwt.unauthorized_loader
    def missing_jwt_response(_reason):
        return jsonify({"success": False, "error": "Authorization token required."}), 401

    @jwt.invalid_token_loader
    def invalid_jwt_response(_reason):
        return jsonify({"success": False, "error": "Invalid authorization token."}), 401

    @jwt.expired_token_loader
    def expired_jwt_response(_jwt_header, _jwt_payload):
        return jsonify({"success": False, "error": "Authorization token has expired."}), 401

    # Enable Cross-Origin Resource Sharing (CORS)
    CORS(app)

    # Health check endpoint
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "success": True,
            "message": "AI Resume Screening API is running"
        }), 200

    # Register API blueprints
    app.register_blueprint(resume_bp, url_prefix="/api/resume")
    app.register_blueprint(screenings_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(jobs_bp, url_prefix="/api/jobs")

    @app.errorhandler(500)
    def internal_server_error(_error):
        return jsonify({
            "success": False,
            "error": "An unexpected server error occurred.",
        }), 500

    return app


app = create_app()
import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
