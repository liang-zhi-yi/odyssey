"""
World service — business logic for world state, buildings, regions,
compound buildings, milestones, and tech tree.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.world.models import (
    BuildingTemplate,
    UserBuilding,
    World,
    CompoundBuildingTemplate,
    UserCompoundBuilding,
    WorldEvent,
    MilestoneDefinition,
    UserMilestone,
)
from app.skills.models import UserSkill, Skill
from app.core.enums import BuildingStatus, TIER_RANGES

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
    return thresholds[current]


def score_to_compound_level(skill_scores: list[int]) -> int:
    """Derive compound building level from the minimum of source skill levels.

    A chain is only as strong as its weakest link.
    """
    if not skill_scores:
        return 1
    return score_to_level(min(skill_scores))


def score_to_tier(tier_score: int) -> dict:
    """Look up tier info from the total tier score.

    Returns: {"tier": str, "tier_name_zh": str, "tier_name_en": str,
               "next_tier_at": int|0}
    """
    tier_value = "SETTLER"
    tier_name_zh = "定居者"
    tier_name_en = "Settler"
    next_tier_at: int = 0

    for t, min_s, zh, en in TIER_RANGES:
        if tier_score >= min_s:
            tier_value = t.value
            tier_name_zh = zh
            tier_name_en = en
        else:
            next_tier_at = min_s
            break

    return {
        "tier": tier_value,
        "tier_name_zh": tier_name_zh,
        "tier_name_en": tier_name_en,
        "next_tier_at": next_tier_at,
    }


LEVEL_LABELS_ZH = {1: "基地", 2: "工坊", 3: "学院", 4: "研究院", 5: "堡垒"}
LEVEL_LABELS_EN = {1: "Foundation", 2: "Workshop", 3: "Academy", 4: "Institute", 5: "Citadel"}


# ── World lifecycle ────────────────────────────────────────────────────

def ensure_world_exists(db: Session, user_id: UUID) -> World:
    """Create a World + UserBuilding + UserCompoundBuilding rows if they don't exist. Idempotent."""
    world = db.query(World).filter(World.user_id == user_id).first()
    if world is None:
        world = World(user_id=user_id)
        db.add(world)
        db.flush()

    now = datetime.now(timezone.utc)

    # Create UserBuilding rows for any missing templates
    templates = db.query(BuildingTemplate).all()
    existing_buildings = {
        ub.building_template_id: ub
        for ub in db.query(UserBuilding)
        .filter(UserBuilding.user_id == user_id)
        .all()
    }

    for tpl in templates:
        if tpl.id not in existing_buildings:
            user_building = UserBuilding(
                user_id=user_id,
                building_template_id=tpl.id,
                level=1,
                status=BuildingStatus.LOCKED,
            )
            db.add(user_building)

    # Create UserCompoundBuilding rows for any missing compound templates
    compound_templates = db.query(CompoundBuildingTemplate).all()
    existing_compound = {
        cb.compound_template_id: cb
        for cb in db.query(UserCompoundBuilding)
        .filter(UserCompoundBuilding.user_id == user_id)
        .all()
    }

    for ctpl in compound_templates:
        if ctpl.id not in existing_compound:
            compound_building = UserCompoundBuilding(
                user_id=user_id,
                compound_template_id=ctpl.id,
                level=1,
                status=BuildingStatus.LOCKED,
            )
            db.add(compound_building)

    db.commit()
    return world


# ── World state aggregation ────────────────────────────────────────────

