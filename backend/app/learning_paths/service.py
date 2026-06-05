"""
Learning Paths service -- business logic for CRUD, AI generation, progress tracking.
"""
import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.learning_paths.models import (
    LearningPath,
    LearningPathMilestone,
    PathCheckpoint,
    LearningPathQuest,
)
from app.learning_paths.ai_generator import generate_learning_path, generate_path_quests
from app.learning_paths.memory import build_memory_context, record_interaction
from app.settings.models import UserSettings
from app.skills.models import Skill
from app.quests.models import Quest
from app.core.exceptions import NotFoundException, ConflictException

logger = logging.getLogger(__name__)


# -- CRUD --

def list_learning_paths(
    db: Session, user_id: str, path_type: str | None = None, status: str | None = None
) -> list[LearningPath]:
    """List user's learning paths, optionally filtered."""
    query = db.query(LearningPath).filter(LearningPath.user_id == user_id)
    if path_type:
        query = query.filter(LearningPath.path_type == path_type)
    if status:
        query = query.filter(LearningPath.status == status)
    return query.order_by(LearningPath.updated_at.desc()).all()


def list_preset_paths(db: Session) -> list[LearningPath]:
    """List official preset paths (no user_id)."""
    return (
        db.query(LearningPath)
        .filter(LearningPath.is_official == True)
        .order_by(LearningPath.difficulty)
        .all()
    )


def get_learning_path(db: Session, path_id: str) -> LearningPath:
    """Get a single learning path with milestones and checkpoints."""
    path = db.query(LearningPath).filter(LearningPath.id == path_id).first()
    if not path:
        raise NotFoundException(detail=f"Learning path '{path_id}' not found")
    return path


def create_learning_path(
    db: Session, user_id: str, data: dict
) -> LearningPath:
    """Create a new learning path from a user goal."""
    path = LearningPath(
        user_id=user_id,
        title=data["title"],
        description=data.get("description"),
        category=data.get("category"),
        target_date=data.get("target_date"),
        path_type="AI_GENERATED",
        status="ACTIVE",
    )
    db.add(path)
    db.commit()
    db.refresh(path)
    return path


def update_learning_path(
    db: Session, path_id: str, user_id: str, data: dict
) -> LearningPath:
    """Update path metadata."""
    path = _get_user_path(db, path_id, user_id)
    for field in ("title", "description", "category", "target_date", "status"):
        if field in data and data[field] is not None:
            setattr(path, field, data[field])
    path.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(path)
    return path


def delete_learning_path(
    db: Session, path_id: str, user_id: str
) -> None:
    """Delete a learning path and cascade to milestones/checkpoints."""
    path = _get_user_path(db, path_id, user_id)
    db.delete(path)
    db.commit()


# -- AI Generation --

