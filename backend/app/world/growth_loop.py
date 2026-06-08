"""
Growth Loop Service — calculates the full civilization impact chain.

The growth loop:
  Learning Path → Quest → Skill EXP → Skill Level → Building Level
  → Civilization Index → Civilization Level → Era Advance

This service is the single source of truth for "what happens when I complete this quest?"
"""

from uuid import UUID

from sqlalchemy.orm import Session

from app.world.models import BuildingTemplate, UserBuilding, World
from app.skills.models import Skill, UserSkill
from app.quests.models import Quest


# ── Civilization type → display name mapping ──────────────────────────
CIVILIZATION_TYPES = {
    "AI": {"zh": "AI文明", "en": "AI Civilization", "icon": "🤖"},
    "ENGINEERING": {"zh": "工程文明", "en": "Engineering Civilization", "icon": "⚙️"},
    "KNOWLEDGE": {"zh": "知识文明", "en": "Knowledge Civilization", "icon": "📚"},
    "BUSINESS": {"zh": "商业文明", "en": "Business Civilization", "icon": "💼"},
    "DESIGN": {"zh": "设计文明", "en": "Design Civilization", "icon": "🎨"},
    "SOCIAL": {"zh": "社会文明", "en": "Social Civilization", "icon": "🤝"},
    "SCIENCE": {"zh": "科学文明", "en": "Science Civilization", "icon": "🔬"},
    "LANGUAGE": {"zh": "语言文明", "en": "Language Civilization", "icon": "🗣️"},
    "HEALTH": {"zh": "健康文明", "en": "Health Civilization", "icon": "💪"},
    "FINANCE": {"zh": "金融文明", "en": "Finance Civilization", "icon": "💰"},
}


def get_civilization_type_label(civ_type: str, locale: str = "zh") -> str:
    """Get display name for a civilization type."""
    info = CIVILIZATION_TYPES.get(civ_type, CIVILIZATION_TYPES["AI"])
    return info.get(locale, info["zh"])


def calculate_quest_impact(
    db: Session,
    quest_id: UUID,
    user_id: UUID,
) -> dict:
    """Calculate the full civilization impact of completing a quest.

    Returns a dict with:
    - skill_rewards: estimated skill dimension gains
    - building_impact: which building is affected and how much progress
    - civilization_contribution: estimated civilization index gain
    - era_progress: progress toward next era
    """
    quest = db.query(Quest).filter(Quest.id == quest_id).first()
    if not quest:
        return {"error": "Quest not found"}

    skill = db.query(Skill).filter(Skill.id == quest.skill_id).first()
    if not skill:
        return {"error": "Skill not found"}

    # Estimate skill rewards based on difficulty and type
    reward = _estimate_skill_rewards(quest)

    # Find associated building
    building_impact = _calculate_building_impact(db, quest, user_id, reward)

    # Estimate civilization contribution
    civ_contribution = _estimate_civ_contribution(quest, building_impact)

    # Era progress
    era_progress = _calculate_era_progress(db, user_id, civ_contribution)

    return {
        "quest_id": str(quest.id),
        "quest_title": quest.title,
        "skill_name": skill.name,
        "skill_rewards": reward,
        "building_impact": building_impact,
        "civilization_contribution": civ_contribution,
        "era_progress": era_progress,
    }


def _estimate_skill_rewards(quest: Quest) -> dict:
    """Estimate skill dimension gains from quest difficulty and type."""
    base = {
        "LEVEL_1": 10,
        "LEVEL_2": 20,
        "LEVEL_3": 35,
        "LEVEL_4": 50,
    }
    multiplier = {
        "KNOWLEDGE": {"knowledge": 1.5, "reasoning": 1.0, "application": 0.5, "creation": 0.3},
        "APPLICATION": {"knowledge": 0.8, "reasoning": 1.2, "application": 1.5, "creation": 0.8},
        "PROJECT": {"knowledge": 0.5, "reasoning": 1.0, "application": 1.2, "creation": 1.5},
        "MASTERY": {"knowledge": 1.0, "reasoning": 1.2, "application": 1.3, "creation": 1.5},
    }

    difficulty_str = quest.difficulty.value if hasattr(quest.difficulty, 'value') else str(quest.difficulty)
    quest_type_str = quest.quest_type.value if hasattr(quest.quest_type, 'value') else str(quest.quest_type)

    base_value = base.get(difficulty_str, 15)
    mult = multiplier.get(quest_type_str, {"knowledge": 1.0, "reasoning": 1.0, "application": 1.0, "creation": 1.0})

    return {
        "knowledge": round(base_value * mult["knowledge"]),
        "reasoning": round(base_value * mult["reasoning"]),
        "application": round(base_value * mult["application"]),
        "creation": round(base_value * mult["creation"]),
        "building_exp": round(base_value * 1.2),  # building experience from quest
    }


