"""
Seed comprehensive compound building templates — 10 compound buildings.

From docs/world design.md section 6 (复合建筑系统).
Each compound building requires multiple skills at specific minimum levels.
Level is derived from the minimum of source skill scores (weakest link principle).
Idempotent — checks for existing templates before inserting.
"""
from sqlalchemy.orm import Session

from app.world.models import CompoundBuildingTemplate

# Level names for compound buildings
LEVEL_NAMES = {
    "1": {"zh": "基地", "en": "Foundation"},
    "2": {"zh": "工坊", "en": "Workshop"},
    "3": {"zh": "学院", "en": "Academy"},
    "4": {"zh": "研究院", "en": "Institute"},
    "5": {"zh": "堡垒", "en": "Citadel"},
    "6": {"zh": "圣殿", "en": "Sanctuary"},
    "7": {"zh": "奇观", "en": "Wonder"},
    "8": {"zh": "联盟", "en": "Alliance"},
    "9": {"zh": "帝国", "en": "Empire"},
    "10": {"zh": "核心", "en": "Core"},
}

COMPOUND_SEEDS_FULL = [
    {
        "name": "自动化工厂",
        "name_en": "Automated Factory",
        "description": "融合Workflow、Python与Agent能力，构建端到端的智能化生产流水线。实现从任务自动化到智能决策的全链路闭环。",
        "description_en": "Merging Workflow, Python, and Agent capabilities to build end-to-end intelligent production lines — from task automation to intelligent decision-making.",
        "icon": "🏭",
        "region": "综合区",
        "region_en": "Synthesis Region",
        "max_level": 10,
        "level_names": LEVEL_NAMES,
        "required_skills": [
            {"skill_name": "Workflow Design", "min_level": 7},
            {"skill_name": "Python", "min_level": 6},
            {"skill_name": "Agent", "min_level": 5},
        ],
        "position_x": 2, "position_y": 2,
    },
    {
        "name": "AI研究院",
        "name_en": "AI Research Institute",
        "description": "Prompt、RAG与LangGraph的深度融合——从精准提问到深度检索再到自主决策，构建完整的AI能力链。",
        "description_en": "Deep integration of Prompt Engineering, RAG, and LangGraph — building the complete AI capability chain from precise questioning to deep retrieval to autonomous decision-making.",
        "icon": "🧪",
        "region": "综合区",
        "region_en": "Synthesis Region",
        "max_level": 10,
        "level_names": LEVEL_NAMES,
        "required_skills": [
            {"skill_name": "Prompt Engineering", "min_level": 8},
            {"skill_name": "RAG", "min_level": 8},
            {"skill_name": "LangGraph", "min_level": 8},
            {"skill_name": "Research", "min_level": 6},
        ],
        "position_x": 1, "position_y": 1,
    },
    {
        "name": "数字银行",
        "name_en": "Digital Bank",
        "description": "金融、数据与编程的交叉融合——构建智能化的金融分析、风险评估和资产管理系统。",
        "description_en": "Intersection of Finance, Data, and Coding — building intelligent financial analysis, risk assessment, and asset management systems.",
        "icon": "🏦",
        "region": "综合区",
        "region_en": "Synthesis Region",
        "max_level": 10,
        "level_names": LEVEL_NAMES,
        "required_skills": [
            {"skill_name": "Finance", "min_level": 8},
            {"skill_name": "Data Analysis", "min_level": 8},
            {"skill_name": "Coding", "min_level": 6},
        ],
        "position_x": 3, "position_y": 2,
    },
    {
        "name": "媒体帝国",
        "name_en": "Media Empire",
        "description": "写作、视频与营销能力的融合——构建从内容创作到品牌传播的全媒体矩阵。",
        "description_en": "Fusion of Writing, Video, and Marketing — building a full-media matrix from content creation to brand communication.",
        "icon": "🎬",
        "region": "综合区",
        "region_en": "Synthesis Region",
        "max_level": 10,
        "level_names": LEVEL_NAMES,
        "required_skills": [
            {"skill_name": "Writing", "min_level": 8},
            {"skill_name": "Video", "min_level": 8},
            {"skill_name": "Marketing", "min_level": 8},
        ],
        "position_x": -3, "position_y": 1,
    },
    {
        "name": "教育联盟",
        "name_en": "Education Alliance",
        "description": "研究、写作与语言的顶尖融合——打造知识创造、传播与全球化的完整教育生态。",
        "description_en": "Top-tier fusion of Research, Writing, and Language — creating a complete education ecosystem for knowledge creation, dissemination, and globalization.",
        "icon": "🎓",
        "region": "综合区",
        "region_en": "Synthesis Region",
        "max_level": 10,
        "level_names": LEVEL_NAMES,
        "required_skills": [
            {"skill_name": "Research", "min_level": 10},
            {"skill_name": "Writing", "min_level": 10},
            {"skill_name": "English", "min_level": 10},
        ],
        "position_x": -1, "position_y": 3,
    },
    {
        "name": "全球贸易港",
        "name_en": "Global Trade Port",
        "description": "商业、营销与语言的三方融合——跨越语言障碍，构建全球化的商业网络与贸易体系。",
        "description_en": "Three-way fusion of Business, Marketing, and Language — crossing language barriers to build global business networks and trade systems.",
        "icon": "🚢",
        "region": "综合区",
        "region_en": "Synthesis Region",
        "max_level": 10,
        "level_names": LEVEL_NAMES,
        "required_skills": [
            {"skill_name": "Business", "min_level": 10},
            {"skill_name": "Marketing", "min_level": 10},
            {"skill_name": "English", "min_level": 8},
        ],
        "position_x": 4, "position_y": 2,
    },
    {
        "name": "超级计算中心",
        "name_en": "Supercomputing Center",
        "description": "编程、AI与数学的巅峰融合——构建世界级的计算基础设施，驱动科学研究与AI创新。",
        "description_en": "Peak fusion of Coding, AI, and Mathematics — building world-class computing infrastructure to drive scientific research and AI innovation.",
        "icon": "🖥️",
        "region": "综合区",
        "region_en": "Synthesis Region",
        "max_level": 10,
        "level_names": LEVEL_NAMES,
        "required_skills": [
            {"skill_name": "Coding", "min_level": 10},
            {"skill_name": "Agent", "min_level": 10},
            {"skill_name": "Mathematics", "min_level": 10},
        ],
        "position_x": 2, "position_y": -2,
    },
    {
        "name": "智慧城市",
        "name_en": "Smart City",
        "description": "管理、工程、数据与AI的四维融合——构建面向未来的智能城市治理体系。",
        "description_en": "Four-dimensional fusion of Management, Engineering, Data, and AI — building future-oriented smart city governance systems.",
        "icon": "🌆",
        "region": "综合区",
        "region_en": "Synthesis Region",
        "max_level": 10,
        "level_names": LEVEL_NAMES,
        "required_skills": [
            {"skill_name": "Management", "min_level": 10},
            {"skill_name": "Architecture", "min_level": 10},
            {"skill_name": "Data Analysis", "min_level": 10},
            {"skill_name": "Agent", "min_level": 10},
        ],
        "position_x": 0, "position_y": 5,
    },
    {
        "name": "星际港口",
        "name_en": "Starport",
        "description": "AI、工程、商业与科学的终极融合——文明的下一步是星辰大海。",
        "description_en": "Ultimate fusion of AI, Engineering, Business, and Science — the next step for civilization is the stars.",
        "icon": "🚀",
        "region": "综合区",
        "region_en": "Synthesis Region",
        "max_level": 10,
        "level_names": LEVEL_NAMES,
        "required_skills": [
            {"skill_name": "Agent", "min_level": 10},
            {"skill_name": "Architecture", "min_level": 10},
            {"skill_name": "Business", "min_level": 10},
            {"skill_name": "Research Methodology", "min_level": 10},
        ],
        "position_x": 0, "position_y": -5,
    },
    {
        "name": "文明奇观",
        "name_en": "Civilization Wonder",
        "description": "所有核心技能全部达到巅峰——解锁文明的终极成就。这是你能力成长的最高象征。",
        "description_en": "All core skills reach their peak — unlocking the ultimate achievement of civilization. The highest symbol of your capability growth.",
        "icon": "🌍",
        "region": "综合区",
        "region_en": "Synthesis Region",
        "max_level": 10,
        "level_names": LEVEL_NAMES,
        "required_skills": [
            {"skill_name": "Reading", "min_level": 10},
            {"skill_name": "Coding", "min_level": 10},
            {"skill_name": "Agent", "min_level": 10},
            {"skill_name": "Leadership", "min_level": 10},
            {"skill_name": "Creativity", "min_level": 10},
            {"skill_name": "Communication", "min_level": 10},
        ],
        "position_x": 0, "position_y": 0,
    },
]