def generate_path_structure(
    db: Session, path_id: str, user_id: str
) -> dict:
    """Use LLM to generate a full milestone + checkpoint structure for a path.

    Loads per-user LLM config from UserSettings and memory context from
    the memory bank. Falls back to generic structure if LLM fails.
    """
    path = _get_user_path(db, path_id, user_id)

    # Load per-user LLM config for path generation
    user_settings = (
        db.query(UserSettings)
        .filter(UserSettings.user_id == user_id)
        .first()
    )
    llm_kwargs = _get_path_llm_kwargs(user_settings)

    # Build memory context
    memory_ctx = build_memory_context(db, user_id)

    # Call AI generator
    result = generate_learning_path(
        title=path.title,
        description=path.description,
        memory_context=memory_ctx,
        **llm_kwargs,
    )

    # Clear existing milestones (replace with new generation)
    db.query(LearningPathMilestone).filter(
        LearningPathMilestone.learning_path_id == path.id
    ).delete()

    # Save generated structure
    milestone_count = 0
    total_checkpoints = 0
    # Track checkpoint IDs for post-commit quest generation
    checkpoint_ids: list[tuple[str, str]] = []  # (milestone_id, checkpoint_id)

    for m_data in result.get("milestones", []):
        milestone_count += 1
        skill_id = _resolve_skill_id(db, m_data.get("skill_name"))

        milestone = LearningPathMilestone(
            learning_path_id=path.id,
            title=m_data["title"],
            title_en=m_data.get("title_en"),
            description=m_data.get("description"),
            description_en=m_data.get("description_en"),
            skill_id=skill_id,
            order_sequence=m_data.get("order_sequence", milestone_count - 1),
        )
        db.add(milestone)
        db.flush()  # get milestone.id

        for c_data in m_data.get("checkpoints", []):
            checkpoint = PathCheckpoint(
                milestone_id=milestone.id,
                title=c_data["title"],
                title_en=c_data.get("title_en"),
                description=c_data.get("description"),
                description_en=c_data.get("description_en"),
                order_sequence=c_data.get("order_sequence", 0),
                required_score=c_data.get("required_score", 60),
            )
            db.add(checkpoint)
            db.flush()  # get checkpoint.id
            checkpoint_ids.append((str(milestone.id), str(checkpoint.id)))
            total_checkpoints += 1

    # Update path metadata
    path.path_metadata = {
        "path_summary": result.get("path_summary", ""),
        "difficulty": result.get("difficulty", 1),
        "estimated_weeks": result.get("estimated_weeks", 0),
    }
    path.difficulty = result.get("difficulty", 1)
    path.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(path)

    # Auto-generate quests for each checkpoint
    quests_total = 0
    for ms_id, cp_id in checkpoint_ids:
        try:
            qr = _generate_checkpoint_quests_internal(
                db, path_id, ms_id, cp_id, user_id
            )
            quests_total += qr.get("quests_generated", 0)
        except Exception as exc:
            logger.warning(
                "Failed to auto-generate quests for checkpoint %s: %s", cp_id, exc
            )
            # Rollback the broken session so subsequent checkpoints can proceed
            try:
                db.rollback()
            except Exception:
                pass

    # Record interaction
    record_interaction(
        db, user_id, "path_generated",
        {
            "path_id": str(path.id),
            "milestone_count": milestone_count,
            "checkpoint_count": total_checkpoints,
            "quests_generated": quests_total,
        },
    )

    return {
        "path_id": str(path.id),
        "path_summary": result.get("path_summary", ""),
        "difficulty": result.get("difficulty", 1),
        "estimated_weeks": result.get("estimated_weeks", 0),
        "milestone_count": milestone_count,
        "total_checkpoints": total_checkpoints,
        "quests_generated": quests_total,
    }


def generate_checkpoint_quests(
    db: Session, path_id: str, milestone_id: str, checkpoint_id: str, user_id: str
) -> dict:
    """Generate quests for a specific checkpoint via LLM.

    Creates Quest records linked to the target skill and learning_path_quests entries.
    """
    # Validate access
    _get_user_path(db, path_id, user_id)
    return _generate_checkpoint_quests_internal(
        db, path_id, milestone_id, checkpoint_id, user_id
    )


