from flask_jwt_extended import get_jwt_identity

from backend.database import db
from backend.models import User


def get_authenticated_user() -> User | None:
    try:
        user_id = int(get_jwt_identity())
    except (TypeError, ValueError):
        return None
    return db.session.get(User, user_id)