def get_world_state(db: Session, user_id: UUID) -> dict:
    """Aggregate the full world state for a user.

    Returns a dict compatible with WorldResponse schema,
    including compound buildings, tier info, and recent events.
    """
    world = ensure_world_exists(db, user_id)

    # Query all user buildings with joined templates
    user_buildings = (
        db.query(UserBuilding)
        .filter(UserBuilding.user_id == user_id)
        .all()
    )

    # Query compound buildings
    compound_buildings = (
        db.query(UserCompoundBuilding)
        .filter(UserCompoundBuilding.user_id == user_id)
        .all()
    )

    # ── Regions (from regular buildings) ───────────────────────────────
    regions_map: dict[str, dict] = {}
    for ub in user_buildings:
        tpl = ub.building_template
        if tpl is None:
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
        if ub.level >= 3:
            regions_map[region_key]["unlocked"] = True

    # Add "综合区" (Synthesis Region) for compound buildings
    if compound_buildings:
        syn_key = "综合区"
        if syn_key not in regions_map:
            regions_map[syn_key] = {
                "key": syn_key,
                "name": syn_key,
                "buildings": 0,
                "highest_level": 0,
                "unlocked": False,
            }
        regions_map[syn_key]["buildings"] += len(compound_buildings)
        active_cb = [cb for cb in compound_buildings if cb.status != BuildingStatus.LOCKED]
        if active_cb:
            regions_map[syn_key]["highest_level"] = max(cb.level for cb in active_cb)
            regions_map[syn_key]["unlocked"] = True

    regions = list(regions_map.values())

    # ── Stats ──────────────────────────────────────────────────────────
    active_buildings = [ub for ub in user_buildings if ub.status != BuildingStatus.LOCKED]
    active_compounds = [cb for cb in compound_buildings if cb.status != BuildingStatus.LOCKED]

    total = len(user_buildings)
    active_count = len(active_buildings)
    compound_total = len(compound_buildings)
    compound_active_count = len(active_compounds)

    avg_level = (
        sum(ub.level for ub in active_buildings) / active_count
        if active_count > 0
        else 0.0
    )
    highest_level = max(
        (ub.level for ub in active_buildings), default=0
    )
    highest_building = None
    if active_count > 0:
        highest_ub = max(active_buildings, key=lambda ub: ub.level)
        if highest_ub.building_template:
            highest_building = highest_ub.building_template.name

    # Milestone counts
    milestones_unlocked = (
        db.query(func.count(UserMilestone.id))
        .filter(UserMilestone.user_id == user_id)
        .scalar() or 0
    )
    total_milestones = (
        db.query(func.count(MilestoneDefinition.id)).scalar() or 0
    )

    # Tier info
    tier_info = score_to_tier(world.tier_score)

    stats = {
        "total_buildings": total,
        "active_buildings": active_count,
        "average_level": round(avg_level, 1),
        "highest_level": highest_level,
        "highest_level_building_name": highest_building,
        "civilization_level": world.civilization_level,
        "compound_buildings": compound_total,
        "active_compound_buildings": compound_active_count,
        "milestones_unlocked": milestones_unlocked,
        "total_milestones": total_milestones,
    }

    # ── Serialize regular buildings ────────────────────────────────────
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
            "building_type": "regular",
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

    # ── Serialize compound buildings ───────────────────────────────────
    compound_data = []
    for cb in compound_buildings:
        ctpl = cb.compound_template
        if ctpl is None:
            ctpl = db.query(CompoundBuildingTemplate).filter(
                CompoundBuildingTemplate.id == cb.compound_template_id
            ).first()
        compound_data.append({
            "id": cb.id,
            "building_template_id": cb.compound_template_id,
            "level": cb.level,
            "status": cb.status.value if hasattr(cb.status, "value") else cb.status,
            "constructed_at": cb.constructed_at,
            "upgraded_at": cb.upgraded_at,
            "building_type": "compound",
            "template": {
                "id": ctpl.id,
                "name": ctpl.name,
                "name_en": ctpl.name_en,
                "description": ctpl.description,
                "description_en": ctpl.description_en,
                "icon": ctpl.icon,
                "region": ctpl.region,
                "region_en": ctpl.region_en,
                "max_level": ctpl.max_level,
                "level_names": ctpl.level_names,
                "position_x": ctpl.position_x,
                "position_y": ctpl.position_y,
                "required_skills": ctpl.required_skills,
            } if ctpl else None,
        })

    # ── Recent events ──────────────────────────────────────────────────
    recent_events = (
        db.query(WorldEvent)
        .filter(WorldEvent.user_id == user_id)
        .order_by(WorldEvent.created_at.desc())
        .limit(10)
        .all()
    )
    events_data = [
        {
            "id": e.id,
            "event_type": e.event_type,
            "title": e.title,
            "title_en": e.title_en,
            "description": e.description,
            "description_en": e.description_en,
            "building_ref_id": e.building_ref_id,
            "created_at": e.created_at,
        }
        for e in recent_events
    ]

    return {
        "id": world.id,
        "user_id": world.user_id,
        "name": world.name,
        "civilization_level": world.civilization_level,
        "tier": tier_info["tier"],
        "tier_name": tier_info["tier_name_zh"],
        "tier_score": world.tier_score,
        "next_tier_at": tier_info["next_tier_at"],
        "created_at": world.created_at,
        "updated_at": world.updated_at,
        "regions": regions,
        "buildings": buildings_data,
        "compound_buildings": compound_data,
        "stats": stats,
        "recent_events": events_data,
    }


