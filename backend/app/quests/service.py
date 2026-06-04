"""Quests business logic — list, detail, accept, user quests."""

from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.quests.models import Quest
from app.submissions.models import QuestSubmission
from app.core.enums import SubmissionStatus
from app.core.exceptions import ConflictException, NotFoundException


def get_quests(
    db: Session,
    skill_id: str | None = None,
    difficulty: str | None = None,
) -> list[Quest]:
    """Return quests with skill relationship loaded, optionally filtered by skill and/or difficulty."""
    q = db.query(Quest).options(joinedload(Quest.skill))
    if skill_id:
        q = q.filter(Quest.skill_id == skill_id)
    if difficulty:
        q = q.filter(Quest.difficulty == difficulty)
    return q.order_by(Quest.difficulty, Quest.title).all()


def get_quest_detail(db: Session, quest_id: str) -> Quest:
    """Return a single quest with its skill relationship loaded, or raise NotFoundException."""
    quest = (
        db.query(Quest)
        .options(joinedload(Quest.skill))
        .filter(Quest.id == quest_id)
        .first()
    )
    if quest is None:
        raise NotFoundException("Quest", quest_id)
    return quest


def accept_quest(db: Session, user_id: str, quest_id: str) -> QuestSubmission:
    """Accept a quest — creates a QuestSubmission with status ACCEPTED."""
    # Ensure the quest exists
    _ = get_quest_detail(db, quest_id)

    # Prevent duplicate acceptance of the same quest by the same user
    existing = (
        db.query(QuestSubmission)
        .filter(
            QuestSubmission.user_id == user_id,
            QuestSubmission.quest_id == quest_id,
        )
        .first()
    )
    if existing is not None:
        raise ConflictException(
            "QUEST_ALREADY_ACCEPTED",
            "You have already accepted this quest",
        )

    submission = QuestSubmission(
        user_id=UUID(user_id),
        quest_id=UUID(quest_id),
        status=SubmissionStatus.ACCEPTED,
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


def get_user_quests(db: Session, user_id: str) -> list[dict]:
    """Return all quests the user has interacted with (accepted → passed/failed)."""
    rows = (
        db.query(QuestSubmission, Quest.title)
        .join(Quest, QuestSubmission.quest_id == Quest.id)
        .filter(QuestSubmission.user_id == user_id)
        .order_by(QuestSubmission.submitted_at.desc().nullslast())
        .all()
    )
    return [
        {
            "quest_id": str(sub.quest_id),
            "quest_title": title,
            "status": sub.status.value,
        }
        for sub, title in rows
    ]
