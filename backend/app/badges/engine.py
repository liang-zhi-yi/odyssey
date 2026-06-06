"""
Badge check engine — evaluates badge criteria and awards badges.

Criteria types:
  - quest_complete: User has completed at least {count} assessments
  - assessment_passed: User has passed at least {count} assessments (overall >= 40)
  - all_dims_threshold: All 4 dimensions >= {threshold} for a skill (skill_id optional)
  - rank_achieved: User has at least one skill at {rank}
  - all_skills_active: User has all 4 skills with overall > 0
  - buildings_unlocked: User has {count}+ active buildings of {civ_type}
  - era_reached: User's world era is at or beyond {era}
  - compound_built: Specific compound building is active (by {name})
  - all_civ_buildings: All buildings of {civ_type} at level >= {level}
  - civilization_level: World civilization_level >= {level}
"""
import logging
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.badges.models import BadgeDefinition, UserBadge
from app.skills.models import UserSkill
from app.submissions.models import QuestSubmission
from app.world.models import (
    UserBuilding,
    BuildingTemplate,
    UserCompoundBuilding,
    CompoundBuildingTemplate,
    World,
)
from app.core.enums import SubmissionStatus, SkillRank, BuildingStatus

logger = logging.getLogger(__name__)

# ── Era ordinal mapping for comparison ────────────────────────────────────

ERA_ORDER = [
    "WILDERNESS", "AGRICULTURE", "ACADEMY", "INDUSTRY",
    "INFORMATION", "AI", "INTELLIGENCE", "DIGITAL", "FUTURE",
]


def _era_rank(era_str: str) -> int:
    """Return numeric rank of an era for >= comparison."""
    try:
        return ERA_ORDER.index(era_str)
    except ValueError:
        return -1


def check_and_award_badges(
    db: Session,
    user_id: str | UUID,
) -> list[str]:
    """Evaluate all badge definitions and award any newly earned badges.

    Called after assessment completion to check if the user has
    unlocked any achievement badges.

    Returns:
        List of badge names that were newly awarded.
    """
    user_id = UUID(str(user_id))
    all_badges = db.query(BadgeDefinition).all()
    newly_awarded: list[str] = []

    for badge in all_badges:
        earned, progress = _evaluate_criteria(db, user_id, badge)
        if earned:
            # Check if already awarded
            existing = (
                db.query(UserBadge)
                .filter(
                    UserBadge.user_id == user_id,
                    UserBadge.badge_id == badge.id,
                )
                .first()
            )
            if existing:
                # Update progress if applicable
                if progress and existing.progress_current != progress.get("current"):
                    existing.progress_current = progress["current"]
                    existing.progress_target = progress["target"]
                continue

            # Award the badge
            user_badge = UserBadge(
                user_id=user_id,
                badge_id=badge.id,
                progress_current=progress.get("current") if progress else None,
                progress_target=progress.get("target") if progress else None,
            )
            db.add(user_badge)
            newly_awarded.append(badge.name)
            logger.info("Badge awarded: %s to user %s", badge.name, user_id)

    if newly_awarded:
        db.commit()

    return newly_awarded


def get_user_badge_status(
    db: Session,
    user_id: str | UUID,
    badge_id: str | UUID,
) -> dict:
    """Get a single badge's status and progress for a user."""
    user_id = UUID(str(user_id))
    badge_id = UUID(str(badge_id))

    badge = db.query(BadgeDefinition).filter(BadgeDefinition.id == badge_id).first()
    if badge is None:
        return {"badge": None, "earned": False}

    earned, progress = _evaluate_criteria(db, user_id, badge)
    user_badge = (
        db.query(UserBadge)
        .filter(
            UserBadge.user_id == user_id,
            UserBadge.badge_id == badge_id,
        )
        .first()
    )

    return {
        "badge": badge,
        "earned": user_badge is not None or earned,
        "earned_at": user_badge.earned_at.isoformat() if user_badge and user_badge.earned_at else None,
        "progress_current": user_badge.progress_current if user_badge else (progress.get("current") if progress else None),
        "progress_target": user_badge.progress_target if user_badge else (progress.get("target") if progress else None),
    }


def _evaluate_criteria(
    db: Session,
    user_id: UUID,
    badge: BadgeDefinition,
) -> tuple[bool, dict | None]:
    """Evaluate a badge's criteria against the user's current state.

    Returns:
        Tuple of (earned: bool, progress: dict | None).
    """
    criteria = dict(badge.criteria) if badge.criteria else {}
    criteria_type = criteria.get("type", "")

    if criteria_type == "composite":
        return _eval_composite(db, user_id, criteria)
    elif criteria_type == "single":
        # Resolve the actual criteria type from type_detail, if present.
        # Seed data uses {"type": "single", "type_detail": "buildings_unlocked", ...}
        # to distinguish the dispatch field from the condition type.
        actual = dict(criteria)
        actual["type"] = criteria.get("type_detail", criteria.get("type", ""))
        return _eval_single(db, user_id, actual), None

    return False, None


def _eval_composite(
    db: Session,
    user_id: UUID,
    criteria: dict,
) -> tuple[bool, dict | None]:
    """Evaluate composite (AND/OR) criteria."""
    operator = criteria.get("operator", "AND")
    conditions = criteria.get("conditions", [])

    if operator == "AND":
        for cond in conditions:
            result, _ = _eval_composite(db, user_id, cond) if cond.get("type") == "composite" else (_eval_single(db, user_id, cond), None)
            if not result:
                return False, None
        return True, None
    elif operator == "OR":
        for cond in conditions:
            result, _ = _eval_composite(db, user_id, cond) if cond.get("type") == "composite" else (_eval_single(db, user_id, cond), None)
            if result:
                return True, None
        return False, None

    return False, None


