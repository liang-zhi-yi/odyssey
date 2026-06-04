"""
Building upgrade engine — syncs UserBuilding levels to match UserSkill scores.

Called after every assessment (like badges/credentials).
Building level is purely derived from UserSkill.overall_score — no separate logic.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.world.models import BuildingTemplate, UserBuilding, World
from app.skills.models import UserSkill
from app.core.enums import BuildingStatus

logger = logging.getLogger(__name__)


def score_to_level(overall_score: int | None) -> int:
    """Map UserSkill overall score → building level (1-5)."""
    if overall_score is None or overall_score <= 0:
        return 1
    if overall_score <= 20:
        return 1
    elif overall_score <= 40:
        return 2
    elif overall_score <= 60:
        return 3
    elif overall_score <= 80:
        return 4
    else:
        return 5


def sync_buildings_after_assessment(
    db: Session,
    user_id: str | UUID,
) -> list[dict]:
    """Sync all UserBuilding levels to UserSkill scores after assessment.

    Returns:
        List of upgrade events: [{"building": str, "from": int, "to": int}, ...]
    """
    user_id = UUID(user_id) if isinstance(user_id, str) else user_id

    # Ensure world and buildings exist
    world = db.query(World).filter(World.user_id == user_id).first()
    if world is None:
        world = World(user_id=user_id)
        db.add(world)
        db.flush()

    # Ensure UserBuilding rows exist for all templates
    templates = db.query(BuildingTemplate).all()
    existing = {
        ub.building_template_id: ub
        for ub in db.query(UserBuilding)
        .filter(UserBuilding.user_id == user_id)
        .all()
    }
    now = datetime.now(timezone.utc)
    for tpl in templates:
        if tpl.id not in existing:
            ub = UserBuilding(
                user_id=user_id,
                building_template_id=tpl.id,
                level=1,
                status=BuildingStatus.LOCKED,
            )
            db.add(ub)
            existing[tpl.id] = ub

    db.flush()

    upgrades = []

    for tpl in templates:
        ub = existing.get(tpl.id)
        if ub is None:
            continue

        # Get the associated UserSkill
        user_skill = (
            db.query(UserSkill)
            .filter(
                UserSkill.user_id == user_id,
                UserSkill.skill_id == tpl.skill_id,
            )
            .first()
        )

        old_level = ub.level
        overall = user_skill.overall_score if user_skill else 0

        # Determine target level
        if overall is None or overall <= 0:
            target_level = 1
            new_status = BuildingStatus.LOCKED
        else:
            target_level = score_to_level(overall)
            if target_level > old_level:
                new_status = BuildingStatus.UPGRADING
            elif target_level == old_level and old_level > 1:
                new_status = BuildingStatus.STABLE
            else:
                new_status = BuildingStatus.CONSTRUCTING if target_level == 1 and overall > 0 else BuildingStatus.STABLE

        # Apply upgrade if level changed
        if target_level != old_level and target_level > old_level:
            ub.level = target_level
            ub.status = new_status
            ub.upgraded_at = now
            if ub.constructed_at is None:
                ub.constructed_at = now

            upgrades.append({
                "building_name": tpl.name,
                "building_name_en": tpl.name_en,
                "from_level": old_level,
                "to_level": target_level,
            })
            logger.info(
                "Building upgraded: %s Lv.%d → Lv.%d (user=%s)",
                tpl.name, old_level, target_level, user_id,
            )
        elif target_level == old_level:
            # Update status if needed (e.g., STABLE after UPGRADING settles)
            if ub.status in (BuildingStatus.UPGRADING, BuildingStatus.CONSTRUCTING):
                ub.status = BuildingStatus.STABLE
            # Update constructed_at for first activation
            if ub.constructed_at is None and overall > 0:
                ub.constructed_at = now
                ub.status = BuildingStatus.CONSTRUCTING

    # Recalculate civilization level
    if upgrades:
        _recalculate_civilization_level(db, world, user_id)

    db.commit()
    return upgrades


def _recalculate_civilization_level(
    db: Session, world: World, user_id: UUID
) -> None:
    """Update civilization_level based on total building levels."""
    user_buildings = (
        db.query(UserBuilding)
        .filter(
            UserBuilding.user_id == user_id,
            UserBuilding.status != BuildingStatus.LOCKED,
        )
        .all()
    )
    if not user_buildings:
        world.civilization_level = 1
        return

    total_levels = sum(ub.level for ub in user_buildings)
    # Civilization level scales with total building levels
    # Base: 1, each 3 building-levels = +1 civilization level
    world.civilization_level = max(1, 1 + (total_levels - len(user_buildings)) // 2)
