from sqlalchemy import select

from backend.database import db
from backend.models import Job


def create_job(user_id: int, title: str, description: str, status: str = "open") -> Job:
    job = Job(
        user_id=user_id,
        title=title,
        description=description,
        status=status,
    )
    return _save(job)


def list_jobs_for_user(user_id: int) -> list[Job]:
    return db.session.scalars(
        select(Job)
        .where(Job.user_id == user_id)
        .order_by(Job.created_at.desc(), Job.id.desc())
    ).all()


def get_owned_job(job_id: int, user_id: int) -> Job | None:
    return db.session.scalar(
        select(Job).where(Job.id == job_id, Job.user_id == user_id)
    )


def update_job(job: Job, changes: dict) -> Job:
    for field, value in changes.items():
        setattr(job, field, value)
    return _save(job)


def archive_job(job: Job) -> Job:
    job.status = "archived"
    return _save(job)


def _save(job: Job) -> Job:
    try:
        db.session.add(job)
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    return job