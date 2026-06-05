"""
User Memory Bank -- per-user persistent memory for LLM personalization.

Stores user preferences, learning style, habits, and interaction history.
Fed into LLM prompts as structured context for personalized path/quest generation.
"""
import logging
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.learning_paths.models import UserMemory

logger = logging.getLogger(__name__)

# Memory type constants
MEMORY_TYPES = {
    "PREFERENCE": "User preference (e.g., topic interests, time preferences)",
    "HABIT": "Learning habit (e.g., study time, session length)",
    "LEARNING_STYLE": "Learning style (e.g., visual, hands-on, theoretical)",
    "INTERACTION": "Past interaction summary (e.g., preferred quest types)",
    "FEEDBACK": "User feedback on generated content",
}

MEMORY_CONTEXT_PROMPT = """
## User Profile & Preferences (Memory Bank)

The following is what I've learned about this user. Use it to personalize your output:

{context}

IMPORTANT: Use this context to tailor the learning path to the user's preferences, 
learning style, and habits. Make the content feel personalized and relevant.
"""


def get_memory_entries(
    db: Session, user_id: str, memory_type: str | None = None
) -> list[dict]:
    """Get all memory entries for a user, optionally filtered by type."""
    query = db.query(UserMemory).filter(UserMemory.user_id == user_id)
    if memory_type:
        query = query.filter(UserMemory.memory_type == memory_type)
    entries = query.order_by(UserMemory.updated_at.desc()).all()

    return [
        {
            "id": str(e.id),
            "memory_type": e.memory_type,
            "key": e.key,
            "value": e.value,
            "created_at": e.created_at.isoformat(),
            "updated_at": e.updated_at.isoformat(),
        }
        for e in entries
    ]


def upsert_memory(
    db: Session, user_id: str, memory_type: str, key: str, value: dict
) -> dict:
    """Create or update a memory entry. Deduplicates by (user_id, memory_type, key)."""
    existing = (
        db.query(UserMemory)
        .filter(
            UserMemory.user_id == user_id,
            UserMemory.memory_type == memory_type,
            UserMemory.key == key,
        )
        .first()
    )

    if existing:
        existing.value = value
        existing.updated_at = datetime.now(timezone.utc)
        entry = existing
    else:
        entry = UserMemory(
            user_id=user_id,
            memory_type=memory_type,
            key=key,
            value=value,
        )
        db.add(entry)

    db.commit()
    db.refresh(entry)

    return {
        "id": str(entry.id),
        "memory_type": entry.memory_type,
        "key": entry.key,
        "value": entry.value,
        "created_at": entry.created_at.isoformat(),
        "updated_at": entry.updated_at.isoformat(),
    }


def delete_memory(db: Session, memory_id: str, user_id: str) -> bool:
    """Delete a single memory entry. Returns True if deleted, False if not found."""
    entry = (
        db.query(UserMemory)
        .filter(UserMemory.id == memory_id, UserMemory.user_id == user_id)
        .first()
    )
    if not entry:
        return False
    db.delete(entry)
    db.commit()
    return True


def clear_all_memory(db: Session, user_id: str) -> int:
    """Clear all memory entries for a user. Returns count of deleted entries."""
    count = (
        db.query(UserMemory)
        .filter(UserMemory.user_id == user_id)
        .delete()
    )
    db.commit()
    return count


def build_memory_context(db: Session, user_id: str) -> str:
    """Build a structured context string from user memory for LLM prompt injection."""
    entries = get_memory_entries(db, user_id)

    if not entries:
        return ""

    # Group by memory_type
    grouped: dict[str, list[dict]] = {}
    for entry in entries:
        t = entry["memory_type"]
        if t not in grouped:
            grouped[t] = []
        grouped[t].append(entry)

    lines = []
    for mem_type, items in grouped.items():
        type_label = MEMORY_TYPES.get(mem_type, mem_type)
        lines.append(f"### {mem_type} ({type_label})")
        for item in items:
            val = item["value"]
            if isinstance(val, dict) and "text" in val:
                lines.append(f"- {item['key']}: {val['text']}")
            else:
                lines.append(f"- {item['key']}: {val}")
        lines.append("")

    context = "\n".join(lines) if lines else "(No memory entries yet)"
    return MEMORY_CONTEXT_PROMPT.format(context=context)


def record_interaction(
    db: Session, user_id: str, event: str, details: dict
) -> None:
    """Record a user interaction for future personalization. Fire-and-forget."""
    try:
        upsert_memory(
            db,
            user_id=user_id,
            memory_type="INTERACTION",
            key=event,
            value={"timestamp": datetime.now(timezone.utc).isoformat(), **details},
        )
    except Exception as exc:
        logger.warning("Failed to record interaction: %s", exc)


def infer_learning_style(
    db: Session, user_id: str
) -> dict | None:
    """Infer the user's learning style from interaction history."""
    entries = get_memory_entries(db, user_id, memory_type="LEARNING_STYLE")
    if entries:
        return entries[0]
    return None
