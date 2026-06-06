"""Learning Paths routes -- /api/v1/learning-paths/* and /api/v1/memory/*"""
import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.learning_paths import service
from app.learning_paths import memory as memory_bank
from app.learning_paths.schemas import (
    LearningPathResponse,
    LearningPathDetailResponse,
    CreateLearningPathRequest,
    UpdateLearningPathRequest,
    GeneratePathResponse,
    GenerateQuestsResponse,
    ToggleMilestoneResponse,
    MilestoneResponse,
    CheckpointResponse,
    GeneratedQuestResponse,
    UserMemoryEntry,
    UpsertMemoryRequest,
)
from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import User

logger = logging.getLogger(__name__)

router = APIRouter(tags=["learning-paths"])


# -- Helper builders --

def _build_milestone_response(m) -> MilestoneResponse:
    skill_name = m.skill.name if m.skill else None
    return MilestoneResponse(
        id=m.id,
        learning_path_id=m.learning_path_id,
        title=m.title,
        title_en=m.title_en,
        description=m.description,
        description_en=m.description_en,
        skill_id=m.skill_id,
        skill_name=skill_name,
        is_completed=m.is_completed,
        completed_at=m.completed_at,
        order_sequence=m.order_sequence,
        checkpoints=[_build_checkpoint_response(c) for c in (m.checkpoints or [])],
    )


def _build_checkpoint_response(c) -> CheckpointResponse:
    generated = [
        GeneratedQuestResponse(
            id=g.id,
            quest_id=g.quest_id,
            title=g.quest.title if g.quest else None,
            skill_id=g.skill_id,
            skill_name=g.quest.skill.name if g.quest and g.quest.skill else None,
            status=g.status,
        )
        for g in (c.generated_quests or [])
    ]
    return CheckpointResponse(
        id=c.id,
        milestone_id=c.milestone_id,
        title=c.title,
        title_en=c.title_en,
        description=c.description,
        description_en=c.description_en,
        order_sequence=c.order_sequence,
        required_score=c.required_score,
        quest_generation_status=c.quest_generation_status,
        is_completed=c.is_completed,
        completed_at=c.completed_at,
        generated_quests=generated or None,
    )


def _build_path_response(p, db=None) -> LearningPathResponse:
    # Resolve targeted buildings from path milestones → skill → building
    targeted_buildings = None
    if db is not None:
        try:
            from app.world.path_bridge import get_path_building_targets
            targeted_buildings = get_path_building_targets(db, p.id)
        except Exception:
            pass

    return LearningPathResponse(
        id=p.id,
        user_id=p.user_id,
        title=p.title,
        description=p.description,
        category=p.category,
        target_date=p.target_date,
        status=p.status,
        path_type=p.path_type,
        is_official=p.is_official,
        difficulty=p.difficulty,
        progress_pct=p.progress_pct,
        path_metadata=p.path_metadata,
        milestone_count=len(p.milestones) if p.milestones else 0,
        targeted_buildings=targeted_buildings,
        created_at=p.created_at,
        updated_at=p.updated_at,
    )


# -- Learning Paths --

