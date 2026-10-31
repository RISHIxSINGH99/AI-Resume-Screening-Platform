import os
import sqlite3
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BASE_REVISION = "85e1d1570a5c"
OWNERSHIP_REVISION = "8d3a5d4aca6c"


def test_upgrade_preserves_legacy_screening_and_candidate(tmp_path):
    database_path = tmp_path / "legacy.db"
    environment = os.environ.copy()
    environment["DATABASE_URL"] = f"sqlite:///{database_path}"
    environment["JWT_SECRET_KEY"] = "migration-test-only-key"
    environment["APP_ENV"] = "testing"
    flask_command = [sys.executable, "-m", "flask", "--app", "backend.app", "db"]

    subprocess.run(
        [*flask_command, "upgrade", BASE_REVISION],
        cwd=PROJECT_ROOT,
        env=environment,
        check=True,
        capture_output=True,
        text=True,
    )

    with sqlite3.connect(database_path) as connection:
        screening_cursor = connection.execute(
            "INSERT INTO screenings (job_title, job_description, created_at) VALUES (?, ?, ?)",
            ("Legacy role", "Existing job description", "2026-09-30 12:00:00"),
        )
        screening_id = screening_cursor.lastrowid
        connection.execute(
            """INSERT INTO candidates (
                screening_id, rank, filename, final_score, skill_score, tfidf_score,
                keyword_score, match_tier, matched_skills, missing_skills, extra_skills
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (screening_id, 1, "legacy.pdf", 80, 80, 80, 80, "Strong Match", "[]", "[]", "[]"),
        )

    subprocess.run(
        [*flask_command, "upgrade", OWNERSHIP_REVISION],
        cwd=PROJECT_ROOT,
        env=environment,
        check=True,
        capture_output=True,
        text=True,
    )

    with sqlite3.connect(database_path) as connection:
        screening = connection.execute(
            "SELECT id, user_id FROM screenings WHERE id = ?", (screening_id,)
        ).fetchone()
        candidate_count = connection.execute(
            "SELECT COUNT(*) FROM candidates WHERE screening_id = ?", (screening_id,)
        ).fetchone()[0]

    assert screening == (screening_id, None)
    assert candidate_count == 1