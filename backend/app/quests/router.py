"""Quest routes — /api/v1/quests/* and /api/v1/user-quests"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.quests.schemas import (
    QuestListResponse,
    QuestDetailResponse,
    AcceptQuestResponse,
    UserQuestResponse,
)
from app.quests import service
from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import User

router = APIRouter(tags=["quests"])


@router.get("/quests", response_model=list[QuestListResponse])
def list_quests(
    skill_id: str | None = Query(None, description="Filter by skill UUID"),
    difficulty: str | None = Query(None, description="Filter by LEVEL_1..LEVEL_4"),
    db: Session = Depends(get_db),
):
    """Return quests, optionally filtered by skill or difficulty."""
    quests = service.get_quests(db, skill_id=skill_id, difficulty=difficulty)
    return [
        QuestListResponse(
            id=str(q.id),
            title=q.title,
            skill_id=str(q.skill_id),
            skill_name=q.skill.name,
            difficulty=q.difficulty.value,
            quest_type=q.quest_type.value,
            expected_deliverable=q.expected_deliverable.value,
        )
        for q in quests
    ]


@router.get("/quests/{quest_id}", response_model=QuestDetailResponse)
def get_quest_detail(quest_id: str, db: Session = Depends(get_db)):
    """Return full details for a single quest."""
    q = service.get_quest_detail(db, quest_id)
    return QuestDetailResponse(
        id=str(q.id),
        title=q.title,
        description=q.description,
        skill_id=str(q.skill_id),
        skill_name=q.skill.name,
        difficulty=q.difficulty.value,
        quest_type=q.quest_type.value,
        expected_deliverable=q.expected_deliverable.value,
    )


@router.post("/quests/{quest_id}/accept", response_model=AcceptQuestResponse)
def accept_quest(
    quest_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Accept a quest — creates a QuestSubmission with status ACCEPTED."""
    sub = service.accept_quest(db, str(current_user.id), quest_id)
    return AcceptQuestResponse(status=sub.status.value)


@router.get("/user-quests", response_model=list[UserQuestResponse])
def list_user_quests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all quests the current user has interacted with."""
    rows = service.get_user_quests(db, str(current_user.id))
    return [UserQuestResponse(**r) for r in rows]
