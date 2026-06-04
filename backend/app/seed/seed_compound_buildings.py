"""
Seed compound building templates into the database.

Compound buildings require multiple skills at minimum levels to unlock.
Idempotent — checks for existing templates before inserting.
"""
from sqlalchemy.orm import Session

from app.world.models import CompoundBuildingTemplate

# Shared level names for all buildings
LEVEL_NAMES = {
    "1": {"zh": "基地", "en": "Foundation"},
    "2": {"zh": "工坊", "en": "Workshop"},
    "3": {"zh": "学院", "en": "Academy"},
    "4": {"zh": "研究院", "en": "Institute"},
    "5": {"zh": "堡垒", "en": "Citadel"},
}

COMPOUND_BUILDING_SEEDS = [
    {
        "name": "知识堡垒",
        "name_en": "Knowledge Citadel",
        "description": "提示工程与RAG融合，构建完整的知识获取、组织与理解体系。打通从精准提问到深度检索的全链路。",
        "description_en": "Merging Prompt Engineering with RAG to form a complete knowledge acquisition, organization, and understanding system.",
        "icon": "🏰",
        "region": "综合区",
        "region_en": "Synthesis Region",
        "max_level": 5,
        "level_names": LEVEL_NAMES,
        "required_skills": [
            {"skill_name": "Prompt Engineering", "min_level": 3},
            {"skill_name": "RAG", "min_level": 3},
        ],
        "position_x": 1,
        "position_y": 1,
    },
    {
        "name": "智能体之城",
        "name_en": "Agent City",
        "description": "LangGraph与Workflow融合，构建状态驱动的自主决策智能体协作系统。实现从单任务自动化到多智能体协同的跨越。",
        "description_en": "Merging LangGraph with Workflow Design to build state-driven autonomous multi-agent collaboration systems.",
        "icon": "🌆",
        "region": "综合区",
        "region_en": "Synthesis Region",
        "max_level": 5,
        "level_names": LEVEL_NAMES,
        "required_skills": [
            {"skill_name": "LangGraph", "min_level": 3},
            {"skill_name": "Workflow Design", "min_level": 3},
        ],
        "position_x": 3,
        "position_y": 2,
    },
]


def seed_compound_buildings(db: Session) -> int:
    """Insert compound building templates. Idempotent.

    Returns:
        Number of templates inserted.
    """
    inserted = 0

    for data in COMPOUND_BUILDING_SEEDS:
        name = data["name"]

        # Check if template already exists by name
        existing = db.query(CompoundBuildingTemplate).filter(
            CompoundBuildingTemplate.name == name
        ).first()
        if existing:
            continue

        template = CompoundBuildingTemplate(**data)
        db.add(template)
        inserted += 1

    if inserted:
        db.commit()
        print(f"  🏰  Seeded {inserted} compound building templates")

    return inserted