# Also keep the original 2 compound buildings as legacy (updated to 10-level)
LEGACY_COMPOUND_SEEDS = [
    {
        "name": "知识堡垒",
        "name_en": "Knowledge Citadel",
        "description": "提示工程与RAG融合——构建完整的知识获取、组织与理解体系，打通从精准提问到深度检索的全链路。",
        "description_en": "Merging Prompt Engineering with RAG — building a complete knowledge acquisition, organization, and understanding system.",
        "icon": "🏰",
        "region": "综合区",
        "region_en": "Synthesis Region",
        "max_level": 10,
        "level_names": LEVEL_NAMES,
        "required_skills": [
            {"skill_name": "Prompt Engineering", "min_level": 3},
            {"skill_name": "RAG", "min_level": 3},
        ],
        "position_x": 1, "position_y": 0,
    },
    {
        "name": "智能体之城",
        "name_en": "Agent City",
        "description": "LangGraph与Workflow融合——构建状态驱动的自主决策智能体协作系统，实现从单任务自动化到多智能体协同的跨越。",
        "description_en": "Merging LangGraph with Workflow Design — building state-driven autonomous multi-agent collaboration systems.",
        "icon": "🌆",
        "region": "综合区",
        "region_en": "Synthesis Region",
        "max_level": 10,
        "level_names": LEVEL_NAMES,
        "required_skills": [
            {"skill_name": "LangGraph", "min_level": 3},
            {"skill_name": "Workflow Design", "min_level": 3},
        ],
        "position_x": 3, "position_y": 1,
    },
]


def seed_compound_buildings_full(db: Session) -> int:
    """Insert all compound building templates. Idempotent.

    Returns:
        Number of templates inserted.
    """
    inserted = 0
    all_seeds = COMPOUND_SEEDS_FULL + LEGACY_COMPOUND_SEEDS

    for data in all_seeds:
        name = data["name"]

        existing = db.query(CompoundBuildingTemplate).filter(
            CompoundBuildingTemplate.name == name
        ).first()
        if existing:
            # Update max_level from 5 to 10 for existing templates
            if existing.max_level == 5:
                existing.max_level = 10
                existing.level_names = data["level_names"]
            continue

        template = CompoundBuildingTemplate(**data)
        db.add(template)
        inserted += 1

    if inserted:
        db.commit()
        print(f"  🏰  Seeded {inserted} compound building templates (10-level)")

    return inserted
