"""
Seed capability milestone definitions into the database.

Milestones are progressive achievement checkpoints displayed in sequence.
Idempotent — checks for existing definitions before inserting.
"""
from sqlalchemy.orm import Session

from app.world.models import MilestoneDefinition

MILESTONE_SEEDS = [
    # ═══════════════════════════════════════════════════════════════════════
    # Foundation & Expansion (order 1-6)
    # ═══════════════════════════════════════════════════════════════════════
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

    # ═══════════════════════════════════════════════════════════════════════
    # Era-Gated Milestones (order 7-13)
    # ═══════════════════════════════════════════════════════════════════════
    {
        "name": "知识播种者",
        "name_en": "Knowledge Sower",
        "description": "进入农耕时代 — 播下知识的种子，开启文明成长。",
        "description_en": "Enter the Agriculture Era — sow the seeds of knowledge.",
        "icon": "🌾",
        "category": "ERA",
        "order_sequence": 7,
        "criteria": {"type": "era_reached", "era": "AGRICULTURE"},
    },
    {
        "name": "学术奠基人",
        "name_en": "Academic Founder",
        "description": "进入学院时代 — 系统化学习的奠基者。",
        "description_en": "Enter the Academy Era — founder of systematic learning.",
        "icon": "📖",
        "category": "ERA",
        "order_sequence": 8,
        "criteria": {"type": "era_reached", "era": "ACADEMY"},
    },
    {
        "name": "工程先驱",
        "name_en": "Engineering Pioneer",
        "description": "进入工业时代 — 工程与自动化的先驱。",
        "description_en": "Enter the Industry Era — pioneer of engineering and automation.",
        "icon": "⚙️",
        "category": "ERA",
        "order_sequence": 9,
        "criteria": {"type": "era_reached", "era": "INDUSTRY"},
    },
    {
        "name": "数字先锋",
        "name_en": "Digital Vanguard",
        "description": "进入信息时代 — 数字与信息革命的先锋。",
        "description_en": "Enter the Information Era — vanguard of the digital revolution.",
        "icon": "💻",
        "category": "ERA",
        "order_sequence": 10,
        "criteria": {"type": "era_reached", "era": "INFORMATION"},
    },
    {
        "name": "AI拓荒者",
        "name_en": "AI Trailblazer",
        "description": "进入AI时代 — 人工智能领域的拓荒者。",
        "description_en": "Enter the AI Era — trailblazer in artificial intelligence.",
        "icon": "🤖",
        "category": "ERA",
        "order_sequence": 11,
        "criteria": {"type": "era_reached", "era": "AI"},
    },
    {
        "name": "智能文明缔造者",
        "name_en": "Intelligence Founder",
        "description": "进入智能时代 — 智能文明的缔造者。",
        "description_en": "Enter the Intelligence Era — founder of intelligent civilization.",
        "icon": "🧠",
        "category": "ERA",
        "order_sequence": 12,
        "criteria": {"type": "era_reached", "era": "INTELLIGENCE"},
    },
    {
        "name": "数字文明建设者",
        "name_en": "Digital Civilization Builder",
        "description": "进入数字文明时代 — 数字世界的建设者。",
        "description_en": "Enter the Digital Civilization Era — builder of the digital world.",
        "icon": "🌐",
        "category": "ERA",
        "order_sequence": 13,
        "criteria": {"type": "era_reached", "era": "DIGITAL"},
    },

    # ═══════════════════════════════════════════════════════════════════════
    # Resource Milestones (order 14-17)
    # ═══════════════════════════════════════════════════════════════════════
    {
        "name": "知识积累者",
        "name_en": "Knowledge Accumulator",
        "description": "累计获得500知识点 — 知识的力量正在汇聚。",
        "description_en": "Accumulate 500 knowledge points — the power of knowledge is gathering.",
        "icon": "📝",
        "category": "RESOURCE",
        "order_sequence": 14,
        "criteria": {"type": "resources_accumulated", "resource": "knowledge_points", "count": 500},
    },
    {
        "name": "科技投资者",
        "name_en": "Tech Investor",
        "description": "累计获得500科技点 — 科技是第一生产力。",
        "description_en": "Accumulate 500 tech points — technology is the primary productive force.",
        "icon": "🔬",
        "category": "RESOURCE",
        "order_sequence": 15,
        "criteria": {"type": "resources_accumulated", "resource": "tech_points", "count": 500},
    },
    {
        "name": "人口增长者",
        "name_en": "Population Grower",
        "description": "人口达到1000 — 你的文明正在吸引更多人加入。",
        "description_en": "Population reaches 1000 — your civilization is attracting more people.",
        "icon": "👥",
        "category": "RESOURCE",
        "order_sequence": 16,
        "criteria": {"type": "resources_accumulated", "resource": "population", "count": 1000},
    },
    {
        "name": "知识殿堂",
        "name_en": "Knowledge Vault",
        "description": "累计获得5000知识点 — 一座知识殿堂已经建成。",
        "description_en": "Accumulate 5000 knowledge points — a knowledge vault has been built.",
        "icon": "🏫",
        "category": "RESOURCE",
        "order_sequence": 17,
        "criteria": {"type": "resources_accumulated", "resource": "knowledge_points", "count": 5000},
    },

    # ═══════════════════════════════════════════════════════════════════════
    # Civilization Level Milestones (order 18-20)
    # ═══════════════════════════════════════════════════════════════════════
    {
        "name": "文明初成",
        "name_en": "Civilization Taking Shape",
        "description": "文明等级达到10级 — 你的文明已初具规模。",
        "description_en": "Civilization reaches level 10 — your civilization is taking shape.",
        "icon": "🏘️",
        "category": "EXPANSION",
        "order_sequence": 18,
        "criteria": {"type": "civilization_level_reached", "level": 10},
    },
    {
        "name": "文明崛起",
        "name_en": "Rising Civilization",
        "description": "文明等级达到50级 — 你的文明正在崛起。",
        "description_en": "Civilization reaches level 50 — your civilization is rising.",
        "icon": "🏰",
        "category": "MASTERY",
        "order_sequence": 19,
        "criteria": {"type": "civilization_level_reached", "level": 50},
    },
    {
        "name": "未来文明",
        "name_en": "Future Civilization",
        "description": "进入未来文明时代 — 你已抵达文明的终极形态。",
        "description_en": "Enter the Future Civilization Era — the ultimate form of civilization.",
        "icon": "🚀",
        "category": "ERA",
        "order_sequence": 20,
        "criteria": {"type": "era_reached", "era": "FUTURE"},
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
