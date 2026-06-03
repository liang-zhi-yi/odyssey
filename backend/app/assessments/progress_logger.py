"""
Progress logger — records a snapshot of capability change after each assessment.

Creates a ProgressLog row capturing: previous_score, new_score, score_delta, reason.
"""
import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.progress.models import ProgressLog

logger = logging.getLogger(__name__)


def log_progress(
    db: Session,
    user_id: str | UUID,
    skill_id: str | UUID,
    previous_overall: int,
    new_overall: int,
    reason: str,
) -> ProgressLog:
    """Create a ProgressLog entry recording a score change.

    Args:
        db: Database session.
        user_id: The user whose score changed.
        skill_id: The skill that was assessed.
        previous_overall: Overall score before this assessment.
        new_overall: Overall score after this assessment.
        reason: Human-readable reason (e.g. "Prompt Quest 03 — 通过").

    Returns:
        The created ProgressLog instance.
    """
    delta = new_overall - previous_overall

    log_entry = ProgressLog(
        user_id=UUID(str(user_id)),
        skill_id=UUID(str(skill_id)),
        previous_score=previous_overall,
        new_score=new_overall,
        score_delta=delta,
        reason=reason,
        created_at=datetime.now(timezone.utc),
    )
    db.add(log_entry)
    db.flush()

    logger.info(
        "ProgressLog created — user=%s skill=%s delta=%+d (%d→%d)",
        user_id, skill_id, delta, previous_overall, new_overall,
    )

    return log_entry
