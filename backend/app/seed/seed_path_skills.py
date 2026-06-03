"""Seed PathSkill mappings — links Agent Engineer path to its 4 skills."""

from sqlalchemy.orm import Session

from app.paths.models import PathSkill


def run(db: Session, skill_ids: dict[str, str], path_id: str) -> None:
    """Create PathSkill rows (order: Prompt → RAG → Workflow → LangGraph)."""
    stages = [
        ("Prompt Engineering", 1),
        ("RAG", 2),
        ("Workflow Design", 3),
        ("LangGraph", 4),
    ]

    for skill_name, stage_order in stages:
        sid = skill_ids.get(skill_name)
        if sid is None:
            continue

        existing = (
            db.query(PathSkill)
            .filter(PathSkill.path_id == path_id, PathSkill.skill_id == sid)
            .first()
        )
        if existing:
            continue

        ps = PathSkill(
            path_id=path_id,
            skill_id=sid,
            stage_order=stage_order,
            required_score=60,
        )
        db.add(ps)

    db.commit()
