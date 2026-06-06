"""
Milestone evaluation engine.

Checks world state against milestone definitions after each assessment.
Follows the same pattern as badges/engine.py — definition-based with JSON criteria,
evaluated in order_sequence. Each milestone is awarded once and never revoked.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.world.models import (
    MilestoneDefinition,
    UserMilestone,
    UserBuilding,
    UserCompoundBuilding,
    World,
)
from app.core.enums import BuildingStatus, CivilizationTier

logger = logging.getLogger(__name__)

# ── Era ordinal mapping ───────────────────────────────────────────────────

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


def check_and_award_milestones(
    db: Session, user_id: UUID
) -> list[str]:
    """Evaluate all milestone criteria and award any newly earned ones.

    Called from upgrade_engine.sync_buildings_after_assessment()
    in a non-fatal try/except block.

    Returns:
        List of milestone names that were newly awarded.
    """
    awarded: list[str] = []

    # Get existing milestones to avoid duplicates
    existing_ids = {
        row.milestone_id
        for row in db.query(UserMilestone).filter(
            UserMilestone.user_id == user_id
        ).all()
    }

    # Load all milestone definitions in display order
    definitions = (
        db.query(MilestoneDefinition)
        .order_by(MilestoneDefinition.order_sequence)
        .all()
    )

    # Gather world state once for all evaluations
    state = _collect_world_state(db, user_id)

    for mdef in definitions:
        if mdef.id in existing_ids:
            continue  # Already awarded

        criteria = mdef.criteria
        criteria_type = criteria.get("type", "")

        if _evaluate(criteria_type, criteria, state):
            user_milestone = UserMilestone(
                user_id=user_id,
                milestone_id=mdef.id,
                unlocked_at=datetime.now(timezone.utc),
            )
            db.add(user_milestone)
            awarded.append(mdef.name)
            logger.info("Milestone awarded: %s to user %s", mdef.name, user_id)

    if awarded:
        db.flush()

    return awarded


# ── State collection ───────────────────────────────────────────────────

def _collect_world_state(db: Session, user_id: UUID) -> dict:
    """Gather all world data needed for milestone evaluation."""
    # Regular buildings
    user_buildings = (
        db.query(UserBuilding)
        .filter(UserBuilding.user_id == user_id)
        .all()
    )

    # Compound buildings
    compound_buildings = (
        db.query(UserCompoundBuilding)
        .filter(UserCompoundBuilding.user_id == user_id)
        .all()
    )

    # World / tier
    world = db.query(World).filter(World.user_id == user_id).first()

    # Determine unlocked regions (same logic as service.py)
    unlocked_regions = set()
    for ub in user_buildings:
        if ub.level >= 3 and ub.building_template:
            unlocked_regions.add(ub.building_template.region)

    return {
        "active_buildings": [ub for ub in user_buildings if ub.status != BuildingStatus.LOCKED],
        "all_buildings": user_buildings,
        "compound_buildings": compound_buildings,
        "unlocked_compounds": [cb for cb in compound_buildings if cb.status != BuildingStatus.LOCKED],
        "unlocked_regions": unlocked_regions,
        "region_count": len(unlocked_regions),
        "tier": world.tier if world else "SETTLER",
        "era": world.era if world else "WILDERNESS",
        "knowledge_points": world.knowledge_points if world else 0,
        "tech_points": world.tech_points if world else 0,
        "population": world.population if world else 0,
        "civilization_level": world.civilization_level if world else 1,
    }


# ── Criteria evaluation ────────────────────────────────────────────────

def _evaluate(criteria_type: str, criteria: dict, state: dict) -> bool:
    """Evaluate a single milestone criterion against world state."""
    if criteria_type == "building_level":
        # e.g. { "type": "building_level", "count": 1, "level": 2, "target": "any" }
        count = criteria.get("count", 1)
        level = criteria.get("level", 2)
        target = criteria.get("target", "any")

        if target == "any":
            matching = sum(
                1 for ub in state["active_buildings"] if ub.level >= level
            )
            return matching >= count
        elif target == "all":
            return all(
                ub.level >= level for ub in state["all_buildings"]
            )

    elif criteria_type == "compound_unlocked":
        # e.g. { "type": "compound_unlocked", "count": 1 }
        count = criteria.get("count", 1)
        return len(state["unlocked_compounds"]) >= count

    elif criteria_type == "region_unlocked":
        # e.g. { "type": "region_unlocked", "count": 1 }
        count = criteria.get("count", 1)
        return state["region_count"] >= count

    elif criteria_type == "tier_reached":
        # e.g. { "type": "tier_reached", "tier": "TOWN" }
        required_tier_str = criteria.get("tier", "SETTLER")
        current_tier_str = state["tier"]
        return _tier_rank(current_tier_str) >= _tier_rank(required_tier_str)

    elif criteria_type == "all_buildings_level":
        # e.g. { "type": "all_buildings_level", "level": 4, "count": 4 }
        level = criteria.get("level", 4)
        count = criteria.get("count", 4)
        matching = sum(
            1 for ub in state["all_buildings"] if ub.level >= level
        )
        return matching >= count

    elif criteria_type == "era_reached":
        # e.g. { "type": "era_reached", "era": "ACADEMY" }
        target_era = criteria.get("era", "WILDERNESS")
        current_era = state["era"]
        return _era_rank(current_era) >= _era_rank(target_era)

    elif criteria_type == "resources_accumulated":
        # e.g. { "type": "resources_accumulated", "resource": "knowledge_points", "count": 1000 }
        resource = criteria.get("resource", "knowledge_points")
        count = criteria.get("count", 100)
        current = state.get(resource, 0)
        return current >= count

    elif criteria_type == "civilization_level_reached":
        # e.g. { "type": "civilization_level_reached", "level": 10 }
        target_level = criteria.get("level", 10)
        return state["civilization_level"] >= target_level

    logger.warning("Unknown milestone criteria type: %s", criteria_type)
    return False


def _tier_rank(tier_str: str) -> int:
    """Get the numeric rank of a CivilizationTier for comparison."""
    order = ["SETTLER", "VILLAGE", "TOWN", "CITY", "METROPOLIS", "CIVILIZATION"]
    try:
        return order.index(tier_str)
    except ValueError:
        return 0