# ── Building detail ────────────────────────────────────────────────────

def get_building_detail(
    db: Session, user_id: UUID, building_id: UUID
) -> dict | None:
    """Get detailed info for a single regular building."""
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
        "building_type": "regular",
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


def get_compound_building_detail(
    db: Session, user_id: UUID, building_id: UUID
) -> dict | None:
    """Get detailed info for a single compound building."""
    user_building = (
        db.query(UserCompoundBuilding)
        .filter(
            UserCompoundBuilding.id == building_id,
            UserCompoundBuilding.user_id == user_id,
        )
        .first()
    )
    if user_building is None:
        return None

    ctpl = user_building.compound_template
    if ctpl is None:
        ctpl = db.query(CompoundBuildingTemplate).filter(
            CompoundBuildingTemplate.id == user_building.compound_template_id
        ).first()

    # Gather source skill scores for all required skills
    source_skill_scores = []
    if ctpl and ctpl.required_skills:
        for req in ctpl.required_skills:
            skill_name = req.get("skill_name", "")
            skill = db.query(Skill).filter(Skill.name == skill_name).first()
            if skill:
                us = (
                    db.query(UserSkill)
                    .filter(
                        UserSkill.user_id == user_id,
                        UserSkill.skill_id == skill.id,
                    )
                    .first()
                )
                source_skill_scores.append({
                    "skill_name": skill_name,
                    "min_level": req.get("min_level", 1),
                    "knowledge": us.knowledge_score if us else 0,
                    "reasoning": us.reasoning_score if us else 0,
                    "application": us.application_score if us else 0,
                    "creation": us.creation_score if us else 0,
                    "overall": us.overall_score if us else 0,
                    "rank": us.rank.value if us and hasattr(us.rank, "value") else "NOVICE",
                })

    level = user_building.level
    level_label = LEVEL_LABELS_ZH.get(level, str(level))

    return {
        "id": user_building.id,
        "building_template_id": user_building.compound_template_id,
        "level": level,
        "status": user_building.status.value if hasattr(user_building.status, "value") else str(user_building.status),
        "constructed_at": user_building.constructed_at,
        "upgraded_at": user_building.upgraded_at,
        "building_type": "compound",
        "template": {
            "id": ctpl.id,
            "name": ctpl.name,
            "name_en": ctpl.name_en,
            "description": ctpl.description,
            "description_en": ctpl.description_en,
            "icon": ctpl.icon,
            "region": ctpl.region,
            "region_en": ctpl.region_en,
            "max_level": ctpl.max_level,
            "level_names": ctpl.level_names,
            "position_x": ctpl.position_x,
            "position_y": ctpl.position_y,
            "required_skills": ctpl.required_skills,
        } if ctpl else None,
        "source_skill_scores": source_skill_scores,
        "next_level_at": 101,  # Compound buildings don't have a single skill score
        "level_label": level_label,
    }