def _generate_checkpoint_quests_internal(
    db: Session, path_id: str, milestone_id: str, checkpoint_id: str, user_id: str
) -> dict:
    """Internal: generate quests for a checkpoint without re-validating path ownership.

    Caller must commit the DB session after this returns.
    """
    path = db.query(LearningPath).filter(LearningPath.id == path_id).first()
    if not path:
        raise NotFoundException(detail=f"Learning path '{path_id}' not found")

    checkpoint = (
        db.query(PathCheckpoint)
        .filter(
            PathCheckpoint.id == checkpoint_id,
            PathCheckpoint.milestone_id == milestone_id,
        )
        .first()
    )
    if not checkpoint:
        raise NotFoundException(detail="Checkpoint not found")

    milestone = (
        db.query(LearningPathMilestone)
        .filter(LearningPathMilestone.id == milestone_id)
        .first()
    )

    # Get skill name if linked
    skill_name = None
    skill_id = milestone.skill_id if milestone else None
    if milestone and milestone.skill_id:
        skill = db.query(Skill).filter(Skill.id == milestone.skill_id).first()
        if skill:
            skill_name = skill.name

    # If no skill is linked, we cannot create quests (quests require skill_id NOT NULL).
    # Return early with zero quests generated.
    if not skill_id:
        logger.info(
            "Skipping quest generation for checkpoint %s — no skill linked to milestone",
            checkpoint_id,
        )
        checkpoint.quest_generation_status = "SKIPPED"
        db.commit()
        return {
            "checkpoint_id": str(checkpoint_id),
            "quests_generated": 0,
            "quests": [],
        }

    # Load per-user LLM config
    user_settings = (
        db.query(UserSettings)
        .filter(UserSettings.user_id == user_id)
        .first()
    )
    llm_kwargs = _get_path_llm_kwargs(user_settings)
    memory_ctx = build_memory_context(db, user_id)

    # Call AI quest generator
    quest_data = generate_path_quests(
        checkpoint_title=checkpoint.title,
        checkpoint_description=checkpoint.description,
        skill_name=skill_name,
        difficulty_level=path.difficulty,
        memory_context=memory_ctx,
        **llm_kwargs,
    )

    # Create Quest records + LearningPathQuest links
    generated = []
    for q_data in quest_data:
        quest = Quest(
            title=q_data["title"],
            title_en=q_data.get("title_en"),
            description=q_data.get("description"),
            description_en=q_data.get("description_en"),
            skill_id=skill_id,
            difficulty=q_data.get("difficulty", "LEVEL_1"),
            quest_type=q_data.get("quest_type", "APPLICATION"),
            expected_deliverable=q_data.get("expected_deliverable", "CODE"),
            user_id=UUID(user_id),
        )
        db.add(quest)
        db.flush()

        # Link quest to checkpoint
        link = LearningPathQuest(
            checkpoint_id=checkpoint.id,
            user_id=UUID(user_id),
            quest_id=quest.id,
            skill_id=skill_id,
            status="ACTIVE",
        )
        db.add(link)

        generated.append({
            "id": str(link.id),
            "quest_id": str(quest.id),
            "title": quest.title,
            "skill_id": str(skill_id) if skill_id else None,
            "skill_name": skill_name,
            "status": "ACTIVE",
        })

    # Update checkpoint status
    checkpoint.quest_generation_status = "GENERATED"
    db.commit()

    record_interaction(
        db, user_id, "quests_generated",
        {"checkpoint_id": str(checkpoint_id), "quest_count": len(generated)},
    )

    return {
        "checkpoint_id": str(checkpoint_id),
        "quests_generated": len(generated),
        "quests": generated,
    }


# -- Progress --

def toggle_milestone(
    db: Session, path_id: str, milestone_id: str, user_id: str
) -> dict:
    """Toggle a milestone's completion status and recalculate progress."""
    path = _get_user_path(db, path_id, user_id)

    milestone = (
        db.query(LearningPathMilestone)
        .filter(
            LearningPathMilestone.id == milestone_id,
            LearningPathMilestone.learning_path_id == path.id,
        )
        .first()
    )
    if not milestone:
        raise NotFoundException(detail="Milestone not found")

    milestone.is_completed = not milestone.is_completed
    milestone.completed_at = (
        datetime.now(timezone.utc) if milestone.is_completed else None
    )

    # Recalculate path progress
    all_milestones = (
        db.query(LearningPathMilestone)
        .filter(LearningPathMilestone.learning_path_id == path.id)
        .all()
    )
    if all_milestones:
        completed = sum(1 for m in all_milestones if m.is_completed)
        path.progress_pct = int(completed / len(all_milestones) * 100)
    else:
        path.progress_pct = 0

    # Check if next checkpoint is unlocked
    next_unlocked = False
    if milestone.is_completed:
        # Unlock the first incomplete checkpoint in the next milestone
        next_milestone = (
            db.query(LearningPathMilestone)
            .filter(
                LearningPathMilestone.learning_path_id == path.id,
                LearningPathMilestone.order_sequence > milestone.order_sequence,
                LearningPathMilestone.is_completed == False,
            )
            .order_by(LearningPathMilestone.order_sequence)
            .first()
        )
        if next_milestone:
            next_unlocked = True

    path.updated_at = datetime.now(timezone.utc)
    db.commit()

    return {
        "milestone_id": uuid_to_str(milestone.id),
        "is_completed": milestone.is_completed,
        "path_progress_pct": path.progress_pct,
        "next_checkpoint_unlocked": next_unlocked,
    }