def _calculate_building_impact(
    db: Session,
    quest: Quest,
    user_id: UUID,
    reward: dict,
) -> dict | None:
    """Find the building associated with this quest's skill and calculate impact."""
    tpl = (
        db.query(BuildingTemplate)
        .filter(BuildingTemplate.skill_id == quest.skill_id)
        .first()
    )
    if not tpl:
        return None

    user_building = (
        db.query(UserBuilding)
        .filter(
            UserBuilding.user_id == user_id,
            UserBuilding.building_template_id == tpl.id,
        )
        .first()
    )

    current_level = user_building.level if user_building else 1
    # Calculate progress: building_exp contributes to next level
    building_exp = reward["building_exp"]
    # Simple formula: each level requires level * 100 exp
    exp_for_next = current_level * 100
    current_exp = (user_building.level * 50) if user_building else 0  # rough estimate
    progress_pct = min(100, round((current_exp + building_exp) / max(1, exp_for_next) * 100))

    return {
        "building_id": str(tpl.id),
        "building_name": tpl.name,
        "building_name_en": tpl.name_en,
        "building_icon": tpl.icon,
        "civilization_type": tpl.civilization_type,
        "region": tpl.region,
        "current_level": current_level,
        "building_exp_gain": building_exp,
        "progress_to_next_level": progress_pct,
        "will_level_up": (current_exp + building_exp) >= exp_for_next,
    }


def _estimate_civ_contribution(quest: Quest, building_impact: dict | None) -> int:
    """Estimate civilization index points from completing this quest."""
    difficulty_str = quest.difficulty.value if hasattr(quest.difficulty, 'value') else str(quest.difficulty)
    base_contribution = {
        "LEVEL_1": 5,
        "LEVEL_2": 10,
        "LEVEL_3": 20,
        "LEVEL_4": 35,
    }
    contribution = base_contribution.get(difficulty_str, 10)

    # Bonus if this quest pushes a building to level up
    if building_impact and building_impact.get("will_level_up"):
        contribution += 15

    return contribution


def _calculate_era_progress(db: Session, user_id: UUID, civ_contribution: int) -> dict:
    """Calculate progress toward the next era."""
    world = db.query(World).filter(World.user_id == user_id).first()
    if not world:
        return {"current_era": "WILDERNESS", "progress_pct": 0, "contribution_after": civ_contribution}

    era_thresholds = {
        "WILDERNESS": 10,
        "AGRICULTURE": 30,
        "ACADEMY": 60,
        "INDUSTRY": 100,
        "INFORMATION": 150,
        "AI": 220,
        "INTELLIGENCE": 300,
        "DIGITAL": 400,
        "FUTURE": 500,
    }

    current_era = world.era or "WILDERNESS"
    era_score = world.era_score or 0
    next_threshold = era_thresholds.get(current_era, 10)
    progress_pct = min(100, round(era_score / max(1, next_threshold) * 100))

    return {
        "current_era": current_era,
        "era_score": era_score,
        "next_era_threshold": next_threshold,
        "progress_pct": progress_pct,
        "contribution_after": min(100, round((era_score + civ_contribution) / max(1, next_threshold) * 100)),
        "will_advance_era": (era_score + civ_contribution) >= next_threshold,
    }


def get_path_completion_rewards(
    db: Session,
    user_id: UUID,
    path_id: UUID,
) -> dict:
    """Calculate all civilization rewards from completing an entire learning path."""
    from app.learning_paths.models import LearningPath, LearningPathMilestone, PathCheckpoint

    path = (
        db.query(LearningPath)
        .filter(LearningPath.id == path_id, LearningPath.user_id == user_id)
        .first()
    )
    if not path:
        return {"error": "Path not found"}

    total_quests = 0
    total_civ_contribution = 0
    buildings_affected: dict[str, dict] = {}
    total_estimated_hours = 0

    for milestone in path.milestones:
        for checkpoint in milestone.checkpoints:
            total_estimated_hours += getattr(checkpoint, 'estimated_hours', 2)
            for link in checkpoint.generated_quests:
                if link.quest:
                    total_quests += 1
                    impact = calculate_quest_impact(db, link.quest.id, user_id)
                    total_civ_contribution += impact.get("civilization_contribution", 0)
                    bi = impact.get("building_impact")
                    if bi:
                        bid = bi["building_id"]
                        if bid not in buildings_affected:
                            buildings_affected[bid] = {**bi, "quests_contributing": 0}
                        buildings_affected[bid]["quests_contributing"] += 1

    # Civilization level projection
    from app.world.models import World
    from app.world.service import score_to_tier

    world = db.query(World).filter(World.user_id == user_id).first()
    current_tier_score = world.tier_score if world else 0
    projected_score = current_tier_score + total_civ_contribution
    current_tier_info = score_to_tier(current_tier_score)
    projected_tier_info = score_to_tier(projected_score)

    return {
        "path_id": str(path.id),
        "path_title": path.title,
        "total_quests": total_quests,
        "total_estimated_hours": total_estimated_hours,
        "total_civilization_contribution": total_civ_contribution,
        "buildings_affected": list(buildings_affected.values()),
        "tier_projection": {
            "current_tier": current_tier_info.get("tier"),
            "current_tier_name": current_tier_info.get("tier_name_zh"),
            "current_tier_name_en": current_tier_info.get("tier_name_en"),
            "projected_tier": projected_tier_info.get("tier"),
            "projected_tier_name": projected_tier_info.get("tier_name_zh"),
            "projected_tier_name_en": projected_tier_info.get("tier_name_en"),
            "score_increase": total_civ_contribution,
        },
        "civilization_type": path.path_metadata.get("civilization_type") if path.path_metadata else None,
    }