def get_tech_tree(db: Session, user_id: UUID) -> dict:
    """Return the full tech tree — all templates with user progress."""
    world = ensure_world_exists(db, user_id)

    # Regular building templates with user building state
    regular_nodes = []
    templates = db.query(BuildingTemplate).all()
    for tpl in templates:
        ub = (
            db.query(UserBuilding)
            .filter(
                UserBuilding.user_id == user_id,
                UserBuilding.building_template_id == tpl.id,
            )
            .first()
        )
        regular_nodes.append({
            "id": tpl.id,
            "name": tpl.name,
            "name_en": tpl.name_en,
            "icon": tpl.icon,
            "region": tpl.region,
            "region_en": tpl.region_en,
            "level": ub.level if ub else 1,
            "status": ub.status.value if ub and hasattr(ub.status, "value") else "LOCKED",
            "position_x": tpl.position_x,
            "position_y": tpl.position_y,
            "node_type": "regular",
        })

    # Compound building templates with user progress
    compound_nodes = []
    compound_templates = db.query(CompoundBuildingTemplate).all()
    for ctpl in compound_templates:
        cb = (
            db.query(UserCompoundBuilding)
            .filter(
                UserCompoundBuilding.user_id == user_id,
                UserCompoundBuilding.compound_template_id == ctpl.id,
            )
            .first()
        )

        # Calculate prerequisite progress
        prereq_progress = []
        all_met = True
        for req in ctpl.required_skills:
            skill_name = req.get("skill_name", "")
            min_lvl = req.get("min_level", 1)
            skill = db.query(Skill).filter(Skill.name == skill_name).first()
            met = False
            current_level = 1
            if skill:
                us = (
                    db.query(UserSkill)
                    .filter(
                        UserSkill.user_id == user_id,
                        UserSkill.skill_id == skill.id,
                    )
                    .first()
                )
                if us:
                    current_level = score_to_level(us.overall_score)
                    met = current_level >= min_lvl
            if not met:
                all_met = False
            prereq_progress.append({
                "skill_name": skill_name,
                "required_level": min_lvl,
                "current_level": current_level,
                "met": met,
            })

        compound_nodes.append({
            "id": ctpl.id,
            "name": ctpl.name,
            "name_en": ctpl.name_en,
            "icon": ctpl.icon,
            "level": cb.level if cb else 1,
            "status": cb.status.value if cb and hasattr(cb.status, "value") else "LOCKED",
            "position_x": ctpl.position_x,
            "position_y": ctpl.position_y,
            "node_type": "compound",
            "required_skills": ctpl.required_skills,
            "prereq_progress": prereq_progress,
            "all_prereqs_met": all_met,
        })

    return {
        "regular_nodes": regular_nodes,
        "compound_nodes": compound_nodes,
    }


