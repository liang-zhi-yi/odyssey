"""
Seed building templates into the database.

Maps each Skill to a Building with region, icon, grid position, and level names.
Idempotent — checks for existing templates before inserting.
"""
from sqlalchemy.orm import Session

from app.world.models import BuildingTemplate
from app.skills.models import Skill

# Shared level names for all buildings
LEVEL_NAMES = {
    "1": {"zh": "基地", "en": "Foundation"},
    "2": {"zh": "工坊", "en": "Workshop"},
    "3": {"zh": "学院", "en": "Academy"},
    "4": {"zh": "研究院", "en": "Institute"},
    "5": {"zh": "堡垒", "en": "Citadel"},
}

# Building templates keyed by skill name
BUILDING_SEEDS = [
    {
        "skill_name": "Prompt Engineering",
        "name": "语言学院",
        "name_en": "Language Academy",
        "description": "掌握提示词设计艺术，驱动大语言模型完成复杂任务。",
        "description_en": "Master the art of prompt design to drive LLMs for complex tasks.",
        "icon": "📝",
        "region": "语言区",
        "region_en": "Language Region",
        "max_level": 5,
        "position_x": 2,
        "position_y": 0,
    },
    {
        "skill_name": "RAG",
        "name": "知识殿堂",
        "name_en": "Knowledge Hall",
        "description": "构建检索增强生成系统，融合向量搜索与知识图谱。",
        "description_en": "Build RAG systems combining vector search and knowledge graphs.",
        "icon": "📚",
        "region": "知识区",
        "region_en": "Knowledge Region",
        "max_level": 5,
        "position_x": 0,
        "position_y": 1,
    },
    {
        "skill_name": "Workflow Design",
        "name": "自动化工坊",
        "name_en": "Automation Workshop",
        "description": "设计多步骤任务执行工作流，实现复杂流程自动化。",
        "description_en": "Design multi-step task execution workflows for complex automation.",
        "icon": "⚙️",
        "region": "自动化区",
        "region_en": "Automation Region",
        "max_level": 5,
        "position_x": 4,
        "position_y": 1,
    },
    {
        "skill_name": "LangGraph",
        "name": "智能体中心",
        "name_en": "Agent Center",
        "description": "构建状态驱动的智能体系统，实现自主决策与多Agent协作。",
        "description_en": "Build state-driven agent systems with autonomous decision-making and multi-agent collaboration.",
        "icon": "🤖",
        "region": "智能体区",
        "region_en": "Agent Region",
        "max_level": 5,
        "position_x": 2,
        "position_y": 2,
    },
]


def seed_buildings(db: Session) -> int:
    """Insert building templates for each skill. Idempotent.

    Returns:
        Number of templates inserted.
    """
    inserted = 0

    for data in BUILDING_SEEDS:
        skill_name = data.pop("skill_name")

        # Look up skill by name
        skill = db.query(Skill).filter(Skill.name == skill_name).first()
        if skill is None:
            print(f"  ⚠️  Skill '{skill_name}' not found — skipping building template")
            continue

        # Check if template already exists for this skill
        existing = db.query(BuildingTemplate).filter(
            BuildingTemplate.skill_id == skill.id
        ).first()
        if existing:
            continue

        template = BuildingTemplate(
            skill_id=skill.id,
            level_names=LEVEL_NAMES,
            **data,
        )
        db.add(template)
        inserted += 1

    if inserted:
        db.commit()
        print(f"  🏗️  Seeded {inserted} building templates")

    return inserted