@router.get("/learning-paths", response_model=list[LearningPathResponse])
def list_learning_paths(
    path_type: str | None = Query(None, description="Filter by AI_GENERATED or PRESET"),
    status: str | None = Query(None, description="Filter by ACTIVE, COMPLETED, ABANDONED"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List learning paths for the current user. Also includes preset paths."""
    user_paths = service.list_learning_paths(
        db, str(current_user.id), path_type=path_type, status=status
    )
    return [_build_path_response(p, db) for p in user_paths]


@router.get("/learning-paths/presets", response_model=list[LearningPathResponse])
def list_preset_paths(
    db: Session = Depends(get_db),
):
    """List official preset learning path templates."""
    paths = service.list_preset_paths(db)
    return [_build_path_response(p, db) for p in paths]


@router.post("/learning-paths", response_model=LearningPathDetailResponse)
def create_learning_path(
    body: CreateLearningPathRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new learning path from a user goal."""
    path = service.create_learning_path(
        db, str(current_user.id), body.model_dump()
    )
    # Auto-generate path structure if requested
    if body.generate_with_ai:
        service.generate_path_structure(db, str(path.id), str(current_user.id))
        db.refresh(path)

    return _build_detail_response(path, db)


@router.get("/learning-paths/next-checkpoint")
def get_next_checkpoint(
    path_id: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the next uncompleted checkpoint for the user's active path."""
    result = service.get_next_checkpoint(db, str(current_user.id), path_id)
    return result


@router.get("/learning-paths/{path_id}", response_model=LearningPathDetailResponse)
def get_learning_path(
    path_id: str,
    db: Session = Depends(get_db),
):
    """Get a single learning path with milestones and checkpoints."""
    path = service.get_learning_path(db, path_id)
    return _build_detail_response(path, db)


@router.put("/learning-paths/{path_id}", response_model=LearningPathResponse)
def update_learning_path(
    path_id: str,
    body: UpdateLearningPathRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update learning path metadata."""
    path = service.update_learning_path(
        db, path_id, str(current_user.id), body.model_dump(exclude_none=True)
    )
    return _build_path_response(path, db)

@router.delete("/learning-paths/{path_id}")
def delete_learning_path(
    path_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a learning path and all associated milestones/checkpoints."""
    service.delete_learning_path(db, path_id, str(current_user.id))
    return {"detail": "ok"}


# -- World Impact --

@router.get("/learning-paths/{path_id}/world-impact")
def get_path_world_impact(
    path_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Analyze how completing this learning path would affect the world."""
    result = service.get_path_world_impact(db, str(current_user.id), path_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Learning path not found")
    return result


# -- AI Generation --

@router.post("/learning-paths/{path_id}/generate", response_model=GeneratePathResponse)
def generate_path(
    path_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """AI-generate milestones and checkpoints for a learning path."""
    result = service.generate_path_structure(db, path_id, str(current_user.id))
    return GeneratePathResponse(**result)


@router.post("/learning-paths/{path_id}/regenerate", response_model=GeneratePathResponse)
def regenerate_path(
    path_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Re-generate milestones and checkpoints (replaces existing structure)."""
    result = service.generate_path_structure(db, path_id, str(current_user.id))
    return GeneratePathResponse(**result)


@router.post(
    "/learning-paths/{path_id}/milestones/{milestone_id}/checkpoints/{checkpoint_id}/generate-quests",
    response_model=GenerateQuestsResponse,
)
def generate_checkpoint_quests(
    path_id: str,
    milestone_id: str,
    checkpoint_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate quests for a specific checkpoint via LLM."""
    result = service.generate_checkpoint_quests(
        db, path_id, milestone_id, checkpoint_id, str(current_user.id)
    )
    return GenerateQuestsResponse(**result)


# -- Progress --

@router.put(
    "/learning-paths/{path_id}/milestones/{milestone_id}",
    response_model=ToggleMilestoneResponse,
)
def toggle_milestone(
    path_id: str,
    milestone_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Toggle a milestone's completion status."""
    result = service.toggle_milestone(
        db, path_id, milestone_id, str(current_user.id)
    )
    return ToggleMilestoneResponse(**result)


# -- Memory Bank --

@router.get("/memory", response_model=list[UserMemoryEntry])
def list_memory(
    memory_type: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all memory entries for the current user."""
    entries = memory_bank.get_memory_entries(db, str(current_user.id), memory_type)
    return [UserMemoryEntry(**e) for e in entries]


@router.post("/memory", response_model=UserMemoryEntry)
def upsert_memory(
    body: UpsertMemoryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create or update a memory entry."""
    entry = memory_bank.upsert_memory(
        db,
        str(current_user.id),
        body.memory_type,
        body.key,
        body.value,
    )
    return UserMemoryEntry(**entry)


@router.delete("/memory/{memory_id}")
def delete_memory(
    memory_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a memory entry."""
    ok = memory_bank.delete_memory(db, memory_id, str(current_user.id))
    if not ok:
        return {"detail": "not found"}
    return {"detail": "ok"}


@router.delete("/memory")
def clear_memory(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Clear all memory entries for the current user."""
    count = memory_bank.clear_all_memory(db, str(current_user.id))
    return {"deleted": count}


def _build_detail_response(path, db=None) -> LearningPathDetailResponse:
    # Resolve targeted buildings from path milestones
    targeted_buildings = None
    if db is not None:
        try:
            from app.world.path_bridge import get_path_building_targets
            targeted_buildings = get_path_building_targets(db, path.id)
        except Exception:
            pass

    return LearningPathDetailResponse(
        id=path.id,
        user_id=path.user_id,
        title=path.title,
        description=path.description,
        category=path.category,
        target_date=path.target_date,
        status=path.status,
        path_type=path.path_type,
        is_official=path.is_official,
        difficulty=path.difficulty,
        progress_pct=path.progress_pct,
        path_metadata=path.path_metadata,
        milestone_count=len(path.milestones) if path.milestones else 0,
        targeted_buildings=targeted_buildings,
        created_at=path.created_at,
        updated_at=path.updated_at,
        milestones=[_build_milestone_response(m) for m in (path.milestones or [])],
    )
