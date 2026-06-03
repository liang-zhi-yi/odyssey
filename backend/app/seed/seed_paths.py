"""Seed 1 MVP path: Agent Engineer."""

from sqlalchemy.orm import Session

from app.paths.models import Path

AGENT_ENGINEER_ID = "00000000-0000-0000-0000-000000000010"


def run(db: Session) -> str:
    """Insert the Agent Engineer path. Returns its UUID string."""
    existing = db.query(Path).filter(Path.name == "Agent Engineer").first()
    if existing:
        return str(existing.id)

    path = Path(
        id=AGENT_ENGINEER_ID,
        name="Agent Engineer",
        description=(
            "Grow into an engineer capable of independently designing, "
            "developing, and deploying AI Agent systems."
        ),
        difficulty=3,
        is_official=True,
    )
    db.add(path)
    db.commit()
    return str(path.id)
