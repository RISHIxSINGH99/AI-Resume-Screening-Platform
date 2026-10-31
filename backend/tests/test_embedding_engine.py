import sys
import types

import numpy as np
import pytest

from modules import embedding_engine


class SemanticTestModel:
    def encode(self, texts, **_kwargs):
        vectors = []
        for text in texts:
            normalized = text.lower()
            if "python" in normalized or "backend" in normalized:
                vectors.append([1.0, 0.0])
            else:
                vectors.append([0.0, 1.0])
        return np.asarray(vectors, dtype=np.float32)


@pytest.fixture
def semantic_model(monkeypatch):
    model = SemanticTestModel()
    monkeypatch.setattr(embedding_engine, "get_embedding_model", lambda: model)
    return model


def test_embedding_generation_returns_one_vector_per_nonempty_text(semantic_model):
    embeddings = embedding_engine.embed_texts(["python backend", "unrelated topic"])
    assert embeddings.shape == (2, 2)
    assert np.allclose(np.linalg.norm(embeddings, axis=1), [1.0, 1.0])


def test_semantic_similarity_is_bounded_and_identical_text_scores_high(semantic_model):
    text = "Python backend engineering"
    score = embedding_engine.compute_semantic_similarity(text, [text])[0]
    assert 0.0 <= score <= 100.0
    assert score > 99.0


def test_unrelated_text_scores_lower_than_matching_text(semantic_model):
    scores = embedding_engine.compute_semantic_similarity(
        "Python backend engineering",
        ["Python backend engineering", "Gardening and landscape design"],
    )
    assert scores[0] > scores[1]


def test_empty_job_or_resume_text_returns_zero_without_loading_model(monkeypatch):
    def unexpected_load():
        raise AssertionError("empty inputs must not load the model")

    monkeypatch.setattr(embedding_engine, "get_embedding_model", unexpected_load)
    assert embedding_engine.compute_semantic_similarity("", ["resume"]) == [0.0]
    assert embedding_engine.compute_semantic_similarity("job", ["", "  "]) == [0.0, 0.0]
    empty_embeddings = embedding_engine.embed_texts(["", "  "])
    assert empty_embeddings.shape == (2, 0)


def test_model_initialization_is_cached(monkeypatch):
    calls = []
    fake_module = types.ModuleType("sentence_transformers")

    class FakeSentenceTransformer:
        def __init__(self, model_name):
            calls.append(model_name)

    fake_module.SentenceTransformer = FakeSentenceTransformer
    monkeypatch.setitem(sys.modules, "sentence_transformers", fake_module)
    embedding_engine.get_embedding_model.cache_clear()
    try:
        first = embedding_engine.get_embedding_model()
        second = embedding_engine.get_embedding_model()
        assert first is second
        assert calls == [embedding_engine.MODEL_NAME]
    finally:
        embedding_engine.get_embedding_model.cache_clear()


def test_model_load_failure_is_explicit(monkeypatch):
    fake_module = types.ModuleType("sentence_transformers")

    def fail_to_construct(_model_name):
        raise OSError("offline")

    fake_module.SentenceTransformer = fail_to_construct
    monkeypatch.setitem(sys.modules, "sentence_transformers", fake_module)
    embedding_engine.get_embedding_model.cache_clear()
    try:
        with pytest.raises(embedding_engine.SemanticEmbeddingError, match="Unable to initialize"):
            embedding_engine.compute_semantic_similarity("job", ["resume"])
    finally:
        embedding_engine.get_embedding_model.cache_clear()