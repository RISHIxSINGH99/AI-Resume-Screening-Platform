import pytest
import numpy as np

from backend.app import create_app
from backend.database import db


@pytest.fixture
def app(tmp_path, monkeypatch):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'test.db'}")
    monkeypatch.setenv("JWT_SECRET_KEY", "pytest-only-signing-key-long-enough-for-hs256")
    monkeypatch.setenv("APP_ENV", "testing")
    app = create_app()
    app.config.update(TESTING=True)
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def register_recruiter(client):
    def register(email, name="Test Recruiter", password="test-password-123"):
        return client.post("/api/auth/register", json={
            "name": name,
            "email": email,
            "password": password,
        })

    return register


@pytest.fixture
def auth_headers(client, register_recruiter):
    email = "owner@example.test"
    password = "test-password-123"
    response = register_recruiter(email, password=password)
    assert response.status_code == 201
    login_response = client.post("/api/auth/login", json={
        "email": email,
        "password": password,
    })
    assert login_response.status_code == 200
    return {"Authorization": f"Bearer {login_response.get_json()['access_token']}"}


@pytest.fixture(autouse=True)
def mock_semantic_model(monkeypatch, request):
    if request.module.__name__.endswith(("test_embedding_engine", "test_reranker_engine")):
        return

    from modules import embedding_engine

    class DeterministicModel:
        def encode(self, texts, **_kwargs):
            return np.array([[1.0, 0.0] for _text in texts], dtype=np.float32)

    model = DeterministicModel()
    monkeypatch.setattr(embedding_engine, "get_embedding_model", lambda: model)

    from modules import reranker_engine

    class DeterministicCrossEncoder:
        def predict(self, pairs, **_kwargs):
            return np.array([
                2.0 if "python" in pair[1].lower() else -2.0
                for pair in pairs
            ], dtype=np.float32)

    monkeypatch.setattr(
        reranker_engine,
        "get_cross_encoder_model",
        lambda: DeterministicCrossEncoder(),
    )