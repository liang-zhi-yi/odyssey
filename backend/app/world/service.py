"""
World service — business logic for world state, buildings, and regions.
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

# ── Level helpers ──────────────────────────────────────────────────────

def score_to_level(overall_score: int | None) -> int:
    """Map a UserSkill overall score to a building level (1-5)."""
    if overall_score is None:
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


def score_to_next_level(overall_score: int | None) -> int:
    """Return the score threshold needed for the next building level."""
    current = score_to_level(overall_score)
    if current >= 5:
        return 101  # Max level — no next
    thresholds = [0, 21, 41, 61, 81]
    return thresholds[current]  # thresholds[1]=21, [2]=41, [3]=61, [4]=81


LEVEL_LABELS_ZH = {1: "基地", 2: "工坊", 3: "学院", 4: "研究院", 5: "堡垒"}
LEVEL_LABELS_EN = {1: "Foundation", 2: "Workshop", 3: "Academy", 4: "Institute", 5: "Citadel"}


# ── World lifecycle ────────────────────────────────────────────────────

def ensure_world_exists(db: Session, user_id: UUID) -> World:
    """Create a World + UserBuilding rows if they don't exist yet. Idempotent."""
    world = db.query(World).filter(World.user_id == user_id).first()
    if world is None:
        world = World(user_id=user_id)
        db.add(world)
        db.flush()

    # Create UserBuilding rows for any missing templates
    templates = db.query(BuildingTemplate).all()
    existing_buildings = {
        ub.building_template_id: ub
        for ub in db.query(UserBuilding)
        .filter(UserBuilding.user_id == user_id)
        .all()
    }

    now = datetime.now(timezone.utc)
    for tpl in templates:
        if tpl.id not in existing_buildings:
            user_building = UserBuilding(
                user_id=user_id,
                building_template_id=tpl.id,
                level=1,
                status=BuildingStatus.LOCKED,
            )
            db.add(user_building)

    db.commit()
    return world


# ── World state aggregation ────────────────────────────────────────────

def get_world_state(db: Session, user_id: UUID) -> dict:
    """Aggregate the full world state for a user.

    Returns a dict compatible with WorldResponse schema.
    """
    world = ensure_world_exists(db, user_id)

    # Query all user buildings with joined templates
    user_buildings = (
        db.query(UserBuilding)
        .filter(UserBuilding.user_id == user_id)
        .all()
    )

    # Build region data
    regions_map: dict[str, dict] = {}
    for ub in user_buildings:
        tpl = ub.building_template
        if tpl is None:
            # Lazy-load template
            tpl = db.query(BuildingTemplate).filter(
                BuildingTemplate.id == ub.building_template_id
            ).first()
        if tpl is None:
            continue

        region_key = tpl.region
        if region_key not in regions_map:
            regions_map[region_key] = {
                "key": region_key,
                "name": region_key,
                "buildings": 0,
                "highest_level": 0,
                "unlocked": False,
            }
        regions_map[region_key]["buildings"] += 1
        regions_map[region_key]["highest_level"] = max(
            regions_map[region_key]["highest_level"], ub.level
        )
        # Region unlocks when any building reaches level 3+
        if ub.level >= 3:
            regions_map[region_key]["unlocked"] = True

    regions = list(regions_map.values())

    # Compute stats
    active_buildings = [ub for ub in user_buildings if ub.status != BuildingStatus.LOCKED]
    total = len(user_buildings)
    active_count = len(active_buildings)
    avg_level = (
        sum(ub.level for ub in active_buildings) / active_count
        if active_count > 0
        else 0.0
    )
    highest_level = max((ub.level for ub in active_buildings), default=0)
    highest_building = None
    if active_count > 0:
        highest_ub = max(active_buildings, key=lambda ub: ub.level)
        if highest_ub.building_template:
            highest_building = highest_ub.building_template.name

    stats = {
        "total_buildings": total,
        "active_buildings": active_count,
        "average_level": round(avg_level, 1),
        "highest_level": highest_level,
        "highest_level_building_name": highest_building,
        "civilization_level": world.civilization_level,
    }

    # Serialize buildings
    buildings_data = []
    for ub in user_buildings:
        tpl = ub.building_template
        if tpl is None:
            tpl = db.query(BuildingTemplate).filter(
                BuildingTemplate.id == ub.building_template_id
            ).first()
        buildings_data.append({
            "id": ub.id,
            "building_template_id": ub.building_template_id,
            "level": ub.level,
            "status": ub.status.value if hasattr(ub.status, "value") else ub.status,
            "constructed_at": ub.constructed_at,
            "upgraded_at": ub.upgraded_at,
            "template": {
                "id": tpl.id,
                "skill_id": tpl.skill_id,
                "name": tpl.name,
                "name_en": tpl.name_en,
                "description": tpl.description,
                "description_en": tpl.description_en,
                "icon": tpl.icon,
                "region": tpl.region,
                "region_en": tpl.region_en,
                "max_level": tpl.max_level,
                "level_names": tpl.level_names,
                "position_x": tpl.position_x,
                "position_y": tpl.position_y,
            } if tpl else None,
        })

    return {
        "id": world.id,
        "user_id": world.user_id,
        "name": world.name,
        "civilization_level": world.civilization_level,
        "created_at": world.created_at,
        "updated_at": world.updated_at,
        "regions": regions,
        "buildings": buildings_data,
        "stats": stats,
    }


def get_building_detail(
    db: Session, user_id: UUID, building_id: UUID
) -> dict | None:
    """Get detailed info for a single building."""
    user_building = (
        db.query(UserBuilding)
        .filter(
            UserBuilding.id == building_id,
            UserBuilding.user_id == user_id,
        )
        .first()
    )
    if user_building is None:
        return None

    tpl = user_building.building_template
    if tpl is None:
        tpl = db.query(BuildingTemplate).filter(
            BuildingTemplate.id == user_building.building_template_id
        ).first()

    # Look up associated UserSkill for score context
    skill_scores = None
    if tpl:
        user_skill = (
            db.query(UserSkill)
            .filter(
                UserSkill.user_id == user_id,
                UserSkill.skill_id == tpl.skill_id,
            )
            .first()
        )
        if user_skill:
            skill_scores = {
                "knowledge": user_skill.knowledge_score,
                "reasoning": user_skill.reasoning_score,
                "application": user_skill.application_score,
                "creation": user_skill.creation_score,
                "overall": user_skill.overall_score,
                "rank": user_skill.rank.value if hasattr(user_skill.rank, "value") else str(user_skill.rank),
            }

    current_overall = skill_scores["overall"] if skill_scores else 0
    level = user_building.level
    level_label = LEVEL_LABELS_ZH.get(level, str(level))

    return {
        "id": user_building.id,
        "building_template_id": user_building.building_template_id,
        "level": level,
        "status": user_building.status.value if hasattr(user_building.status, "value") else str(user_building.status),
        "constructed_at": user_building.constructed_at,
        "upgraded_at": user_building.upgraded_at,
        "template": {
            "id": tpl.id,
            "skill_id": tpl.skill_id,
            "name": tpl.name,
            "name_en": tpl.name_en,
            "description": tpl.description,
            "description_en": tpl.description_en,
            "icon": tpl.icon,
            "region": tpl.region,
            "region_en": tpl.region_en,
            "max_level": tpl.max_level,
            "level_names": tpl.level_names,
            "position_x": tpl.position_x,
            "position_y": tpl.position_y,
        } if tpl else None,
        "skill_scores": skill_scores,
        "next_level_at": score_to_next_level(current_overall),
        "level_label": level_label,
    }
