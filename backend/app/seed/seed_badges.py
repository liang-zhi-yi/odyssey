"""
Seed badge definitions into the database.

Idempotent — checks for existing badges before inserting.
"""
from sqlalchemy.orm import Session

from app.badges.models import BadgeDefinition

BADGE_SEEDS = [
    {
        "name": "First Quest",
        "name_en": "First Quest",
        "description": "完成第一次任务提交",
        "description_en": "Complete your first quest submission",
        "icon": "🎯",
        "category": "milestone",
        "criteria": {"type": "single", "type_detail": "quest_complete", "count": 1},
    },
    {
        "name": "Quest Veteran",
        "name_en": "Quest Veteran",
        "description": "累计通过5次任务评估",
        "description_en": "Pass 5 quest assessments",
        "icon": "⚔️",
        "category": "milestone",
        "criteria": {"type": "single", "type_detail": "assessment_passed", "count": 5},
    },
    {
        "name": "All-Round Practitioner",
        "name_en": "All-Round Practitioner",
        "description": "任意技能的四个维度均达到60分",
        "description_en": "All 4 dimensions of any skill reach 60",
        "icon": "🌟",
        "category": "mastery",
        "criteria": {"type": "single", "type_detail": "all_dims_threshold", "threshold": 60},
    },
    {
        "name": "Architect Rank",
        "name_en": "Architect Rank",
        "description": "任意技能达到ARCHITECT等级（81分以上）",
        "description_en": "Achieve ARCHITECT rank (81+) in any skill",
        "icon": "🏛️",
        "category": "ranking",
        "criteria": {"type": "single", "type_detail": "rank_achieved", "rank": "ARCHITECT"},
    },
    {
        "name": "Full Stack Explorer",
        "name_en": "Full Stack Explorer",
        "description": "所有四个技能领域均已激活（分数大于0）",
        "description_en": "All 4 skill domains are active (score > 0)",
        "icon": "🗺️",
        "category": "milestone",
        "criteria": {"type": "single", "type_detail": "all_skills_active"},
    },
]


def seed_badges(db: Session) -> int:
    """Insert badge definitions if they don't already exist.

    Returns:
        Number of badges inserted.
    """
    existing = {b.name for b in db.query(BadgeDefinition).all()}
    inserted = 0

    for data in BADGE_SEEDS:
        if data["name"] in existing:
            continue
        badge = BadgeDefinition(**data)
        db.add(badge)
        inserted += 1

    if inserted:
        db.commit()
        print(f"  🌟 Seeded {inserted} badge definitions")

    return inserted