def get_civilization_direction(db: Session, user_id: UUID) -> dict:
    """Analyze active learning paths → target skills → buildings → civilization direction.

    Returns the active paths and which buildings they're driving growth toward.
    """
    from app.learning_paths.models import LearningPath, LearningPathMilestone

    # 1. Get active learning paths
    active_paths = (
        db.query(LearningPath)
        .filter(
            LearningPath.user_id == user_id,
            LearningPath.status == "ACTIVE",
        )
        .all()
    )

    # 2. Build skill_id → building info mapping
    building_templates = db.query(BuildingTemplate).all()
    user_buildings = {
        ub.building_template_id: ub
        for ub in db.query(UserBuilding)
        .filter(UserBuilding.user_id == user_id)
        .all()
    }
    skill_to_building: dict[UUID, dict] = {}
    for tpl in building_templates:
        ub = user_buildings.get(tpl.id)
        skill_to_building[tpl.skill_id] = {
            "building_id": str(ub.id) if ub else str(tpl.id),
            "building_name": tpl.name,
            "building_name_en": tpl.name_en,
            "building_icon": tpl.icon,
            "current_level": ub.level if ub else 1,
            "region": tpl.region,
            "region_en": tpl.region_en,
            "max_level": tpl.max_level,
        }

    # 3. For each active path, gather targeted buildings from milestones
    path_directions = []
    all_targeted_skill_ids: set[UUID] = set()

    for path in active_paths:
        milestones = (
            db.query(LearningPathMilestone)
            .filter(LearningPathMilestone.learning_path_id == path.id)
            .all()
        )

        # Collect unique skill_ids from milestones
        targeted_skill_ids: list[UUID] = []
        seen_skills: set[UUID] = set()
        for ms in milestones:
            if ms.skill_id and ms.skill_id not in seen_skills:
                targeted_skill_ids.append(ms.skill_id)
                seen_skills.add(ms.skill_id)

        # Map to building info
        targeted_buildings = []
        for sid in targeted_skill_ids:
            bld = skill_to_building.get(sid)
            if bld:
                # Calculate projected level: each milestone completion adds ~20 score points
                incomplete_ms = [
                    m for m in milestones
                    if m.skill_id == sid and not m.is_completed
                ]
                projected_increase = len(incomplete_ms) * 20  # rough estimate per milestone
                projected_level = score_to_level(
                    bld["current_level"] * 20 + projected_increase
                )
                targeted_buildings.append({
                    **bld,
                    "remaining_milestones": len(incomplete_ms),
                    "projected_level": projected_level,
                })
                all_targeted_skill_ids.add(sid)

        path_directions.append({
            "path_id": str(path.id),
            "path_title": path.title,
            "progress_pct": path.progress_pct or 0,
            "targeted_buildings": targeted_buildings,
        })

    # 4. Build summary text
    all_regions: set[str] = set()
    all_building_names: list[str] = []
    for pd in path_directions:
        for tb in pd["targeted_buildings"]:
            all_regions.add(tb["region"])
            all_building_names.append(tb["building_name"])

    summary = ""
    suggested_focus = ""
    if path_directions:
        region_list = list(all_regions)[:2]
        building_list = all_building_names[:3]
        summary = (
            f"Your civilization is evolving toward "
            f"{' and '.join(region_list)} mastery. "
            f"Active paths are driving {len(all_building_names)} buildings."
        )
        if path_directions:
            top_path = path_directions[0]
            if top_path["targeted_buildings"]:
                first_bld = top_path["targeted_buildings"][0]
                suggested_focus = (
                    f"Prioritize '{top_path['path_title']}' "
                    f"to reach {first_bld['building_name']} Lv.{first_bld['projected_level']}"
                )
    else:
        summary = "No active learning paths. Create a path to guide your civilization's growth."
        suggested_focus = "Start by creating a learning path to define your civilization's direction."

    return {
        "active_paths": path_directions,
        "summary": summary,
        "suggested_focus": suggested_focus,
    }


def get_milestones(db: Session, user_id: UUID) -> list[dict]:
    """Return all milestone definitions with user unlock status."""
    ensure_world_exists(db, user_id)

    definitions = (
        db.query(MilestoneDefinition)
        .order_by(MilestoneDefinition.order_sequence)
        .all()
    )

    user_milestones = {
        um.milestone_id: um
        for um in db.query(UserMilestone)
        .filter(UserMilestone.user_id == user_id)
        .all()
    }

    return [
        {
            "id": mdef.id,
            "name": mdef.name,
            "name_en": mdef.name_en,
            "description": mdef.description,
            "description_en": mdef.description_en,
            "icon": mdef.icon,
            "category": mdef.category.value if hasattr(mdef.category, "value") else str(mdef.category),
            "criteria": mdef.criteria,
            "order_sequence": mdef.order_sequence,
            "unlocked": mdef.id in user_milestones,
            "unlocked_at": user_milestones[mdef.id].unlocked_at if mdef.id in user_milestones else None,
        }
        for mdef in definitions
    ]
