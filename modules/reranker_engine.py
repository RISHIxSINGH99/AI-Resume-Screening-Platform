from functools import lru_cache
from typing import Sequence

import numpy as np

CROSS_ENCODER_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"
RERANKER_BATCH_SIZE = 16


class CrossEncoderModelError(RuntimeError):
    """Raised when the cross-encoder cannot be initialized or used at all."""


@lru_cache(maxsize=1)
def get_cross_encoder_model():
    """Load the lightweight cross-encoder once per process."""
    try:
        from sentence_transformers import CrossEncoder

        return CrossEncoder(CROSS_ENCODER_MODEL, max_length=512)
    except Exception as error:
        raise CrossEncoderModelError(
            f"Unable to initialize cross-encoder '{CROSS_ENCODER_MODEL}'."
        ) from error


def _predict_logits(model, pairs) -> np.ndarray:
    predictions = model.predict(
        pairs,
        batch_size=RERANKER_BATCH_SIZE,
        show_progress_bar=False,
        convert_to_numpy=True,
        apply_softmax=False,
    )
    logits = np.asarray(predictions, dtype=np.float64).reshape(-1)
    if logits.size != len(pairs):
        raise ValueError("Cross-encoder returned an unexpected number of scores.")
    return logits


def _normalize_logit(logit: float) -> float:
    """Map an MS MARCO relevance logit to a bounded 0-100 sigmoid score."""
    if not np.isfinite(logit):
        raise ValueError("Cross-encoder returned a non-finite score.")
    if logit >= 0:
        probability = 1.0 / (1.0 + np.exp(-logit))
    else:
        exp_logit = np.exp(logit)
        probability = exp_logit / (1.0 + exp_logit)
    return round(float(probability) * 100.0, 2)


def compute_reranker_scores(
    job_description: str,
    resume_texts: Sequence[str],
) -> tuple[list[float], list[str | None]]:
    """Score batched (job description, resume) pairs using CrossEncoder.

    Empty inputs score zero without initializing the model. If a batch fails,
    retry each pair independently so one malformed resume cannot discard the
    other candidates. An optional per-item error accompanies a zero score.
    """
    scores = [0.0] * len(resume_texts)
    errors: list[str | None] = [None] * len(resume_texts)
    if not isinstance(job_description, str) or not job_description.strip():
        return scores, errors

    valid_positions = [
        index for index, resume in enumerate(resume_texts)
        if isinstance(resume, str) and resume.strip()
    ]
    if not valid_positions:
        return scores, errors

    model = get_cross_encoder_model()
    jd = job_description.strip()
    pairs = [(jd, resume_texts[index]) for index in valid_positions]

    try:
        logits = _predict_logits(model, pairs)
    except Exception as batch_error:
        successes = 0
        for position, pair in zip(valid_positions, pairs):
            try:
                logits = _predict_logits(model, [pair])
                scores[position] = _normalize_logit(float(logits[0]))
                successes += 1
            except Exception:
                errors[position] = "Cross-encoder could not score this resume."
        if successes == 0:
            raise CrossEncoderModelError(
                "Cross-encoder inference failed for every resume pair."
            ) from batch_error
        return scores, errors

    for position, logit in zip(valid_positions, logits):
        try:
            scores[position] = _normalize_logit(float(logit))
        except (TypeError, ValueError, OverflowError):
            errors[position] = "Cross-encoder returned an invalid score for this resume."
    return scores, errors