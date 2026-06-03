"""Seed 5 MVP credentials: 4 Practitioner + 1 Agent Engineer."""

from sqlalchemy.orm import Session

from app.credentials.models import Credential

SEED_CREDENTIALS = [
    {
        "name": "Prompt Practitioner",
        "description": "All four Prompt Engineering dimensions >= 60.",
        "skill_binding": "Prompt Engineering",
        "required_score": 60,
    },
    {
        "name": "RAG Practitioner",
        "description": "All four RAG dimensions >= 60.",
        "skill_binding": "RAG",
        "required_score": 60,
    },
    {
        "name": "Workflow Practitioner",
        "description": "All four Workflow Design dimensions >= 60.",
        "skill_binding": "Workflow Design",
        "required_score": 60,
    },
    {
        "name": "LangGraph Practitioner",
        "description": "All four LangGraph dimensions >= 60.",
        "skill_binding": "LangGraph",
        "required_score": 60,
    },
    {
        "name": "Agent Engineer",
        "description": (
            "All four core skills (Prompt, RAG, Workflow, LangGraph) "
            "each meet multi-dimension threshold (every dimension >= 60)."
        ),
        "skill_binding": None,  # Composite credential — no single skill
        "required_score": 60,
    },
]


def run(db: Session, skill_ids: dict[str, str]) -> None:
    """Insert credentials. skill_ids maps skill name → UUID string."""
    for data in SEED_CREDENTIALS:
        binding = data.pop("skill_binding")
        skill_id = skill_ids.get(binding) if binding else None

        existing = db.query(Credential).filter(Credential.name == data["name"]).first()
        if existing:
            continue

        c = Credential(skill_id=skill_id, **data)
        db.add(c)

    db.commit()
