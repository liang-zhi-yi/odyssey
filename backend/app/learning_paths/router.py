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
    MilestoneNodeResponse,
    PathRewardsPreview,
    PathStatsSummary,
    MentorSuggestionResponse,
)
from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import User

logger = logging.getLogger(__name__)

router = APIRouter(tags=["learning-paths"])


# ── Stats Summary ──────────────────────────────────────────────────────

@router.get("/learning-paths/stats-summary", response_model=PathStatsSummary)
def get_path_stats_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return top-level civilization stats for the paths page overview cards."""
    from app.world.models import World, UserBuilding, BuildingTemplate
    from app.skills.models import UserSkill
    from app.submissions.models import QuestSubmission
    from app.world.service import score_to_tier, score_to_era

    user_id = str(current_user.id)

    # World / civilization state
    world = db.query(World).filter(World.user_id == current_user.id).first()
    civ_level = world.civilization_level if world else 1
    tier_info = score_to_tier(world.tier_score if world else 0)
    era_info = score_to_era(world.era_score if world else 0)
    civ_name = tier_info.get("tier_name_zh", "定居者文明")

    # Building counts
    user_buildings = db.query(UserBuilding).filter(
        UserBuilding.user_id == current_user.id
    ).all()
    unlocked = sum(1 for ub in user_buildings if ub.status.value not in ("LOCKED",))
    total_buildings = len(user_buildings)

    # Completed quests (PASSED submissions)
    completed_quests = db.query(QuestSubmission).filter(
        QuestSubmission.user_id == current_user.id,
        QuestSubmission.status == "PASSED",
    ).count()

    # Total skill value
    total_skill = db.query(UserSkill.overall_score).filter(
        UserSkill.user_id == current_user.id
    ).all()
    total_skill_value = sum(s[0] for s in total_skill if s[0]) if total_skill else 0

    return PathStatsSummary(
        civilization_level=civ_level,
        civilization_name=civ_name,
        era=era_info.get("era", "WILDERNESS"),
        era_icon=era_info.get("era_icon", "🏕️"),
        unlocked_buildings=unlocked,
        total_buildings=total_buildings,
        completed_quests=completed_quests,
        total_skill_value=total_skill_value,
    )


# ── AI Mentor ──────────────────────────────────────────────────────────

@router.get("/learning-paths/{path_id}/mentor-suggestions", response_model=MentorSuggestionResponse)
def get_mentor_suggestions(
    path_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return AI mentor suggestions for the current path — suggested actions,
    recommended quests, and estimated growth projections."""
    from app.world.models import World, BuildingTemplate, UserBuilding
    from app.skills.models import UserSkill
    from app.submissions.models import QuestSubmission
    from app.quests.models import Quest
    from app.world.upgrade_engine import score_to_level

    path = service.get_learning_path(db, path_id)
    user_id = str(current_user.id)

    # Find the next incomplete milestone
    next_milestone = None
    for ms in path.milestones or []:
        if not ms.is_completed:
            next_milestone = ms
            break

    # Build suggestion text
    if next_milestone:
        building_name = None
        if next_milestone.skill_id:
            tpl = db.query(BuildingTemplate).filter(
                BuildingTemplate.skill_id == next_milestone.skill_id
            ).first()
            if tpl:
                building_name = tpl.name

        current_suggestion = (
            f"当前节点: {next_milestone.title}。"
            f"完成本阶段Quest将推动 {building_name or '关联建筑'} 升级。"
        )
    else:
        current_suggestion = "恭喜完成本路径！可以创建新的学习路径继续成长。"

    # Find recommended quests for the next milestone's skill
    recommended_quests = []
    if next_milestone and next_milestone.skill_id:
        quests = db.query(Quest).filter(
            Quest.skill_id == next_milestone.skill_id
        ).limit(3).all()
        for q in quests:
            recommended_quests.append({
                "quest_id": str(q.id),
                "title": q.title,
                "skill_name": q.skill.name if q.skill else None,
                "difficulty": q.difficulty.value if hasattr(q.difficulty, 'value') else str(q.difficulty),
            })

    # Estimate growth — what buildings will benefit
    estimated_growth = None
    if next_milestone and next_milestone.skill_id:
        tpl = db.query(BuildingTemplate).filter(
            BuildingTemplate.skill_id == next_milestone.skill_id
        ).first()
        if tpl:
            ub = db.query(UserBuilding).filter(
                UserBuilding.user_id == current_user.id,
                UserBuilding.building_template_id == tpl.id,
            ).first()
            current_lv = ub.level if ub else 1
            estimated_growth = {
                "building_name": tpl.name,
                "building_icon": tpl.icon,
                "current_level": current_lv,
                "projected_level": min(current_lv + 1, tpl.max_level),
            }

    # Actions
    actions = [
        {"label": "继续学习", "url": f"/paths/{path_id}", "type": "continue"},
        {"label": "重新规划路径", "url": "/paths", "type": "plan"},
        {"label": "与导师对话", "url": "/chat", "type": "chat"},
    ]

    return MentorSuggestionResponse(
        current_suggestion=current_suggestion,
        recommended_quests=recommended_quests,
        estimated_growth=estimated_growth,
        actions=actions,
    )


