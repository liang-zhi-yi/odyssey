"""Quest routes — /api/v1/quests/* and /api/v1/user-quests"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.quests.schemas import (
    QuestListResponse,
    QuestDetailResponse,
    AcceptQuestResponse,
    UserQuestResponse,
    QuestRewardPreview,
)
from app.quests import service
from app.quests.service import (
    abandon_quest,
    calculate_reward_preview,
    get_building_for_skill,
)
from app.learning_paths import service as lp_service
from app.world.growth_loop import get_quests_grouped_by_civilization
from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import User

router = APIRouter(tags=["quests"])


# ── Helper builders ──────────────────────────────────────────────────────

def _build_quest_list_item(q, building_context=None, user_id=None, db=None) -> QuestListResponse:
    """Build enhanced QuestListResponse with reward preview and building info."""
    difficulty = q.difficulty.value if hasattr(q.difficulty, 'value') else str(q.difficulty)
    quest_type = q.quest_type.value if hasattr(q.quest_type, 'value') else str(q.quest_type)
    deliv = q.expected_deliverable.value if hasattr(q.expected_deliverable, 'value') else str(q.expected_deliverable)

    reward = calculate_reward_preview(difficulty, quest_type)
    associated_building = get_building_for_skill(db, q.skill_id) if db else None

    return QuestListResponse(
        id=str(q.id),
        title=q.title,
        title_en=q.title_en,
        skill_id=str(q.skill_id),
        skill_name=q.skill.name if q.skill else None,
        difficulty=difficulty,
        quest_type=quest_type,
        expected_deliverable=deliv,
        building_context=building_context,
        associated_building=associated_building,
        reward_preview=QuestRewardPreview(**reward),
    )


def _build_quest_detail(q, db=None) -> QuestDetailResponse:
    """Build enhanced QuestDetailResponse with building + reward info."""
    difficulty = q.difficulty.value if hasattr(q.difficulty, 'value') else str(q.difficulty)
    quest_type = q.quest_type.value if hasattr(q.quest_type, 'value') else str(q.quest_type)
    deliv = q.expected_deliverable.value if hasattr(q.expected_deliverable, 'value') else str(q.expected_deliverable)

    reward = calculate_reward_preview(difficulty, quest_type)
    associated_building = get_building_for_skill(db, q.skill_id) if db else None

    return QuestDetailResponse(
        id=str(q.id),
        title=q.title,
        title_en=q.title_en,
        description=q.description,
        description_en=q.description_en,
        skill_id=str(q.skill_id),
        skill_name=q.skill.name if q.skill else None,
        difficulty=difficulty,
        quest_type=quest_type,
        expected_deliverable=deliv,
        associated_building=associated_building,
        reward_preview=QuestRewardPreview(**reward),
    )


# ── Endpoints ────────────────────────────────────────────────────────────

@router.get("/quests", response_model=list[QuestListResponse])
def list_quests(
    skill_id: str | None = Query(None, description="Filter by skill UUID"),
    difficulty: str | None = Query(None, description="Filter by LEVEL_1..LEVEL_4"),
    db: Session = Depends(get_db),
):
    """Return quests, optionally filtered by skill or difficulty. Includes reward previews."""
    quests = service.get_quests(db, skill_id=skill_id, difficulty=difficulty)
    return [_build_quest_list_item(q, db=db) for q in quests]


@router.get("/quests/recommended", response_model=list[QuestListResponse])
def list_recommended_quests(
    context: str | None = Query(None, description="Optional: 'world' for building-aware recommendations"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return daily recommended quests — not yet accepted by the user.

    When context=world, prioritises quests for skills whose buildings are
    closest to leveling up, and includes building_context in each response.
    """
    quests, building_context = service.get_recommended_quests(
        db, str(current_user.id), context=context
    )
    return [
        _build_quest_list_item(
            q,
            building_context=building_context.get(str(q.id)) if building_context else None,
            db=db,
        )
        for q in quests
    ]


@router.get("/quests/path-node", response_model=list[QuestListResponse])
def list_path_node_quests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return quests for the user's current learning path checkpoint."""
    next_checkpoint = lp_service.get_next_checkpoint(db, str(current_user.id))

    if next_checkpoint and next_checkpoint.get("skill_id"):
        quests = service.get_quests_by_skill(db, next_checkpoint["skill_id"])
        return [_build_quest_list_item(q, db=db) for q in quests]

    return []


@router.get("/quests/by-civilization")
def list_quests_by_civilization(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all quests grouped by civilization type (AI文明, 工程文明, etc.).

    Each group includes the civilization label, icon, count, and quests
    with building association and reward previews.
    """
    return get_quests_grouped_by_civilization(db, user_id=str(current_user.id))


@router.get("/quests/{quest_id}", response_model=QuestDetailResponse)
def get_quest_detail(quest_id: str, db: Session = Depends(get_db)):
    """Return full details for a single quest with building info and reward preview."""
    q = service.get_quest_detail(db, quest_id)
    return _build_quest_detail(q, db=db)


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


@router.post("/quests/{quest_id}/abandon")
def abandon_accepted_quest(
    quest_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Abandon a previously accepted quest."""
    return abandon_quest(db, str(current_user.id), quest_id)
