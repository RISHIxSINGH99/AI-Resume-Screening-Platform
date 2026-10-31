from io import BytesIO
from pathlib import Path

import pytest

from backend.database import db
from backend.models import Candidate, Job, Screening

PROJECT_ROOT = Path(__file__).resolve().parents[2]
SAMPLE_PDF = PROJECT_ROOT / "AI-powered-Resume-Screening-and-Ranking-System.pdf"


def _screen(client, headers, job_id=None):
    data = {
        "job_description": "Python Flask REST API development",
        "resumes": [(BytesIO(SAMPLE_PDF.read_bytes()), "screening-candidate.pdf")],
    }
    if job_id is not None:
        data["job_id"] = str(job_id)
    return client.post(
        "/api/resume/screen",
        data=data,
        content_type="multipart/form-data",
        headers=headers,
    )


def _create_job(client, headers, status="open"):
    response = client.post("/api/jobs", headers=headers, json={
        "title": "Senior Python Developer",
        "description": "Flask, AWS and Docker",
    })
    assert response.status_code == 201
    job = response.get_json()["job"]
    if status != "open":
        response = client.put(
            f"/api/jobs/{job['id']}", headers=headers, json={"status": status}
        )
        assert response.status_code == 200
    return job["id"]


def _other_recruiter_headers(client, register_recruiter):
    email = "screening-job-owner@example.test"
    password = "test-password-123"
    registered = register_recruiter(email, name="Other Recruiter", password=password)
    assert registered.status_code == 201
    login = client.post("/api/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.get_json()['access_token']}"}


def test_screening_without_job_id_remains_compatible(client, app, auth_headers):
    response = _screen(client, auth_headers)
    assert response.status_code == 200, response.get_json()
    body = response.get_json()
    assert body["success"] is True
    assert body["screening_id"]
    assert body["results"]

    with app.app_context():
        screening = db.session.get(Screening, body["screening_id"])
        assert screening.job_id is None
        assert screening.user_id is not None
        assert len(screening.candidates) == body["count"]


def test_screening_with_owned_open_job_persists_relationship_and_candidates(
    client, app, auth_headers
):
    job_id = _create_job(client, auth_headers)
    response = _screen(client, auth_headers, job_id)
    assert response.status_code == 200, response.get_json()
    body = response.get_json()
    assert body["screening_id"]
    assert body["count"] == len(body["results"]) >= 1
    assert {"success", "count", "results", "screening_id"}.issubset(body)

    with app.app_context():
        screening = db.session.get(Screening, body["screening_id"])
        job = db.session.get(Job, job_id)
        assert screening.job_id == job_id
        assert screening.user_id == job.user_id
        assert screening.job_title == job.title
        assert screening.job_description == "Python Flask REST API development"
        assert len(screening.candidates) == body["count"]
        assert all(candidate.screening_id == screening.id for candidate in screening.candidates)
        assert db.session.query(Candidate).filter_by(screening_id=screening.id).count() == body["count"]


def test_invalid_or_unowned_job_id_is_not_accessible(
    client, auth_headers, register_recruiter
):
    other_headers = _other_recruiter_headers(client, register_recruiter)
    other_job_id = _create_job(client, other_headers)

    invalid_integer = _screen(client, auth_headers, "not-an-integer")
    nonexistent = _screen(client, auth_headers, 999999)
    other_owners_job = _screen(client, auth_headers, other_job_id)
    assert invalid_integer.status_code == 400
    assert nonexistent.status_code == 404
    assert other_owners_job.status_code == 404
    assert nonexistent.get_json()["error"] == other_owners_job.get_json()["error"]


@pytest.mark.parametrize("status", ["closed", "archived"])
def test_non_open_jobs_reject_new_screenings(client, auth_headers, status):
    job_id = _create_job(client, auth_headers, status=status)
    response = _screen(client, auth_headers, job_id)
    assert response.status_code == 400
    assert "open" in response.get_json()["error"]