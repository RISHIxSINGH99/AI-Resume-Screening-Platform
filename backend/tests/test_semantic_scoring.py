from modules import scoring_engine


def _candidate(text="Python Flask backend", filename="candidate.pdf"):
    return {
        "text": text,
        "filename": filename,
        "candidate_info": {
            "name": "Test Candidate",
            "email": None,
            "phone": None,
            "linkedin": None,
            "github": None,
        },
        "page_count": 1,
        "char_count": len(text),
    }


def test_existing_tfidf_and_skill_signals_remain_available():
    tfidf_scores = scoring_engine.compute_tfidf_similarity(
        "Python Flask backend", ["Python Flask backend"]
    )
    evaluated = scoring_engine.evaluate_candidate(
        "Python Flask backend",
        "Python Flask backend",
        tfidf_scores[0],
        semantic_score=80.0,
    )
    assert tfidf_scores[0] > 0
    assert evaluated["skill_score"] > 0
    assert evaluated["tfidf_score"] == round(tfidf_scores[0], 1)
    assert "keyword_score" in evaluated


def test_new_score_is_transparent_and_preserves_old_score(monkeypatch):
    monkeypatch.setattr(
        scoring_engine,
        "compute_semantic_similarity",
        lambda _jd, resumes: [80.0 for _resume in resumes],
    )
    result = scoring_engine.rank_all_candidates(
        "Python Flask backend",
        [_candidate()],
    )[0]

    assert result["semantic_score"] == 80.0
    assert "reranker_score" in result
    assert result["new_final_score"] == result["final_score"]
    assert result["old_final_score"] != result["new_final_score"]
    assert result["skill_score"] > 0
    assert result["tfidf_score"] > 0
    assert "keyword_score" in result