def _eval_single(db: Session, user_id: UUID, condition: dict) -> bool:
    """Evaluate a single condition."""
    cond_type = condition.get("type", "")

    if cond_type == "quest_complete":
        # At least N assessments completed (any status)
        count = condition.get("count", 1)
        total = (
            db.query(func.count(QuestSubmission.id))
            .filter(QuestSubmission.user_id == user_id)
            .scalar()
        )
        return total >= count

    elif cond_type == "assessment_passed":
        # At least N assessments passed (PASSED status)
        count = condition.get("count", 1)
        total = (
            db.query(func.count(QuestSubmission.id))
            .filter(
                QuestSubmission.user_id == user_id,
                QuestSubmission.status == SubmissionStatus.PASSED,
            )
            .scalar()
        )
        return total >= count

    elif cond_type == "all_dims_threshold":
        # All 4 dimensions >= threshold for a skill (or any skill)
        threshold = condition.get("threshold", 60)
        skill_id = condition.get("skill_id")

        query = db.query(UserSkill).filter(UserSkill.user_id == user_id)
        if skill_id:
            query = query.filter(UserSkill.skill_id == skill_id)

        user_skills = query.all()
        if not user_skills:
            return False

        for us in user_skills:
            if (
                (us.knowledge_score or 0) >= threshold
                and (us.reasoning_score or 0) >= threshold
                and (us.application_score or 0) >= threshold
                and (us.creation_score or 0) >= threshold
            ):
                if skill_id:
                    return True
                continue
            else:
                if skill_id:
                    return False
        return not skill_id  # True if any skill passed (and we didn't early-return False)

    elif cond_type == "rank_achieved":
        # At least one skill at the specified rank
        rank_str = condition.get("rank", "ARCHITECT")
        try:
            rank = SkillRank[rank_str]
        except KeyError:
            return False

        exists = (
            db.query(UserSkill)
            .filter(
                UserSkill.user_id == user_id,
                UserSkill.rank == rank,
            )
            .first()
        )
        return exists is not None

    elif cond_type == "all_skills_active":
        # All 4 system skills have overall_score > 0
        user_skills = (
            db.query(UserSkill)
            .filter(UserSkill.user_id == user_id)
            .all()
        )
        if len(user_skills) < 4:
            return False
        return all((us.overall_score or 0) > 0 for us in user_skills)

    elif cond_type == "buildings_unlocked":
        # At least {count} active buildings of {civ_type}
        count = condition.get("count", 1)
        civ_type = condition.get("civ_type")

        query = (
            db.query(func.count(UserBuilding.id))
            .join(BuildingTemplate, UserBuilding.building_template_id == BuildingTemplate.id)
            .filter(
                UserBuilding.user_id == user_id,
                UserBuilding.status != BuildingStatus.LOCKED,
            )
        )
        if civ_type:
            query = query.filter(BuildingTemplate.civilization_type == civ_type)

        total = query.scalar()
        return total >= count

    elif cond_type == "era_reached":
        # User's world era is at least {era}
        target_era = condition.get("era", "WILDERNESS")
        world = db.query(World).filter(World.user_id == user_id).first()
        if not world:
            return False
        return _era_rank(world.era) >= _era_rank(target_era)

    elif cond_type == "compound_built":
        # Specific compound building is active (non-LOCKED)
        compound_name = condition.get("name", "")
        if not compound_name:
            return False

        exists = (
            db.query(UserCompoundBuilding)
            .join(
                CompoundBuildingTemplate,
                UserCompoundBuilding.compound_template_id == CompoundBuildingTemplate.id,
            )
            .filter(
                UserCompoundBuilding.user_id == user_id,
                UserCompoundBuilding.status != BuildingStatus.LOCKED,
                CompoundBuildingTemplate.name == compound_name,
            )
            .first()
        )
        return exists is not None

    elif cond_type == "all_civ_buildings":
        # All buildings of {civ_type} are at level >= {level}
        civ_type = condition.get("civ_type")
        level = condition.get("level", 10)

        if not civ_type:
            return False

        templates = (
            db.query(BuildingTemplate.id)
            .filter(BuildingTemplate.civilization_type == civ_type)
            .all()
        )
        template_ids = [t[0] for t in templates]
        if not template_ids:
            return False

        matching = (
            db.query(func.count(UserBuilding.id))
            .filter(
                UserBuilding.user_id == user_id,
                UserBuilding.building_template_id.in_(template_ids),
                UserBuilding.level >= level,
            )
            .scalar()
        )
        return matching >= len(template_ids)

    elif cond_type == "civilization_level":
        # World civilization_level >= {level}
        target_level = condition.get("level", 100)
        world = db.query(World).filter(World.user_id == user_id).first()
        if not world:
            return False
        return world.civilization_level >= target_level

    elif cond_type == "all_buildings_max_level":
        # Every building template has a user_building at its max_level
        templates = db.query(BuildingTemplate).all()
        if not templates:
            return False

        user_buildings = (
            db.query(UserBuilding)
            .filter(UserBuilding.user_id == user_id)
            .all()
        )
        building_by_template = {
            ub.building_template_id: ub for ub in user_buildings
        }

        for t in templates:
            ub = building_by_template.get(t.id)
            if not ub or ub.level < t.max_level:
                return False
        return True

    return False