def get_next_checkpoint(
    db: Session, user_id: str, path_id: str | None = None
) -> dict | None:
    """Get the next uncompleted checkpoint for a user's active path."""
    query = db.query(LearningPath).filter(
        LearningPath.user_id == user_id,
        LearningPath.status == "ACTIVE",
    )
    if path_id:
        query = query.filter(LearningPath.id == path_id)
    path = query.first()
    if not path:
        return None

    # Find first incomplete milestone
    for milestone in path.milestones:
        if not milestone.is_completed:
            # Find first incomplete checkpoint
            for checkpoint in milestone.checkpoints:
                if not checkpoint.is_completed:
                    skill_name = None
                    if milestone.skill_id:
                        skill = db.query(Skill).filter(Skill.id == milestone.skill_id).first()
                        if skill:
                            skill_name = skill.name

                    return {
                        "path_id": str(path.id),
                        "path_title": path.title,
                        "milestone_id": str(milestone.id),
                        "milestone_title": milestone.title,
                        "milestone_title_en": milestone.title_en,
                        "checkpoint_id": str(checkpoint.id),
                        "checkpoint_title": checkpoint.title,
                        "checkpoint_title_en": checkpoint.title_en,
                        "skill_id": str(milestone.skill_id) if milestone.skill_id else None,
                        "skill_name": skill_name,
                        "required_score": checkpoint.required_score,
                    }

    return None  # All complete


# -- Helpers --

def _get_user_path(db: Session, path_id: str, user_id: str) -> LearningPath:
    """Get a path owned by the user, or raise NotFound."""
    path = db.query(LearningPath).filter(
        LearningPath.id == path_id, LearningPath.user_id == user_id
    ).first()
    if not path:
        raise NotFoundException(detail=f"Learning path '{path_id}' not found")
    return path


def _resolve_skill_id(db: Session, skill_name: str | None) -> UUID | None:
    """Resolve a skill name to its UUID. Returns None if not found."""
    if not skill_name:
        return None
    skill = db.query(Skill).filter(Skill.name.ilike(skill_name.strip())).first()
    return skill.id if skill else None


def _get_path_llm_kwargs(settings: UserSettings | None) -> dict:
    """Extract path-specific LLM config from UserSettings.

    Priority: path_llm_* fields first, then general llm_* fields as fallback.
    This unifies path LLM config with the agent/assessment LLM config.
    """
    if not settings:
        return {}
    kwargs = {}
    # Path-specific overrides take priority
    if settings.path_llm_api_key:
        kwargs["user_api_key"] = settings.path_llm_api_key
    elif settings.llm_api_key:
        kwargs["user_api_key"] = settings.llm_api_key
    if settings.path_llm_base_url:
        kwargs["user_base_url"] = settings.path_llm_base_url
    elif settings.llm_base_url:
        kwargs["user_base_url"] = settings.llm_base_url
    if settings.path_llm_model:
        kwargs["user_model"] = settings.path_llm_model
    elif settings.llm_model:
        kwargs["user_model"] = settings.llm_model
    if settings.path_llm_provider:
        kwargs["user_provider"] = settings.path_llm_provider
    elif settings.llm_provider:
        kwargs["user_provider"] = settings.llm_provider
    return kwargs


def uuid_to_str(val: UUID | str) -> str:
    return str(val)
