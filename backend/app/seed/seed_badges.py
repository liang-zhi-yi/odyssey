"""
Seed badge definitions into the database.

7 design-doc civilization badges + 9 era progression badges = 16 total.
Idempotent — checks for existing badges before inserting.
"""
from sqlalchemy.orm import Session

from app.badges.models import BadgeDefinition

BADGE_SEEDS = [
    # ═══════════════════════════════════════════════════════════════════════
    # 7 Design-Doc Civilization Badges
    # ═══════════════════════════════════════════════════════════════════════
    {
        "name": "学者",
        "name_en": "Scholar",
        "description": "解锁5座知识文明建筑 — 知识即是力量。",
        "description_en": "Unlock 5 Knowledge-type buildings — knowledge is power.",
        "icon": "📚",
        "category": "civilization",
        "criteria": {
            "type": "single",
            "type_detail": "buildings_unlocked",
            "civ_type": "KNOWLEDGE",
            "count": 5,
        },
    },
    {
        "name": "发明家",
        "name_en": "Inventor",
        "description": "建造自动化工厂 — 工程与效率的结合。",
        "description_en": "Build the Automation Factory — engineering meets efficiency.",
        "icon": "⚙️",
        "category": "civilization",
        "criteria": {
            "type": "single",
            "type_detail": "compound_built",
            "name": "自动化工厂",
        },
    },
    {
        "name": "AI先驱",
        "name_en": "AI Pioneer",
        "description": "建造Agent基地 — 人工智能领域的开拓者。",
        "description_en": "Build the Agent Base — pioneer in artificial intelligence.",
        "icon": "🤖",
        "category": "civilization",
        "criteria": {
            "type": "single",
            "type_detail": "compound_built",
            "name": "Agent基地",
        },
    },
    {
        "name": "商业巨擘",
        "name_en": "Business Tycoon",
        "description": "解锁商业联盟 — 商业文明的缔造者。",
        "description_en": "Unlock the Business Alliance — builder of commercial civilization.",
        "icon": "💰",
        "category": "civilization",
        "criteria": {
            "type": "single",
            "type_detail": "compound_built",
            "name": "商业联盟",
        },
    },
    {
        "name": "创造大师",
        "name_en": "Creative Master",
        "description": "解锁创造神殿 — 创意与设计的巅峰。",
        "description_en": "Unlock the Creation Sanctuary — pinnacle of creativity and design.",
        "icon": "🎨",
        "category": "civilization",
        "criteria": {
            "type": "single",
            "type_detail": "compound_built",
            "name": "创造神殿",
        },
    },
    {
        "name": "文明领袖",
        "name_en": "Civilization Leader",
        "description": "文明等级达到100级 — 真正的文明引领者。",
        "description_en": "Civilization reaches level 100 — a true leader of civilization.",
        "icon": "👑",
        "category": "civilization",
        "criteria": {
            "type": "single",
            "type_detail": "civilization_level",
            "level": 100,
        },
    },
    {
        "name": "文明缔造者",
        "name_en": "World Builder",
        "description": "所有建筑均达到最高等级 — 一个完整文明世界的缔造者。",
        "description_en": "All buildings at maximum level — founder of a complete civilization world.",
        "icon": "🌍",
        "category": "civilization",
        "criteria": {
            "type": "single",
            "type_detail": "all_buildings_max_level",
        },
    },

    # ═══════════════════════════════════════════════════════════════════════
    # 9 Era Progression Badges
    # ═══════════════════════════════════════════════════════════════════════
    {
        "name": "荒野开拓者",
        "name_en": "Wilderness Pioneer",
        "description": "进入荒野时代 — 文明的第一步。",
        "description_en": "Enter the Wilderness Era — first step of civilization.",
        "icon": "🏕️",
        "category": "era",
        "criteria": {
            "type": "single",
            "type_detail": "era_reached",
            "era": "WILDERNESS",
        },
    },
    {
        "name": "农耕先驱",
        "name_en": "Agriculture Pioneer",
        "description": "进入农耕时代 — 播种知识的种子。",
        "description_en": "Enter the Agriculture Era — sowing seeds of knowledge.",
        "icon": "🌾",
        "category": "era",
        "criteria": {
            "type": "single",
            "type_detail": "era_reached",
            "era": "AGRICULTURE",
        },
    },
    {
        "name": "学院学者",
        "name_en": "Academy Scholar",
        "description": "进入学院时代 — 系统化学习与研究的开端。",
        "description_en": "Enter the Academy Era — dawn of systematic learning and research.",
        "icon": "📖",
        "category": "era",
        "criteria": {
            "type": "single",
            "type_detail": "era_reached",
            "era": "ACADEMY",
        },
    },
    {
        "name": "工业先驱",
        "name_en": "Industry Pioneer",
        "description": "进入工业时代 — 工程化能力的崛起。",
        "description_en": "Enter the Industry Era — rise of engineering capability.",
        "icon": "⚙️",
        "category": "era",
        "criteria": {
            "type": "single",
            "type_detail": "era_reached",
            "era": "INDUSTRY",
        },
    },
    {
        "name": "信息先锋",
        "name_en": "Information Pioneer",
        "description": "进入信息时代 — 数字与信息的掌控者。",
        "description_en": "Enter the Information Era — master of digital and information.",
        "icon": "💻",
        "category": "era",
        "criteria": {
            "type": "single",
            "type_detail": "era_reached",
            "era": "INFORMATION",
        },
    },
    {
        "name": "AI探索者",
        "name_en": "AI Explorer",
        "description": "进入AI时代 — 人工智能领域的探索者。",
        "description_en": "Enter the AI Era — explorer in artificial intelligence.",
        "icon": "🤖",
        "category": "era",
        "criteria": {
            "type": "single",
            "type_detail": "era_reached",
            "era": "AI",
        },
    },
    {
        "name": "智能先驱",
        "name_en": "Intelligence Pioneer",
        "description": "进入智能时代 — 智能文明的拓荒者。",
        "description_en": "Enter the Intelligence Era — pioneer of intelligent civilization.",
        "icon": "🧠",
        "category": "era",
        "criteria": {
            "type": "single",
            "type_detail": "era_reached",
            "era": "INTELLIGENCE",
        },
    },
    {
        "name": "数字先驱",
        "name_en": "Digital Pioneer",
        "description": "进入数字文明时代 — 数字世界的建造者。",
        "description_en": "Enter the Digital Civilization Era — builder of the digital world.",
        "icon": "🌐",
        "category": "era",
        "criteria": {
            "type": "single",
            "type_detail": "era_reached",
            "era": "DIGITAL",
        },
    },
    {
        "name": "未来缔造者",
        "name_en": "Future Builder",
        "description": "进入未来文明时代 — 你已抵达文明的终极形态。",
        "description_en": "Enter the Future Civilization Era — you have reached the ultimate form of civilization.",
        "icon": "🚀",
        "category": "era",
        "criteria": {
            "type": "single",
            "type_detail": "era_reached",
            "era": "FUTURE",
        },
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
