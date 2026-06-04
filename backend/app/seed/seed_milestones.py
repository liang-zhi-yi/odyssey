"""
Seed capability milestone definitions into the database.

Milestones are progressive achievement checkpoints displayed in sequence.
Idempotent — checks for existing definitions before inserting.
"""
from sqlalchemy.orm import Session

from app.world.models import MilestoneDefinition

MILESTONE_SEEDS = [
    {
        "name": "First Steps",
        "name_en": "First Steps",
        "description": "第一个建筑达到Lv.2 — 你的文明刚刚起步。",
        "description_en": "First building reaches Level 2 — your civilization is taking its first steps.",
        "icon": "🌱",
        "category": "FOUNDATION",
        "order_sequence": 1,
        "criteria": {"type": "building_level", "count": 1, "level": 2, "target": "any"},
    },
    {
        "name": "Synergy",
        "name_en": "Synergy",
        "description": "解锁第一个复合建筑 — 技能融合，产生1+1>2的能力。",
        "description_en": "Unlock your first compound building — skill synergy achieved.",
        "icon": "🔗",
        "category": "EXPANSION",
        "order_sequence": 2,
        "criteria": {"type": "compound_unlocked", "count": 1},
    },
    {
        "name": "Expansion",
        "name_en": "Expansion",
        "description": "解锁第一个区域 — 你的能力世界正在扩张。",
        "description_en": "Unlock your first region — your capability world is expanding.",
        "icon": "🗺️",
        "category": "EXPANSION",
        "order_sequence": 3,
        "criteria": {"type": "region_unlocked", "count": 1},
    },
    {
        "name": "City Builder",
        "name_en": "City Builder",
        "description": "文明达到Town等级 — 从村落发展为城镇。",
        "description_en": "Civilization reaches Town tier — from village to town.",
        "icon": "🏙️",
        "category": "EXPANSION",
        "order_sequence": 4,
        "criteria": {"type": "tier_reached", "tier": "TOWN"},
    },
    {
        "name": "Architect",
        "name_en": "Architect",
        "description": "文明达到City等级 — 你正在建造一座能力之城。",
        "description_en": "Civilization reaches City tier — you are building a city of capabilities.",
        "icon": "🏛️",
        "category": "MASTERY",
        "order_sequence": 5,
        "criteria": {"type": "tier_reached", "tier": "CITY"},
    },
    {
        "name": "World Builder",
        "name_en": "World Builder",
        "description": "所有4个常规建筑均达到Lv.4以上 — 一个完整的能力世界已建立。",
        "description_en": "All 4 regular buildings reach Level 4+ — a complete capability world has been built.",
        "icon": "🌍",
        "category": "MASTERY",
        "order_sequence": 6,
        "criteria": {"type": "all_buildings_level", "level": 4, "count": 4},
    },
]


def seed_milestones(db: Session) -> int:
    """Insert milestone definitions. Idempotent.

    Returns:
        Number of definitions inserted.
    """
    inserted = 0

    for data in MILESTONE_SEEDS:
        name = data["name"]

        existing = db.query(MilestoneDefinition).filter(
            MilestoneDefinition.name == name
        ).first()
        if existing:
            continue

        milestone = MilestoneDefinition(**data)
        db.add(milestone)
        inserted += 1

    if inserted:
        db.commit()
        print(f"  🎯  Seeded {inserted} milestone definitions")

    return inserted
