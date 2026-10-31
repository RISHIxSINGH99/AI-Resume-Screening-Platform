import sys
import types

import numpy as np
import pytest

from modules import reranker_engine


class FakeCrossEncoder:
    def __init__(self, logits=None, fail_on_text=None):
        self.logits = logits or [0.0]
        self.fail_on_text = fail_on_text
        self.calls = []

    def predict(self, pairs, **_kwargs):
        self.calls.append(list(pairs))
        if self.fail_on_text and any(self.fail_on_text in resume for _, resume in pairs):
            raise ValueError("candidate cannot be scored")
        return np.asarray(self.logits[:len(pairs)], dtype=np.float32)


@pytest.fixture
def fake_cross_encoder(monkeypatch):
    model = FakeCrossEncoder([2.0, -2.0])
    monkeypatch.setattr(reranker_engine, "get_cross_encoder_model", lambda: model)
    return model


def test_cross_encoder_initializes_once_per_process(monkeypatch):
    calls = []
    fake_module = types.ModuleType("sentence_transformers")

    class Constructor:
        def __init__(self, model_name, **kwargs):
            calls.append((model_name, kwargs))

    fake_module.CrossEncoder = Constructor
    monkeypatch.setitem(sys.modules, "sentence_transformers", fake_module)
    reranker_engine.get_cross_encoder_model.cache_clear()
    try:
        first = reranker_engine.get_cross_encoder_model()
        second = reranker_engine.get_cross_encoder_model()
        assert first is second
        assert len(calls) == 1
        assert calls[0][0] == reranker_engine.CROSS_ENCODER_MODEL
    finally:
        reranker_engine.get_cross_encoder_model.cache_clear()


def test_inference_batches_job_resume_pairs_once(fake_cross_encoder):
    scores, errors = reranker_engine.compute_reranker_scores(
        "Python backend role",
        ["Python backend candidate", "Different experience"],
    )
    assert len(fake_cross_encoder.calls) == 1
    assert fake_cross_encoder.calls[0] == [
        ("Python backend role", "Python backend candidate"),
        ("Python backend role", "Different experience"),
    ]
    assert scores == [88.08, 11.92]
    assert errors == [None, None]


def test_score_normalization_is_bounded_between_zero_and_one_hundred(monkeypatch):
    model = FakeCrossEncoder([0.0, 100.0, -100.0])
    monkeypatch.setattr(reranker_engine, "get_cross_encoder_model", lambda: model)
    scores, _errors = reranker_engine.compute_reranker_scores(
        "job", ["middle", "high", "low"]
    )
    assert scores == [50.0, 100.0, 0.0]
    assert all(0.0 <= score <= 100.0 for score in scores)


def test_empty_job_or_resume_is_zero_without_loading_model(monkeypatch):
    def unexpected_load():
        raise AssertionError("empty inputs must not load the cross-encoder")

    monkeypatch.setattr(reranker_engine, "get_cross_encoder_model", unexpected_load)
    assert reranker_engine.compute_reranker_scores("", ["resume"]) == ([0.0], [None])
    assert reranker_engine.compute_reranker_scores("job", ["", "  "]) == (
        [0.0, 0.0], [None, None]
    )


def test_bad_candidate_does_not_discard_other_scores(monkeypatch):
    class PairSensitiveModel:
        def predict(self, pairs, **_kwargs):
            if len(pairs) > 1:
                raise ValueError("batch contains a malformed item")
            if "bad" in pairs[0][1]:
                raise ValueError("candidate cannot be scored")
            return np.asarray([2.0], dtype=np.float32)

    monkeypatch.setattr(
        reranker_engine,
        "get_cross_encoder_model",
        lambda: PairSensitiveModel(),
    )
    scores, errors = reranker_engine.compute_reranker_scores(
        "job", ["good resume", "bad resume"]
    )
    assert scores == [88.08, 0.0]
    assert errors == [None, "Cross-encoder could not score this resume."]


def test_model_failure_is_explicit(monkeypatch):
    def fail_to_load():
        raise reranker_engine.CrossEncoderModelError("model unavailable")

    monkeypatch.setattr(reranker_engine, "get_cross_encoder_model", fail_to_load)
    with pytest.raises(reranker_engine.CrossEncoderModelError, match="model unavailable"):
        reranker_engine.compute_reranker_scores("job", ["resume"])


def test_all_candidate_inference_failures_raise_clear_model_error(monkeypatch):
    class FailedModel:
        def predict(self, _pairs, **_kwargs):
            raise ValueError("inference failed")

    monkeypatch.setattr(reranker_engine, "get_cross_encoder_model", lambda: FailedModel())
    with pytest.raises(reranker_engine.CrossEncoderModelError, match="every resume pair"):
        reranker_engine.compute_reranker_scores("job", ["resume one", "resume two"])