"""Seed LearningPathMilestone + PathCheckpoint mappings for the Agent Engineer path."""

from sqlalchemy.orm import Session

from app.learning_paths.models import LearningPathMilestone, PathCheckpoint


STAGE_METADATA = [
    {"skill": "Prompt Engineering", "title": "Prompt Engineering Fundamentals", "description": "Master prompt design patterns and techniques"},
    {"skill": "RAG", "title": "RAG Systems", "description": "Build retrieval-augmented generation systems"},
    {"skill": "Workflow Design", "title": "Workflow Automation", "description": "Design and implement automated agent workflows"},
    {"skill": "LangGraph", "title": "Agent Systems with LangGraph", "description": "Build complex multi-agent systems"},
]


def run(db: Session, skill_ids: dict[str, str], path_id: str) -> None:
    """Create milestone + checkpoint rows for the Agent Engineer path."""
    for i, meta in enumerate(STAGE_METADATA):
        sid = skill_ids.get(meta["skill"])
        if sid is None:
            continue

        # Check if milestone already exists for this path+skill
        existing = (
            db.query(LearningPathMilestone)
            .filter(
                LearningPathMilestone.learning_path_id == path_id,
                LearningPathMilestone.skill_id == sid,
            )
            .first()
        )
        if existing:
            continue

        milestone = LearningPathMilestone(
            learning_path_id=path_id,
            title=meta["title"],
            description=meta["description"],
            skill_id=sid,
            order_sequence=i,
        )
        db.add(milestone)
        db.flush()  # get the ID

        # Create 1 default checkpoint per milestone
        checkpoint = PathCheckpoint(
            milestone_id=milestone.id,
            title=f"{meta['skill']} Checkpoint",
            order_sequence=0,
            required_score=60,
            quest_generation_status="PENDING",
        )
        db.add(checkpoint)

    db.commit()
