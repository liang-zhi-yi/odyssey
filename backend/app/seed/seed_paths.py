"""Seed preset learning paths (replaces legacy Path seed)."""

import uuid

from sqlalchemy.orm import Session

from app.auth.models import User
from app.learning_paths.models import LearningPath

SYSTEM_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000000")
AGENT_ENGINEER_ID = "00000000-0000-0000-0000-000000000010"


def _ensure_system_user(db: Session) -> uuid.UUID:
    """Get or create the system user that owns official/preset paths."""
    user = db.query(User).filter(User.id == SYSTEM_USER_ID).first()
    if user:
        return user.id

    system = User(
        id=SYSTEM_USER_ID,
        email="system@odyssey.local",
        username="odyssey_system",
        password_hash="$system$",  # not a real password — system user never logs in
        nickname="Odyssey System",
    )
    db.add(system)
    db.commit()
    return system.id


def run(db: Session) -> str:
    """Insert the Agent Engineer preset learning path. Returns its UUID string."""
    existing = db.query(LearningPath).filter(LearningPath.id == AGENT_ENGINEER_ID).first()
    if existing:
        return str(existing.id)

    system_user_id = _ensure_system_user(db)

    path = LearningPath(
        id=AGENT_ENGINEER_ID,
        user_id=system_user_id,
        title="Agent Engineer",
        description=(
            "Grow into an engineer capable of independently designing, "
            "developing, and deploying AI Agent systems."
        ),
        path_type="PRESET",
        is_official=True,
        difficulty=3,
    )
    db.add(path)
    db.commit()
    return str(path.id)
