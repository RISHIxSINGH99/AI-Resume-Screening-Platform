from functools import lru_cache
from typing import Sequence

import numpy as np

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


class SemanticEmbeddingError(RuntimeError):
    """Raised when the configured semantic embedding model cannot be used."""


@lru_cache(maxsize=1)
def get_embedding_model():
    """Load the configured sentence-transformer once per Python process."""
    try:
        from sentence_transformers import SentenceTransformer

        return SentenceTransformer(MODEL_NAME)
    except Exception as error:
        raise SemanticEmbeddingError(
            f"Unable to initialize semantic embedding model '{MODEL_NAME}'."
        ) from error


def embed_texts(texts: Sequence[str]) -> np.ndarray:
    """Encode a batch of texts, returning zero vectors for empty inputs."""
    if not texts:
        return np.zeros((0, 0), dtype=np.float32)

    valid_positions = [
        index for index, text in enumerate(texts)
        if isinstance(text, str) and text.strip()
    ]
    if not valid_positions:
        return np.zeros((len(texts), 0), dtype=np.float32)

    valid_texts = [texts[index] for index in valid_positions]
    try:
        encoded = get_embedding_model().encode(
            valid_texts,
            batch_size=32,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
    except SemanticEmbeddingError:
        raise
    except Exception as error:
        raise SemanticEmbeddingError(
            f"Unable to encode text with semantic embedding model '{MODEL_NAME}'."
        ) from error

    vectors = np.asarray(encoded, dtype=np.float32)
    if vectors.ndim == 1 and len(valid_positions) == 1:
        vectors = vectors.reshape(1, -1)
    if vectors.ndim != 2 or vectors.shape[0] != len(valid_positions):
        raise SemanticEmbeddingError("The semantic embedding model returned an invalid result shape.")

    result = np.zeros((len(texts), vectors.shape[1]), dtype=np.float32)
    result[valid_positions] = vectors
    return result


def compute_semantic_similarity(jd_text: str, resume_texts: Sequence[str]) -> list[float]:
    """Return semantic cosine similarities scaled to 0-100 for a resume batch.

    The job description and all non-empty resumes are encoded together, so the
    job description is embedded once per screening request.
    """
    scores = [0.0] * len(resume_texts)
    if not isinstance(jd_text, str) or not jd_text.strip() or not resume_texts:
        return scores

    valid_resume_positions = [
        index for index, text in enumerate(resume_texts)
        if isinstance(text, str) and text.strip()
    ]
    if not valid_resume_positions:
        return scores

    batch = [jd_text, *(resume_texts[index] for index in valid_resume_positions)]
    embeddings = embed_texts(batch)
    jd_embedding = embeddings[0]
    jd_norm = float(np.linalg.norm(jd_embedding))
    if jd_norm == 0.0:
        return scores

    for batch_index, resume_index in enumerate(valid_resume_positions, start=1):
        resume_embedding = embeddings[batch_index]
        resume_norm = float(np.linalg.norm(resume_embedding))
        if resume_norm == 0.0:
            continue
        cosine = float(np.dot(jd_embedding, resume_embedding) / (jd_norm * resume_norm))
        scores[resume_index] = round(min(max(cosine, 0.0), 1.0) * 100.0, 2)
    return scores