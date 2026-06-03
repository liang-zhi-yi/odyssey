"""Seed initial Quests — 8 quests (2 per skill) for MVP."""

from sqlalchemy.orm import Session

from app.quests.models import Quest
from app.core.enums import QuestDifficulty, QuestType, DeliverableType


SEED_QUESTS = [
    # ── Prompt Engineering ──────────────────────────────────────
    {
        "skill_name": "Prompt Engineering",
        "title": "User Feedback Classifier",
        "description": (
            "A SaaS company receives hundreds of user feedback items daily. "
            "The operations team can't manually sort them. "
            "Design a prompt that lets AI automatically classify feedback into: "
            "Bug, Feature Request, Complaint, Praise."
        ),
        "difficulty": QuestDifficulty.LEVEL_1,
        "quest_type": QuestType.APPLICATION,
        "expected_deliverable": DeliverableType.PROMPT,
    },
    {
        "skill_name": "Prompt Engineering",
        "title": "Customer Service Reply Assistant",
        "description": (
            "The customer service team wants AI to auto-generate replies. "
            "Design a customer-service prompt that is polite, professional, and concise."
        ),
        "difficulty": QuestDifficulty.LEVEL_2,
        "quest_type": QuestType.APPLICATION,
        "expected_deliverable": DeliverableType.PROMPT,
    },
    # ── RAG ─────────────────────────────────────────────────────
    {
        "skill_name": "RAG",
        "title": "School Knowledge Base Q&A",
        "description": (
            "Students can't find course materials. Design a RAG architecture "
            "that lets them ask questions and get answers from course documents. "
            "Include document upload, chunking, embedding, retrieval, and generation."
        ),
        "difficulty": QuestDifficulty.LEVEL_2,
        "quest_type": QuestType.PROJECT,
        "expected_deliverable": DeliverableType.ARCHITECTURE,
    },
    {
        "skill_name": "RAG",
        "title": "Company Policy Query System",
        "description": (
            "Design an enterprise knowledge-base system that lets employees "
            "query company policies through natural language."
        ),
        "difficulty": QuestDifficulty.LEVEL_3,
        "quest_type": QuestType.PROJECT,
        "expected_deliverable": DeliverableType.ARCHITECTURE,
    },
    # ── Workflow Design ─────────────────────────────────────────
    {
        "skill_name": "Workflow Design",
        "title": "Daily Report Auto-Generator",
        "description": (
            "Design a workflow that automatically generates a daily report from "
            "raw data: collect → analyse → summarise → format → deliver."
        ),
        "difficulty": QuestDifficulty.LEVEL_1,
        "quest_type": QuestType.APPLICATION,
        "expected_deliverable": DeliverableType.WORKFLOW,
    },
    {
        "skill_name": "Workflow Design",
        "title": "Article Creation Workflow",
        "description": (
            "Design a content-creation workflow with stages: "
            "Research → Outline → Writing → Review. "
            "Describe the state flow and error recovery strategy."
        ),
        "difficulty": QuestDifficulty.LEVEL_2,
        "quest_type": QuestType.APPLICATION,
        "expected_deliverable": DeliverableType.WORKFLOW,
    },
    # ── LangGraph ────────────────────────────────────────────────
    {
        "skill_name": "LangGraph",
        "title": "Simple Q&A Agent",
        "description": (
            "Build a simple LangGraph agent with Node, Edge, and State. "
            "The agent receives a question and returns an answer."
        ),
        "difficulty": QuestDifficulty.LEVEL_1,
        "quest_type": QuestType.APPLICATION,
        "expected_deliverable": DeliverableType.CODE,
    },
    {
        "skill_name": "LangGraph",
        "title": "Research Assistant Agent",
        "description": (
            "Design a LangGraph research assistant with stages: "
            "problem input → research → summarise → generate report. "
            "Include conditional routing and state management."
        ),
        "difficulty": QuestDifficulty.LEVEL_2,
        "quest_type": QuestType.PROJECT,
        "expected_deliverable": DeliverableType.CODE,
    },
]


def run(db: Session, skill_ids: dict[str, str]) -> None:
    """Insert quests. skill_ids maps skill name → UUID string."""
    for data in SEED_QUESTS:
        sid = skill_ids.get(data.pop("skill_name"))
        if sid is None:
            continue

        existing = db.query(Quest).filter(
            Quest.title == data["title"],
            Quest.skill_id == sid,
        ).first()
        if existing:
            continue

        quest = Quest(skill_id=sid, **data)
        db.add(quest)

    db.commit()
