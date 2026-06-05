"""
Building upgrade engine — syncs UserBuilding levels to match UserSkill scores,
plus compound buildings, milestones, tier calculation, and world events.

Called after every assessment (like badges/credentials).
Building level is purely derived from UserSkill.overall_score — no separate logic.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session

from app.world.models import (
    BuildingTemplate,
    UserBuilding,
    World,
    CompoundBuildingTemplate,
    UserCompoundBuilding,
    WorldEvent,
)
from app.skills.models import UserSkill, Skill
from app.core.enums import BuildingStatus, TIER_RANGES
from app.world import events as event_service
from app.world.milestone_engine import check_and_award_milestones

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
    """Sync all building levels to UserSkill scores after assessment.

    Now also syncs compound buildings, checks milestones,
    generates world events, and recalculates civilization tier.

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

    # Ensure UserCompoundBuilding rows exist
    compound_templates = db.query(CompoundBuildingTemplate).all()
    existing_compound = {
        cb.compound_template_id: cb
        for cb in db.query(UserCompoundBuilding)
        .filter(UserCompoundBuilding.user_id == user_id)
        .all()
    }
    for ctpl in compound_templates:
        if ctpl.id not in existing_compound:
            cb = UserCompoundBuilding(
                user_id=user_id,
                compound_template_id=ctpl.id,
                level=1,
                status=BuildingStatus.LOCKED,
            )
            db.add(cb)
            existing_compound[ctpl.id] = cb

    db.flush()

    upgrades = []

    # ── A. Sync regular buildings (existing logic) ─────────────────────
    previous_regions_unlocked = _count_unlocked_regions(db, user_id)

    for tpl in templates:
        ub = existing.get(tpl.id)
        if ub is None:
            continue

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
                "type": "regular",
            })
            logger.info(
                "Building upgraded: %s Lv.%d → Lv.%d (user=%s)",
                tpl.name, old_level, target_level, user_id,
            )

            # Generate world event for upgrade
            try:
                level_names = tpl.level_names or {}
                level_name = level_names.get(str(target_level), {}).get("zh", f"Lv.{target_level}")
                event_service.event_building_upgrade(
                    db, user_id, tpl.name, tpl.name_en,
                    old_level, target_level, level_name, ub.id,
                )
            except Exception as exc:
                logger.warning("Failed to create upgrade event: %s", exc)

        elif target_level == old_level:
            if ub.status in (BuildingStatus.UPGRADING, BuildingStatus.CONSTRUCTING):
                ub.status = BuildingStatus.STABLE
            if ub.constructed_at is None and overall > 0:
                ub.constructed_at = now
                ub.status = BuildingStatus.CONSTRUCTING

    # Check for region unlocks
    try:
        current_regions = _count_unlocked_regions(db, user_id)
        if current_regions > previous_regions_unlocked:
            # Find which region just unlocked
            regions_before = _get_unlocked_region_names(db, user_id, previous_regions_unlocked)
            for ub in existing.values():
                if ub.status != BuildingStatus.LOCKED and ub.level >= 3 and ub.building_template:
                    region = ub.building_template.region
                    if region not in regions_before:
                        event_service.event_region_unlock(
                            db, user_id, region, ub.building_template.region_en
                        )
    except Exception as exc:
        logger.warning("Region unlock event failed (non-fatal): %s", exc)

    # ── B. Sync compound buildings (new — Phase 4) ─────────────────────
    try:
        compound_upgrades = _sync_compound_buildings(db, user_id, now)
        upgrades.extend(compound_upgrades)
    except Exception as exc:
        logger.warning("Compound building sync failed (non-fatal): %s", exc)

    # ── C. Check milestones (new — Phase 4) ────────────────────────────
    try:
        new_milestones = check_and_award_milestones(db, user_id)
        for milestone_name in new_milestones:
            logger.info("Milestone awarded: %s (user=%s)", milestone_name, user_id)
            try:
                from app.world.models import MilestoneDefinition
                mdef = db.query(MilestoneDefinition).filter(
                    MilestoneDefinition.name == milestone_name
                ).first()
                if mdef:
                    event_service.event_milestone_reached(
                        db, user_id,
                        mdef.name, mdef.name_en,
                        mdef.description, mdef.description_en,
                    )
            except Exception as exc:
                logger.warning("Milestone event creation failed: %s", exc)
    except Exception as exc:
        logger.warning("Milestone check failed (non-fatal): %s", exc)

    # ── D. Recalculate civilization tier (new formula — Phase 4) ───────
    try:
        _recalculate_civilization_tier(db, world, user_id)
    except Exception as exc:
        logger.warning("Tier recalculation failed (non-fatal): %s", exc)

    db.commit()
    return upgrades


