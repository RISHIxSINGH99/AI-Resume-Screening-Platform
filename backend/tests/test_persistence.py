from io import BytesIO
from pathlib import Path

from sqlalchemy import event, select

from backend.database import db
from backend.models import Candidate, Screening

PROJECT_ROOT = Path(__file__).resolve().parents[2]
SAMPLE_PDF = PROJECT_ROOT / "AI-powered-Resume-Screening-and-Ranking-System.pdf"


def _screening_payload(pdf_bytes=None):
    if pdf_bytes is None:
        pdf_bytes = SAMPLE_PDF.read_bytes()
    return {
        "job_title": "Backend Engineer",
        "job_description": "Python Flask SQL API development",
        "resumes": [
            (BytesIO(pdf_bytes), "candidate.pdf"),
            (BytesIO(b"not a PDF document"), "invalid.pdf"),
        ],
    }


def test_screening_persists_ranked_candidates_and_read_apis(client, app, auth_headers):
    response = client.post(
        "/api/resume/screen",
        data=_screening_payload(),
        content_type="multipart/form-data",
        headers=auth_headers,
    )

    assert response.status_code == 200, response.get_json()
    body = response.get_json()
    assert body["success"] is True
    assert body["count"] >= 1
    assert body["screening_id"]
    assert body["results"]
    assert {
        "final_score", "old_final_score", "new_final_score", "semantic_score",
        "reranker_score", "skill_score", "tfidf_score", "keyword_score",
    }.issubset(body["results"][0])
    assert any(error["filename"] == "invalid.pdf" for error in body["errors"])

    screening_id = body["screening_id"]
    with app.app_context():
        screening = db.session.get(Screening, screening_id)
        assert screening is not None
        assert screening.job_title == "Backend Engineer"
        assert len(screening.candidates) == body["count"]
        assert db.session.scalar(select(db.func.count()).select_from(Candidate)) == body["count"]
        persisted_candidate = screening.candidates[0]
        ranked_result = next(
            result for result in body["results"] if result["rank"] == persisted_candidate.rank
        )
        assert persisted_candidate.filename == ranked_result["filename"]
        assert persisted_candidate.final_score == ranked_result["final_score"]
        assert persisted_candidate.matched_skills == ranked_result["skill_analysis"]["matched_skills"]
        assert persisted_candidate.missing_skills == ranked_result["skill_analysis"]["missing_skills"]
        assert persisted_candidate.extra_skills == ranked_result["skill_analysis"]["extra_skills"]

    listings = client.get("/api/screenings", headers=auth_headers).get_json()
    assert listings["count"] == 1
    assert listings["screenings"][0]["id"] == screening_id
    assert listings["screenings"][0]["candidate_count"] == body["count"]

    detail_response = client.get(f"/api/screenings/{screening_id}", headers=auth_headers)
    assert detail_response.status_code == 200
    detail = detail_response.get_json()["screening"]
    assert detail["job_title"] == "Backend Engineer"
    assert len(detail["candidates"]) == body["count"]

    candidates = client.get("/api/candidates", headers=auth_headers).get_json()
    assert candidates["count"] == body["count"]
    assert all(candidate["screening_id"] == screening_id for candidate in candidates["candidates"])
    assert client.get("/api/screenings/999999", headers=auth_headers).status_code == 404


def test_persistence_failure_rolls_back_screening_and_returns_500(client, app, auth_headers):
    with app.app_context():
        session = db.session()

        def fail_before_commit(current_session):
            raise RuntimeError("simulated persistence failure")

        event.listen(session, "before_commit", fail_before_commit)
        try:
            response = client.post(
                "/api/resume/screen",
                data=_screening_payload(),
                content_type="multipart/form-data",
                headers=auth_headers,
            )
        finally:
            event.remove(session, "before_commit", fail_before_commit)
            db.session.rollback()

        assert response.status_code == 500
        assert response.get_json()["success"] is False
        assert db.session.scalar(select(db.func.count()).select_from(Screening)) == 0
        assert db.session.scalar(select(db.func.count()).select_from(Candidate)) == 0


def test_embedding_model_failure_returns_clear_service_error(client, auth_headers, monkeypatch):
    from modules import embedding_engine

    def fail_to_load():
        raise embedding_engine.SemanticEmbeddingError("model unavailable")

    monkeypatch.setattr(embedding_engine, "get_embedding_model", fail_to_load)
    response = client.post(
        "/api/resume/screen",
        data=_screening_payload(),
        content_type="multipart/form-data",
        headers=auth_headers,
    )

    assert response.status_code == 503
    assert "Semantic similarity model is unavailable" in response.get_json()["error"]