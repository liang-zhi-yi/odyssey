"""Seed 4 MVP skills: Prompt, RAG, Workflow, LangGraph."""

from sqlalchemy.orm import Session

from app.skills.models import Skill

SEED_SKILLS = [
    {
        "id": "00000000-0000-0000-0000-000000000001",
        "name": "Prompt Engineering",
        "description": "Design high-quality prompts to drive LLM task completion.",
        "category": "AI",
        "max_score": 100,
    },
    {
        "id": "00000000-0000-0000-0000-000000000002",
        "name": "RAG",
        "description": "Build retrieval-augmented generation systems with chunking, embedding, and vector search.",
        "category": "AI",
        "max_score": 100,
    },
    {
        "id": "00000000-0000-0000-0000-000000000003",
        "name": "Workflow Design",
        "description": "Design complex multi-step task execution workflows.",
        "category": "AI",
        "max_score": 100,
    },
    {
        "id": "00000000-0000-0000-0000-000000000004",
        "name": "LangGraph",
        "description": "Build state-driven agent systems with nodes, edges, and conditional routing.",
        "category": "AI",
        "max_score": 100,
    },
]


def run(db: Session) -> dict[str, str]:
    """Insert skills. Returns a mapping of skill name → UUID string."""
    mapping: dict[str, str] = {}
    for data in SEED_SKILLS:
        existing = db.query(Skill).filter(Skill.name == data["name"]).first()
        if existing:
            mapping[data["name"]] = str(existing.id)
            continue
        skill = Skill(**data)
        db.add(skill)
        mapping[data["name"]] = str(skill.id)
    db.commit()
    return mapping
