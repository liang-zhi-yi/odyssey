"""
World events service.

Creates and retrieves significant world events for the event timeline.
Events are stored in the world_events table and displayed on the world page.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.world.models import WorldEvent
from app.core.enums import WorldEventType

logger = logging.getLogger(__name__)


def create_world_event(
    db: Session,
    user_id: UUID,
    event_type: WorldEventType | str,
    title: str,
    title_en: str | None = None,
    description: str | None = None,
    description_en: str | None = None,
    building_ref_id: UUID | None = None,
) -> WorldEvent:
    """Create and persist a world event. Flushes immediately so it's visible to callers."""
    event = WorldEvent(
        user_id=user_id,
        event_type=event_type.value if isinstance(event_type, WorldEventType) else event_type,
        title=title,
        title_en=title_en,
        description=description,
        description_en=description_en,
        building_ref_id=building_ref_id,
        created_at=datetime.now(timezone.utc),
    )
    db.add(event)
    db.flush()
    logger.debug("World event: %s — %s", event_type, title)
    return event


def get_recent_events(
    db: Session,
    user_id: UUID,
    limit: int = 20,
    offset: int = 0,
) -> list[dict]:
    """Return recent world events for a user, newest first."""
    events = (
        db.query(WorldEvent)
        .filter(WorldEvent.user_id == user_id)
        .order_by(desc(WorldEvent.created_at))
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [
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
        for e in events
    ]


# ── Event factory helpers (used by upgrade_engine) ──────────────────────

def event_building_upgrade(
    db: Session,
    user_id: UUID,
    building_name: str,
    building_name_en: str | None,
    from_level: int,
    to_level: int,
    level_name: str,
    building_ref_id: UUID,
) -> WorldEvent:
    """Log a regular building upgrade event."""
    title = f"{building_name} 升级至 Lv.{to_level} — {level_name}！"
    title_en = f"{building_name_en or building_name} upgraded to Lv.{to_level} — {level_name}!"
    desc = f"从 Lv.{from_level} 升级至 Lv.{to_level} ({level_name})"
    desc_en = f"Upgraded from Lv.{from_level} to Lv.{to_level} ({level_name})"
    return create_world_event(
        db, user_id, WorldEventType.BUILDING_UPGRADE,
        title, title_en, desc, desc_en, building_ref_id,
    )


def event_compound_unlock(
    db: Session,
    user_id: UUID,
    building_name: str,
    building_name_en: str | None,
    building_ref_id: UUID,
) -> WorldEvent:
    """Log a compound building unlock event."""
    title = f"复合建筑解锁：{building_name}！"
    title_en = f"Compound Building Unlocked: {building_name_en or building_name}!"
    desc = f"前置技能已满足要求，{building_name}已解锁"
    desc_en = f"Prerequisite skills met — {building_name_en or building_name} is now unlocked"
    return create_world_event(
        db, user_id, WorldEventType.COMPOUND_UNLOCK,
        title, title_en, desc, desc_en, building_ref_id,
    )


def event_compound_upgrade(
    db: Session,
    user_id: UUID,
    building_name: str,
    building_name_en: str | None,
    from_level: int,
    to_level: int,
    level_name: str,
    building_ref_id: UUID,
) -> WorldEvent:
    """Log a compound building upgrade event."""
    title = f"{building_name} 升级至 Lv.{to_level} — {level_name}！"
    title_en = f"{building_name_en or building_name} upgraded to Lv.{to_level} — {level_name}!"
    desc = f"复合建筑从 Lv.{from_level} 升级至 Lv.{to_level} ({level_name})"
    desc_en = f"Compound building upgraded from Lv.{from_level} to Lv.{to_level} ({level_name})"
    return create_world_event(
        db, user_id, WorldEventType.COMPOUND_UPGRADE,
        title, title_en, desc, desc_en, building_ref_id,
    )


def event_region_unlock(
    db: Session,
    user_id: UUID,
    region_name: str,
    region_name_en: str | None,
) -> WorldEvent:
    """Log a region unlock event."""
    title = f"新区块解锁：{region_name}！"
    title_en = f"New Region Unlocked: {region_name_en or region_name}!"
    desc = f"建筑达到Lv.3，{region_name}正式开放"
    desc_en = f"Building reached Lv.3 — {region_name_en or region_name} is now open"
    return create_world_event(
        db, user_id, WorldEventType.REGION_UNLOCK,
        title, title_en, desc, desc_en,
    )


def event_tier_advance(
    db: Session,
    user_id: UUID,
    from_tier_zh: str,
    from_tier_en: str,
    to_tier_zh: str,
    to_tier_en: str,
) -> WorldEvent:
    """Log a civilization tier advance event."""
    title = f"文明晋级：{from_tier_zh} → {to_tier_zh}！"
    title_en = f"Civilization Advance: {from_tier_en} → {to_tier_en}!"
    desc = f"你的文明从{from_tier_zh}晋级为{to_tier_zh}"
    desc_en = f"Your civilization has advanced from {from_tier_en} to {to_tier_en}"
    return create_world_event(
        db, user_id, WorldEventType.TIER_ADVANCE,
        title, title_en, desc, desc_en,
    )


def event_milestone_reached(
    db: Session,
    user_id: UUID,
    milestone_name: str,
    milestone_name_en: str | None,
    milestone_description: str | None,
    milestone_description_en: str | None,
) -> WorldEvent:
    """Log a milestone achievement event."""
    title = f"里程碑达成：{milestone_name}！"
    title_en = f"Milestone Reached: {milestone_name_en or milestone_name}!"
    return create_world_event(
        db, user_id, WorldEventType.MILESTONE_REACHED,
        title, title_en, milestone_description, milestone_description_en,
    )