def get_quests_grouped_by_civilization(
    db: Session,
    user_id: UUID | None = None,
) -> dict:
    """Group all quests by civilization type for the quest center.

    Returns a dict with civilization types as keys, each containing:
    - label: display name
    - icon: civilization icon
    - count: number of quests
    - quests: list of quest items with building/civ info
    """
    from app.quests.models import Quest as QuestModel

    groups: dict[str, dict] = {}

    # Initialize all civilization types
    for civ_type, info in CIVILIZATION_TYPES.items():
        groups[civ_type] = {
            "civilization_type": civ_type,
            "label": info["zh"],
            "label_en": info["en"],
            "icon": info["icon"],
            "count": 0,
            "quests": [],
        }

    # Query all quests with their skill → building mapping
    quests = db.query(QuestModel).order_by(QuestModel.difficulty).all()

    for quest in quests:
        # Determine civilization type from skill → building
        civ_type = _get_civ_type_for_quest(db, quest)

        if civ_type not in groups:
            civ_type = "KNOWLEDGE"  # Default fallback

        # Build quest item
        building_info = _get_building_for_quest(db, quest, user_id)
        reward = _estimate_skill_rewards(quest)
        civ_contribution = _estimate_civ_contribution(quest, building_info)

        quest_item = {
            "id": str(quest.id),
            "title": quest.title,
            "title_en": quest.title_en,
            "description": quest.description,
            "description_en": quest.description_en,
            "skill_id": str(quest.skill_id),
            "skill_name": quest.skill.name if quest.skill else None,
            "difficulty": quest.difficulty.value if hasattr(quest.difficulty, 'value') else str(quest.difficulty),
            "quest_type": quest.quest_type.value if hasattr(quest.quest_type, 'value') else str(quest.quest_type),
            "expected_deliverable": quest.expected_deliverable.value if hasattr(quest.expected_deliverable, 'value') else str(quest.expected_deliverable),
            "associated_building": building_info,
            "reward_preview": {
                **reward,
                "civilization_contribution": civ_contribution,
            },
        }
        groups[civ_type]["quests"].append(quest_item)
        groups[civ_type]["count"] += 1

    # Return only groups that have quests, sorted by count desc
    result = {
        k: v for k, v in groups.items() if v["count"] > 0
    }
    return dict(sorted(result.items(), key=lambda x: x[1]["count"], reverse=True))


def _get_civ_type_for_quest(db: Session, quest) -> str:
    """Determine civilization type for a quest based on its skill's building."""
    tpl = (
        db.query(BuildingTemplate)
        .filter(BuildingTemplate.skill_id == quest.skill_id)
        .first()
    )
    if tpl and tpl.civilization_type:
        return tpl.civilization_type

    # Fallback: map skill domain to civilization type
    domain_map = {
        "AI": "AI",
        "PROGRAMMING": "ENGINEERING",
        "PRODUCT": "BUSINESS",
        "DESIGN": "DESIGN",
        "WRITING": "KNOWLEDGE",
        "RESEARCH": "SCIENCE",
        "BUSINESS": "BUSINESS",
        "MANAGEMENT": "SOCIAL",
        "LANGUAGE": "LANGUAGE",
        "FITNESS": "HEALTH",
        "CAREER": "BUSINESS",
    }
    if quest.skill and quest.skill.domain:
        return domain_map.get(quest.skill.domain.upper(), "KNOWLEDGE")
    return "KNOWLEDGE"


def _get_building_for_quest(db: Session, quest, user_id: UUID | None = None) -> dict | None:
    """Get building info for a quest's skill."""
    tpl = (
        db.query(BuildingTemplate)
        .filter(BuildingTemplate.skill_id == quest.skill_id)
        .first()
    )
    if not tpl:
        return None

    current_level = 1
    if user_id:
        ub = (
            db.query(UserBuilding)
            .filter(
                UserBuilding.user_id == user_id,
                UserBuilding.building_template_id == tpl.id,
            )
            .first()
        )
        if ub:
            current_level = ub.level

    return {
        "id": str(tpl.id),
        "name": tpl.name,
        "name_en": tpl.name_en,
        "icon": tpl.icon,
        "civilization_type": tpl.civilization_type,
        "region": tpl.region,
        "current_level": current_level,
        "next_level_at": current_level * 100,
    }
