from backend.database import db


class Candidate(db.Model):
    __tablename__ = "candidates"

    id = db.Column(db.Integer, primary_key=True)
    screening_id = db.Column(
        db.Integer, db.ForeignKey("screenings.id"), nullable=False, index=True
    )
    rank = db.Column(db.Integer, nullable=False)
    candidate_name = db.Column(db.String(255), nullable=True)
    email = db.Column(db.String(320), nullable=True)
    phone = db.Column(db.String(64), nullable=True)
    linkedin = db.Column(db.String(512), nullable=True)
    github = db.Column(db.String(512), nullable=True)
    filename = db.Column(db.String(255), nullable=False)

    final_score = db.Column(db.Float, nullable=False)
    skill_score = db.Column(db.Float, nullable=False)
    tfidf_score = db.Column(db.Float, nullable=False)
    keyword_score = db.Column(db.Float, nullable=False)

    match_tier = db.Column(db.String(64), nullable=False)

    matched_skills = db.Column(db.JSON, nullable=False, default=list)
    missing_skills = db.Column(db.JSON, nullable=False, default=list)
    extra_skills = db.Column(db.JSON, nullable=False, default=list)
    feedback = db.Column(db.Text, nullable=True)

    screening = db.relationship("Screening", back_populates="candidates")