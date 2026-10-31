from backend.database import db
from backend.models import Candidate, Job, Screening, User


def _create_job(client, headers, title="Senior Python Developer", description="Flask, AWS and Docker"):
    return client.post("/api/jobs", headers=headers, json={
        "title": title,
        "description": description,
    })


def _register_and_login(client, register_recruiter, email):
    password = "test-password-123"
    registered = register_recruiter(email, name="Another Recruiter", password=password)
    assert registered.status_code == 201
    login = client.post("/api/auth/login", json={"email": email, "password": password})
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.get_json()['access_token']}"}


def test_create_job_and_validate_required_fields(client, auth_headers):
    missing_title = client.post(
        "/api/jobs",
        headers=auth_headers,
        json={"description": "Flask and AWS experience"},
    )
    missing_description = client.post(
        "/api/jobs",
        headers=auth_headers,
        json={"title": "Python Developer"},
    )
    empty_title = client.post(
        "/api/jobs",
        headers=auth_headers,
        json={"title": "  ", "description": "Flask role"},
    )
    assert missing_title.status_code == 400
    assert missing_description.status_code == 400
    assert empty_title.status_code == 400

    response = _create_job(client, auth_headers)
    assert response.status_code == 201
    job = response.get_json()["job"]
    assert job["title"] == "Senior Python Developer"
    assert job["description"] == "Flask, AWS and Docker"
    assert job["status"] == "open"
    assert job["created_at"]
    assert job["updated_at"]


def test_jobs_are_visible_and_mutable_only_to_the_owner(
    client, auth_headers, register_recruiter
):
    other_headers = _register_and_login(
        client, register_recruiter, "other-jobs@example.test"
    )
    own_job = _create_job(client, auth_headers, "Owned job", "Owned description").get_json()["job"]
    other_job = _create_job(client, other_headers, "Private job", "Private description").get_json()["job"]

    own_jobs = client.get("/api/jobs", headers=auth_headers).get_json()["jobs"]
    assert [job["id"] for job in own_jobs] == [own_job["id"]]
    assert client.get(f"/api/jobs/{own_job['id']}", headers=auth_headers).status_code == 200
    assert client.get(f"/api/jobs/{other_job['id']}", headers=auth_headers).status_code == 404

    forbidden_update = client.put(
        f"/api/jobs/{other_job['id']}",
        headers=auth_headers,
        json={"title": "Hijacked title"},
    )
    forbidden_archive = client.delete(
        f"/api/jobs/{other_job['id']}", headers=auth_headers
    )
    assert forbidden_update.status_code == 404
    assert forbidden_archive.status_code == 404
    assert client.get(f"/api/jobs/{other_job['id']}", headers=other_headers).get_json()["job"]["title"] == "Private job"


def test_owner_can_update_job_and_set_closed_or_archived_status(client, auth_headers):
    job = _create_job(client, auth_headers).get_json()["job"]
    update = client.put(
        f"/api/jobs/{job['id']}",
        headers=auth_headers,
        json={
            "title": "Updated Python Developer",
            "description": "Updated role description",
            "status": "closed",
        },
    )
    assert update.status_code == 200
    assert update.get_json()["job"]["title"] == "Updated Python Developer"
    assert update.get_json()["job"]["status"] == "closed"

    archived = client.put(
        f"/api/jobs/{job['id']}", headers=auth_headers, json={"status": "archived"}
    )
    assert archived.status_code == 200
    assert archived.get_json()["job"]["status"] == "archived"

    invalid_status = client.put(
        f"/api/jobs/{job['id']}", headers=auth_headers, json={"status": "paused"}
    )
    assert invalid_status.status_code == 400


def test_delete_archives_job_and_preserves_screening_history(client, app, auth_headers):
    job = _create_job(client, auth_headers).get_json()["job"]
    with app.app_context():
        user = db.session.scalar(db.select(User).where(User.email == "owner@example.test"))
        screening = Screening(
            user_id=user.id,
            job_id=job["id"],
            job_description="Historical screening description",
        )
        screening.candidates.append(Candidate(
            rank=1,
            filename="history.pdf",
            final_score=81.0,
            skill_score=80.0,
            tfidf_score=82.0,
            keyword_score=81.0,
            match_tier="Strong Match",
        ))
        db.session.add(screening)
        db.session.commit()
        screening_id = screening.id
        candidate_id = screening.candidates[0].id

    archived = client.delete(f"/api/jobs/{job['id']}", headers=auth_headers)
    assert archived.status_code == 200
    assert archived.get_json()["job"]["status"] == "archived"
    with app.app_context():
        screening = db.session.get(Screening, screening_id)
        candidate = db.session.get(Candidate, candidate_id)
        assert db.session.get(Job, job["id"]).status == "archived"
        assert screening is not None and screening.job_id == job["id"]
        assert candidate is not None and candidate.screening_id == screening_id