# ── Compound building sync ─────────────────────────────────────────────

def _sync_compound_buildings(
    db: Session, user_id: UUID, now: datetime
) -> list[dict]:
    """Check compound building prerequisites, unlock/upgrade as needed."""
    compound_upgrades = []

    compound_templates = db.query(CompoundBuildingTemplate).all()
    existing_compound = {
        cb.compound_template_id: cb
        for cb in db.query(UserCompoundBuilding)
        .filter(UserCompoundBuilding.user_id == user_id)
        .all()
    }

    for ctpl in compound_templates:
        cb = existing_compound.get(ctpl.id)
        if cb is None:
            continue

        # Check if ALL required skills meet minimum levels
        required_skills = ctpl.required_skills or []
        source_scores = []
        all_prereqs_met = True

        for req in required_skills:
            skill_name = req.get("skill_name", "")
            min_level = req.get("min_level", 1)
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
                current_level = score_to_level(us.overall_score if us else 0)
                source_scores.append(us.overall_score if us else 0)
                if current_level < min_level:
                    all_prereqs_met = False
            else:
                all_prereqs_met = False

        old_level = cb.level
        old_status = cb.status

        if not all_prereqs_met:
            # Prerequisites not met — keep LOCKED
            if cb.status != BuildingStatus.LOCKED:
                cb.status = BuildingStatus.LOCKED
            continue

        # Prerequisites met! Determine new level
        target_level = score_to_level(min(source_scores)) if source_scores else 1

        # First time unlocking?
        was_locked = old_status == BuildingStatus.LOCKED

        if was_locked and target_level >= 1:
            cb.level = target_level
            cb.status = BuildingStatus.CONSTRUCTING
            cb.constructed_at = now
            cb.upgraded_at = now

            compound_upgrades.append({
                "building_name": ctpl.name,
                "building_name_en": ctpl.name_en,
                "from_level": 0,
                "to_level": target_level,
                "type": "compound",
            })

            # Generate compound unlock event
            try:
                event_service.event_compound_unlock(
                    db, user_id, ctpl.name, ctpl.name_en, cb.id,
                )
            except Exception as exc:
                logger.warning("Compound unlock event failed: %s", exc)

        elif target_level > old_level:
            cb.level = target_level
            cb.status = BuildingStatus.UPGRADING
            cb.upgraded_at = now

            compound_upgrades.append({
                "building_name": ctpl.name,
                "building_name_en": ctpl.name_en,
                "from_level": old_level,
                "to_level": target_level,
                "type": "compound",
            })

            # Generate compound upgrade event
            try:
                level_names = ctpl.level_names or {}
                level_name = level_names.get(str(target_level), {}).get("zh", f"Lv.{target_level}")
                event_service.event_compound_upgrade(
                    db, user_id, ctpl.name, ctpl.name_en,
                    old_level, target_level, level_name, cb.id,
                )
            except Exception as exc:
                logger.warning("Compound upgrade event failed: %s", exc)

        elif target_level == old_level and not was_locked:
            if cb.status in (BuildingStatus.UPGRADING, BuildingStatus.CONSTRUCTING):
                cb.status = BuildingStatus.STABLE

    return compound_upgrades


# ── Region helpers ─────────────────────────────────────────────────────

