from datetime import datetime, timezone

from backend.database import db


class Job(db.Model):
    __tablename__ = "jobs"
    __table_args__ = (
        db.CheckConstraint(
            "status IN ('open', 'closed', 'archived')",
            name="ck_jobs_status",
        ),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", name="fk_jobs_user_id_users"),
        nullable=False,
        index=True,
    )
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(16), nullable=False, default="open")
    created_at = db.Column(
        db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = db.relationship("User", back_populates="jobs")
    screenings = db.relationship("Screening", back_populates="job")