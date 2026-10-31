from io import BytesIO
from pathlib import Path

from werkzeug.security import check_password_hash

from backend.database import db
from backend.models import Candidate, Screening, User

PROJECT_ROOT = Path(__file__).resolve().parents[2]
SAMPLE_PDF = PROJECT_ROOT / "AI-powered-Resume-Screening-and-Ranking-System.pdf"
TEST_PASSWORD = "test-password-123"


def _create_recruiter(client, register_recruiter, email):
    response = register_recruiter(email, name="Example Recruiter", password=TEST_PASSWORD)
    assert response.status_code == 201
    login = client.post("/api/auth/login", json={
        "email": email,
        "password": TEST_PASSWORD,
    })
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.get_json()['access_token']}"}


def _screening_request(client, headers, filename):
    return client.post(
        "/api/resume/screen",
        data={
            "job_description": "Python Flask REST API development",
            "resumes": [(BytesIO(SAMPLE_PDF.read_bytes()), filename)],
        },
        content_type="multipart/form-data",
        headers=headers,
    )


def test_register_duplicate_password_hash_and_login(client, app, register_recruiter):
    email = "rishi@example.test"
    register = register_recruiter(email, name="Rishi Singh", password=TEST_PASSWORD)
    assert register.status_code == 201
    assert register.get_json() == {
        "success": True,
        "message": "Recruiter account created",
    }
    assert "password_hash" not in register.get_json()

    duplicate = register_recruiter(email.upper(), name="Duplicate", password=TEST_PASSWORD)
    assert duplicate.status_code == 409

    with app.app_context():
        user = db.session.scalar(db.select(User).where(User.email == email))
        assert user.role == "recruiter"
        assert user.password_hash != TEST_PASSWORD
        assert check_password_hash(user.password_hash, TEST_PASSWORD)

    login = client.post("/api/auth/login", json={"email": email, "password": TEST_PASSWORD})
    assert login.status_code == 200
    login_body = login.get_json()
    assert login_body["access_token"]
    assert login_body["user"] == {
        "id": user.id,
        "name": "Rishi Singh",
        "email": email,
        "role": "recruiter",
    }
    assert "password_hash" not in login_body["user"]

    invalid_email = client.post("/api/auth/login", json={"email": "nobody@example.test", "password": TEST_PASSWORD})
    invalid_password = client.post("/api/auth/login", json={"email": email, "password": "wrong-password"})
    assert invalid_email.status_code == invalid_password.status_code == 401
    assert invalid_email.get_json()["error"] == invalid_password.get_json()["error"]


def test_me_requires_token_and_health_remains_public(client, auth_headers):
    assert client.get("/api/health").status_code == 200
    assert client.get("/api/auth/me").status_code == 401

    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.get_json()["user"]["email"] == "owner@example.test"


def test_screening_and_candidate_reads_are_scoped_to_recruiter(
    client, app, register_recruiter
):
    first_headers = _create_recruiter(client, register_recruiter, "first@example.test")
    second_headers = _create_recruiter(client, register_recruiter, "second@example.test")

    first_response = _screening_request(client, first_headers, "first.pdf")
    second_response = _screening_request(client, second_headers, "second.pdf")
    assert first_response.status_code == second_response.status_code == 200
    first_body = first_response.get_json()
    second_body = second_response.get_json()
    assert first_body["success"] and second_body["success"]
    assert {"success", "count", "results"}.issubset(first_body)
    assert first_body["results"]
    expected_result_fields = {
        "rank", "filename", "candidate_name", "final_score", "skill_score",
        "tfidf_score", "keyword_score", "match_tier", "skill_analysis", "feedback",
    }
    assert expected_result_fields.issubset(first_body["results"][0])

    first_id = first_body["screening_id"]
    second_id = second_body["screening_id"]
    assert client.get(f"/api/screenings/{first_id}", headers=first_headers).status_code == 200
    assert client.get(f"/api/screenings/{second_id}", headers=first_headers).status_code == 404

    first_list = client.get("/api/screenings", headers=first_headers).get_json()
    assert [item["id"] for item in first_list["screenings"]] == [first_id]
    first_candidates = client.get("/api/candidates", headers=first_headers).get_json()
    assert first_candidates["count"] == first_body["count"]
    assert all(candidate["filename"] == "first.pdf" for candidate in first_candidates["candidates"])
    assert client.get("/api/candidates").status_code == 401

    with app.app_context():
        screenings = db.session.scalars(db.select(Screening).order_by(Screening.id)).all()
        assert len(screenings) == 2
        assert screenings[0].user_id != screenings[1].user_id
        assert db.session.scalar(db.select(db.func.count()).select_from(Candidate)) == 2


def test_protected_screening_post_requires_jwt(client):
    response = client.post(
        "/api/resume/screen",
        data={"job_description": "Python", "resumes": (BytesIO(b"not used"), "resume.pdf")},
        content_type="multipart/form-data",
    )
    assert response.status_code == 401