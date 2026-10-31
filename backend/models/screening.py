from datetime import datetime, timezone

from backend.database import db


class Screening(db.Model):
    __tablename__ = "screenings"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", name="fk_screenings_user_id_users"),
        nullable=True,
        index=True,
    )
    job_id = db.Column(
        db.Integer,
        db.ForeignKey("jobs.id", name="fk_screenings_job_id_jobs"),
        nullable=True,
        index=True,
    )
    job_title = db.Column(db.String(255), nullable=True)
    job_description = db.Column(db.Text, nullable=False)
    created_at = db.Column(
        db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )

    candidates = db.relationship(
        "Candidate",
        back_populates="screening",
        cascade="all, delete-orphan",
    )
    user = db.relationship("User", back_populates="screenings")
    job = db.relationship("Job", back_populates="screenings")