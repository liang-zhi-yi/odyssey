"""Seed preset learning paths (replaces legacy Path seed)."""

from sqlalchemy.orm import Session

from app.learning_paths.models import LearningPath

AGENT_ENGINEER_ID = "00000000-0000-0000-0000-000000000010"


def run(db: Session) -> str:
    """Insert the Agent Engineer preset learning path. Returns its UUID string."""
    existing = db.query(LearningPath).filter(LearningPath.id == AGENT_ENGINEER_ID).first()
    if existing:
        return str(existing.id)

    path = LearningPath(
        id=AGENT_ENGINEER_ID,
        user_id=None,  # preset — no owner
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