# ── Helper builders ──────────────────────────────────────────────────────


def _build_milestone_node_response(m, db=None) -> MilestoneNodeResponse:
    """Build a roadmap node from a milestone."""
    # Determine status
    if m.is_completed:
        status = "COMPLETED"
    elif m.order_sequence == 0 or (
        hasattr(m, 'learning_path') and m.learning_path and
        any(prev.is_completed for prev in (m.learning_path.milestones or [])
            if prev.order_sequence < m.order_sequence)
    ):
        status = "ACTIVE"
    else:
        # Check if any previous milestone is completed
        status = "LOCKED"

    # Get building info
    associated_building = None
    if m.skill_id and db:
        from app.quests.service import get_building_for_skill
        associated_building = get_building_for_skill(db, m.skill_id)

    # Calculate progress from checkpoints
    checkpoints = m.checkpoints or []
    if checkpoints:
        completed_cps = sum(1 for c in checkpoints if c.is_completed)
        progress_pct = int(completed_cps / len(checkpoints) * 100) if checkpoints else 0
    else:
        progress_pct = 100 if m.is_completed else 0

    return MilestoneNodeResponse(
        id=m.id,
        title=m.title,
        title_en=m.title_en,
        order_sequence=m.order_sequence,
        estimated_hours=4,
        status=status,
        skill_name=m.skill.name if m.skill else None,
        associated_building=associated_building,
        progress_pct=progress_pct,
        checkpoints=[_build_checkpoint_response(c) for c in checkpoints] if checkpoints else None,
    )


def _build_path_rewards_preview(path, db=None) -> PathRewardsPreview | None:
    """Calculate what buildings will be affected by completing this path."""
    if not db or not path.milestones:
        return None

    from app.world.models import BuildingTemplate, UserBuilding, World
    from app.world.service import score_to_tier
    from app.skills.models import UserSkill
    from app.world.upgrade_engine import score_to_level

    buildings = []
    seen_skills = set()

    for ms in path.milestones:
        if ms.skill_id and ms.skill_id not in seen_skills:
            seen_skills.add(ms.skill_id)

            tpl = db.query(BuildingTemplate).filter(
                BuildingTemplate.skill_id == ms.skill_id
            ).first()
            if not tpl:
                continue

            # Current user building level
            ub = db.query(UserBuilding).filter(
                UserBuilding.user_id == path.user_id,
                UserBuilding.building_template_id == tpl.id,
            ).first()

            # Current skill score
            us = db.query(UserSkill).filter(
                UserSkill.user_id == path.user_id,
                UserSkill.skill_id == ms.skill_id,
            ).first()

            current_score = us.overall_score if us else 0
            current_level = ub.level if ub else 1

            # Project an additional ~20 points per completed milestone for this skill
            remaining = sum(1 for m2 in path.milestones
                          if m2.skill_id == ms.skill_id and not m2.is_completed)
            projected_score = min(current_score + remaining * 20, 100)
            projected_level = score_to_level(projected_score)

            buildings.append({
                "name": tpl.name,
                "name_en": tpl.name_en,
                "icon": tpl.icon,
                "current_level": current_level,
                "current_score": current_score,
                "projected_level": projected_level,
                "projected_score": projected_score,
                "region": tpl.region,
                "max_level": tpl.max_level,
            })

    # Civ tier projection
    world = db.query(World).filter(World.user_id == path.user_id).first()
    current_tier_info = score_to_tier(world.tier_score if world else 0)
    total_level_gain = sum(b["projected_level"] - b["current_level"] for b in buildings)
    projected_tier_score = (world.tier_score if world else 0) + total_level_gain * 2
    projected_tier_info = score_to_tier(projected_tier_score)

    return PathRewardsPreview(
        buildings=buildings,
        civilization_level_projection=world.civilization_level + total_level_gain if world else 1,
        tier_projection={
            "current_tier": current_tier_info["tier"],
            "current_tier_name": current_tier_info["tier_name_zh"],
            "projected_tier": projected_tier_info["tier"],
            "projected_tier_name": projected_tier_info["tier_name_zh"],
        },
    )


def _build_milestone_response(m) -> MilestoneResponse:
    """Build a MilestoneResponse from a LearningPathMilestone ORM object."""
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
        roadmap_nodes=[_build_milestone_node_response(m, db) for m in (path.milestones or [])],
        rewards_preview=_build_path_rewards_preview(path, db),
    )