def _count_unlocked_regions(db: Session, user_id: UUID) -> int:
    """Count how many regions have at least one building >= Lv.3."""
    user_buildings = (
        db.query(UserBuilding)
        .filter(UserBuilding.user_id == user_id)
        .all()
    )
    regions = set()
    for ub in user_buildings:
        if ub.level >= 3 and ub.building_template:
            regions.add(ub.building_template.region)
    return len(regions)


def _get_unlocked_region_names(db: Session, user_id: UUID, count: int) -> set[str]:
    """Get region names for the first N unlocked regions."""
    user_buildings = (
        db.query(UserBuilding)
        .filter(UserBuilding.user_id == user_id)
        .all()
    )
    regions = set()
    for ub in user_buildings:
        if ub.level >= 3 and ub.building_template:
            regions.add(ub.building_template.region)
    # Return the first `count` regions (arbitrary order is fine since we count)
    return regions


# ── Civilization tier recalculation (Phase 4) ──────────────────────────

def _recalculate_civilization_tier(
    db: Session, world: World, user_id: UUID
) -> None:
    """Update tier and tier_score based on building levels + compound bonuses + milestones.

    Formula:
      tier_score = regular_building_levels + compound_building_levels × 2 + milestones_unlocked
    """
    # Regular building levels
    active_buildings = (
        db.query(UserBuilding)
        .filter(
            UserBuilding.user_id == user_id,
            UserBuilding.status != BuildingStatus.LOCKED,
        )
        .all()
    )
    regular_total = sum(ub.level for ub in active_buildings)

    # Compound building levels (×2 bonus for synergy)
    active_compounds = (
        db.query(UserCompoundBuilding)
        .filter(
            UserCompoundBuilding.user_id == user_id,
            UserCompoundBuilding.status != BuildingStatus.LOCKED,
        )
        .all()
    )
    compound_total = sum(cb.level * 2 for cb in active_compounds)

    # Milestone bonus
    from app.world.models import UserMilestone
    milestone_count = (
        db.query(UserMilestone)
        .filter(UserMilestone.user_id == user_id)
        .count()
    )

    total_score = regular_total + compound_total + milestone_count

    # Look up tier from TIER_RANGES
    old_tier = world.tier
    new_tier = "SETTLER"
    new_tier_zh = "定居者"
    new_tier_en = "Settler"

    for t, min_s, zh, en in TIER_RANGES:
        if total_score >= min_s:
            new_tier = t.value
            new_tier_zh = zh
            new_tier_en = en

    world.tier = new_tier
    world.tier_score = total_score

    # Also update legacy civilization_level for backward compatibility
    world.civilization_level = max(1, 1 + total_score // 3)

    # Generate tier advance event
    if new_tier != old_tier:
        old_tier_zh = "定居者"
        old_tier_en = "Settler"
        for t, min_s, zh, en in TIER_RANGES:
            if t.value == old_tier:
                old_tier_zh = zh
                old_tier_en = en
                break

        try:
            event_service.event_tier_advance(
                db, user_id, old_tier_zh, old_tier_en, new_tier_zh, new_tier_en,
            )
        except Exception as exc:
            logger.warning("Tier advance event failed: %s", exc)

        # Create notification for tier advance
        try:
            from app.notifications.service import create_notification
            create_notification(
                db,
                user_id=user_id,
                type="TIER_ADVANCE",
                title=f"文明晋级：{old_tier_zh} → {new_tier_zh}！",
                title_en=f"Civilization Advance: {old_tier_en} → {new_tier_en}!",
                body=f"你的文明从{old_tier_zh}晋级为{new_tier_zh}，总分：{total_score}",
                body_en=f"Your civilization has advanced from {old_tier_en} to {new_tier_en}. Total score: {total_score}",
                link="/world",
            )
        except Exception as exc:
            logger.warning("Tier advance notification failed: %s", exc)

        logger.info(
            "Civilization tier advanced: %s → %s (score=%d, user=%s)",
            old_tier, new_tier, total_score, user_id,
        )
