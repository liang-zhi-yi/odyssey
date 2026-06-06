"""
Path ↔ World bridge service.

Centralizes the connection between learning paths and world buildings:
  Skills → Buildings → Civilization Level → Era

Provides:
  - get_path_building_targets: which buildings a path will grow
  - on_milestone_completed: resource boost + building sync on milestone completion
  - recommend_skills_for_locked_buildings: suggest skills for locked buildings
"""
from __future__ import annotations

import logging
from uuid import UUID

from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def get_path_building_targets(db: Session, path_id: UUID) -> list[dict]:
    """Get which buildings a learning path will grow, based on milestone skill_ids.

    Each LearningPathMilestone has an optional skill_id FK → skills table.
    Each skill has a 1:1 BuildingTemplate via skill_id FK.
    Returns building info for each unique skill targeted by the path.
    """
    from app.learning_paths.models import LearningPathMilestone
    from app.world.models import BuildingTemplate
    from app.skills.models import Skill

    milestones = (
        db.query(LearningPathMilestone)
        .filter(LearningPathMilestone.learning_path_id == path_id)
        .all()
    )

    # Collect unique skill_ids from milestones
    skill_ids: set[UUID] = set()
    for ms in milestones:
        if ms.skill_id:
            skill_ids.add(ms.skill_id)

    # Map to building templates (1:1 skill → building)
    targets = []
    for skill_id in skill_ids:
        tpl = (
            db.query(BuildingTemplate)
            .filter(BuildingTemplate.skill_id == skill_id)
            .first()
        )
        if tpl:
            skill = db.query(Skill).filter(Skill.id == skill_id).first()
            # Count incomplete milestones targeting this skill
            incomplete_count = sum(
                1 for ms in milestones
                if ms.skill_id == skill_id and not ms.is_completed
            )
            targets.append({
                "building_id": str(tpl.id),
                "building_name": tpl.name,
                "building_name_en": tpl.name_en,
                "building_icon": tpl.icon,
                "skill_id": str(skill_id),
                "skill_name": skill.name if skill else None,
                "region": tpl.region,
                "region_en": tpl.region_en,
                "max_level": tpl.max_level,
                "civilization_type": tpl.civilization_type,
                "era": tpl.era,
                "remaining_milestones": incomplete_count,
            })

    return targets


def on_milestone_completed(
    db: Session,
    user_id: UUID,
    milestone_id: UUID,
) -> dict:
    """Handle milestone completion side effects.

    Grants a small resource boost and triggers a building sync.
    Returns resource changes for display.
    """
    from app.world.models import World
    from app.world.upgrade_engine import sync_buildings_after_assessment

    world = db.query(World).filter(World.user_id == user_id).first()
    if world is None:
        return {"knowledge_gained": 0, "tech_gained": 0, "population_gained": 0}

    # Small resource boost for completing a learning milestone
    knowledge_gained = 5
    tech_gained = 2
    population_gained = 1

    world.knowledge_points = (world.knowledge_points or 0) + knowledge_gained
    world.tech_points = (world.tech_points or 0) + tech_gained
    world.population = (world.population or 0) + population_gained

    # Sync buildings from skill scores (in case skills changed)
    try:
        sync_buildings_after_assessment(db, user_id)
    except Exception as exc:
        logger.warning("Building sync after milestone completion failed: %s", exc)

    return {
        "knowledge_gained": knowledge_gained,
        "tech_gained": tech_gained,
        "population_gained": population_gained,
    }


def recommend_skills_for_locked_buildings(
    db: Session, user_id: UUID, limit: int = 10
) -> list[dict]:
    """Suggest skills whose buildings are still locked (user has no score).

    Returns top-N recommendations sorted by civilization_type diversity.
    """
    from app.world.models import BuildingTemplate, UserBuilding, BuildingStatus
    from app.skills.models import Skill, UserSkill

    # Get locked user buildings
    locked_buildings = (
        db.query(UserBuilding)
        .filter(
            UserBuilding.user_id == user_id,
            UserBuilding.status == BuildingStatus.LOCKED.value,
        )
        .all()
    )

    recommendations = []
    seen_skills: set[UUID] = set()

    for ub in locked_buildings:
        tpl = (
            db.query(BuildingTemplate)
            .filter(BuildingTemplate.id == ub.building_template_id)
            .first()
        )
        if tpl is None or tpl.skill_id is None:
            continue
        if tpl.skill_id in seen_skills:
            continue
        seen_skills.add(tpl.skill_id)

        skill = db.query(Skill).filter(Skill.id == tpl.skill_id).first()
        if skill is None:
            continue

        # Check if user already has some score
        us = (
            db.query(UserSkill)
            .filter(
                UserSkill.user_id == user_id,
                UserSkill.skill_id == tpl.skill_id,
            )
            .first()
        )
        if us and (us.overall_score or 0) > 0:
            continue  # already active, skip

        recommendations.append({
            "skill_name": skill.name,
            "skill_name_en": getattr(skill, "name_en", None),
            "building_name": tpl.name,
            "building_name_en": tpl.name_en,
            "building_icon": tpl.icon,
            "region": tpl.region,
            "civilization_type": tpl.civilization_type,
        })

    return recommendations[:limit]


def get_unlocked_buildings_summary(db: Session, user_id: UUID) -> dict:
    """Return building counts grouped by civilization_type and era.

    Used by GET /world/buildings/unlocked-summary endpoint.
    """
    from collections import defaultdict
    from app.world.models import BuildingTemplate, UserBuilding, BuildingStatus

    templates = db.query(BuildingTemplate).all()
    user_buildings = {
        ub.building_template_id: ub
        for ub in db.query(UserBuilding)
        .filter(UserBuilding.user_id == user_id)
        .all()
    }

    by_civ_type: dict[str, dict] = defaultdict(lambda: {"total": 0, "unlocked": 0, "active": 0})
    by_era: dict[str, dict] = defaultdict(lambda: {"total": 0, "unlocked": 0})

    for tpl in templates:
        civ = tpl.civilization_type or "UNKNOWN"
        era = tpl.era or "WILDERNESS"
        ub = user_buildings.get(tpl.id)

        by_civ_type[civ]["total"] += 1
        by_era[era]["total"] += 1

        if ub and ub.status != BuildingStatus.LOCKED:
            by_civ_type[civ]["unlocked"] += 1
            by_era[era]["unlocked"] += 1
            if ub.status in (BuildingStatus.STABLE, BuildingStatus.UPGRADING):
                by_civ_type[civ]["active"] += 1

    total = len(templates)
    unlocked = sum(1 for ub in user_buildings.values() if ub.status != BuildingStatus.LOCKED)

    # Also include locked skill recommendations
    recommendations = recommend_skills_for_locked_buildings(db, user_id, limit=5)

    return {
        "by_civilization_type": dict(by_civ_type),
        "by_era": dict(by_era),
        "total_buildings": total,
        "total_unlocked": unlocked,
        "locked_skill_recommendations": recommendations,
    }
