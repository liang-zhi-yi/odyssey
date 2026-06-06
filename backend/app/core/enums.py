"""
Shared Enum types used across models and schemas.

All enums are defined here to avoid circular imports.
"""
import enum


class UserPathStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"


class SkillRank(str, enum.Enum):
    NOVICE = "NOVICE"
    BEGINNER = "BEGINNER"
    PRACTITIONER = "PRACTITIONER"
    ENGINEER = "ENGINEER"
    ARCHITECT = "ARCHITECT"


class QuestDifficulty(str, enum.Enum):
    LEVEL_1 = "LEVEL_1"
    LEVEL_2 = "LEVEL_2"
    LEVEL_3 = "LEVEL_3"
    LEVEL_4 = "LEVEL_4"


class QuestType(str, enum.Enum):
    KNOWLEDGE = "KNOWLEDGE"
    APPLICATION = "APPLICATION"
    PROJECT = "PROJECT"
    MASTERY = "MASTERY"


class DeliverableType(str, enum.Enum):
    PROMPT = "PROMPT"
    ARCHITECTURE = "ARCHITECTURE"
    WORKFLOW = "WORKFLOW"
    CODE = "CODE"
    REPORT = "REPORT"


class SubmissionStatus(str, enum.Enum):
    ACCEPTED = "ACCEPTED"
    IN_PROGRESS = "IN_PROGRESS"
    SUBMITTED = "SUBMITTED"
    ASSESSING = "ASSESSING"
    PASSED = "PASSED"
    FAILED = "FAILED"
    ABANDONED = "ABANDONED"


class AssessmentStatus(str, enum.Enum):
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class BuildingStatus(str, enum.Enum):
    LOCKED = "LOCKED"           # Skill not yet activated
    CONSTRUCTING = "CONSTRUCTING"  # Recently activated, building under construction
    STABLE = "STABLE"           # At current level, no recent change
    UPGRADING = "UPGRADING"     # Just upgraded, transient state


class WorldEventType(str, enum.Enum):
    """Types of world events for the event timeline."""
    BUILDING_UPGRADE = "BUILDING_UPGRADE"           # Regular building level up
    COMPOUND_UNLOCK = "COMPOUND_UNLOCK"             # Compound building unlocked
    COMPOUND_UPGRADE = "COMPOUND_UPGRADE"           # Compound building level up
    REGION_UNLOCK = "REGION_UNLOCK"                 # New region unlocked (first building >= Lv.3)
    TIER_ADVANCE = "TIER_ADVANCE"                   # Civilization tier advanced
    MILESTONE_REACHED = "MILESTONE_REACHED"         # Capability milestone achieved
    PATH_MILESTONE_COMPLETED = "PATH_MILESTONE_COMPLETED"  # Learning path milestone completed


class CivilizationTier(str, enum.Enum):
    """Civilization tiers with score thresholds.

    Score formula: regular_building_levels + compound_building_levels × 2 + milestones_unlocked
    """
    SETTLER = "SETTLER"         # 0-4
    VILLAGE = "VILLAGE"         # 5-9
    TOWN = "TOWN"               # 10-14
    CITY = "CITY"               # 15-19
    METROPOLIS = "METROPOLIS"   # 20-24
    CIVILIZATION = "CIVILIZATION"  # 25+


# Tier lookup: (tier_enum, min_score, name_zh, name_en)
TIER_RANGES: list[tuple[CivilizationTier, int, str, str]] = [
    (CivilizationTier.SETTLER, 0, "定居者", "Settler"),
    (CivilizationTier.VILLAGE, 5, "村落", "Village"),
    (CivilizationTier.TOWN, 10, "城镇", "Town"),
    (CivilizationTier.CITY, 15, "城市", "City"),
    (CivilizationTier.METROPOLIS, 20, "大都会", "Metropolis"),
    (CivilizationTier.CIVILIZATION, 25, "文明", "Civilization"),
]


class SkillDomain(str, enum.Enum):
    """Top-level domain grouping skills (AI, Programming, Product, etc.)."""
    AI = "AI"
    PROGRAMMING = "PROGRAMMING"
    PRODUCT = "PRODUCT"
    DESIGN = "DESIGN"
    WRITING = "WRITING"
    RESEARCH = "RESEARCH"
    BUSINESS = "BUSINESS"
    MANAGEMENT = "MANAGEMENT"
    LANGUAGE = "LANGUAGE"
    FITNESS = "FITNESS"
    CAREER = "CAREER"
    FINANCE = "FINANCE"
    SCIENCE = "SCIENCE"
    MEDIA = "MEDIA"
    HEALTH = "HEALTH"


SKILL_DOMAIN_LABELS: dict[SkillDomain, dict[str, str]] = {
    SkillDomain.AI: {"zh": "人工智能", "en": "AI"},
    SkillDomain.PROGRAMMING: {"zh": "编程", "en": "Programming"},
    SkillDomain.PRODUCT: {"zh": "产品", "en": "Product"},
    SkillDomain.DESIGN: {"zh": "设计", "en": "Design"},
    SkillDomain.WRITING: {"zh": "写作", "en": "Writing"},
    SkillDomain.RESEARCH: {"zh": "研究", "en": "Research"},
    SkillDomain.BUSINESS: {"zh": "商业", "en": "Business"},
    SkillDomain.MANAGEMENT: {"zh": "管理", "en": "Management"},
    SkillDomain.LANGUAGE: {"zh": "语言", "en": "Language"},
    SkillDomain.FITNESS: {"zh": "健身", "en": "Fitness"},
    SkillDomain.CAREER: {"zh": "职业", "en": "Career"},
    SkillDomain.FINANCE: {"zh": "金融", "en": "Finance"},
    SkillDomain.SCIENCE: {"zh": "科学", "en": "Science"},
    SkillDomain.MEDIA: {"zh": "媒体", "en": "Media"},
    SkillDomain.HEALTH: {"zh": "健康", "en": "Health"},
}


class CivilizationType(str, enum.Enum):
    """12 civilization types — each represents a building evolution track."""
    KNOWLEDGE = "KNOWLEDGE"       # 知识文明
    ENGINEERING = "ENGINEERING"   # 工程文明
    AI = "AI"                     # AI文明
    BUSINESS = "BUSINESS"         # 商业文明
    DESIGN = "DESIGN"             # 设计文明
    MEDIA = "MEDIA"               # 媒体文明
    SCIENCE = "SCIENCE"           # 科学文明
    LANGUAGE = "LANGUAGE"         # 语言文明
    HEALTH = "HEALTH"             # 健康文明
    FINANCE = "FINANCE"           # 金融文明
    DIGITAL = "DIGITAL"           # 数字文明
    SOCIETY = "SOCIETY"           # 社会文明


CIVILIZATION_TYPE_LABELS: dict[CivilizationType, dict[str, str]] = {
    CivilizationType.KNOWLEDGE: {"zh": "知识文明", "en": "Knowledge"},
    CivilizationType.ENGINEERING: {"zh": "工程文明", "en": "Engineering"},
    CivilizationType.AI: {"zh": "AI文明", "en": "AI"},
    CivilizationType.BUSINESS: {"zh": "商业文明", "en": "Business"},
    CivilizationType.DESIGN: {"zh": "设计文明", "en": "Design"},
    CivilizationType.MEDIA: {"zh": "媒体文明", "en": "Media"},
    CivilizationType.SCIENCE: {"zh": "科学文明", "en": "Science"},
    CivilizationType.LANGUAGE: {"zh": "语言文明", "en": "Language"},
    CivilizationType.HEALTH: {"zh": "健康文明", "en": "Health"},
    CivilizationType.FINANCE: {"zh": "金融文明", "en": "Finance"},
    CivilizationType.DIGITAL: {"zh": "数字文明", "en": "Digital"},
    CivilizationType.SOCIETY: {"zh": "社会文明", "en": "Society"},
}


class WorldEventType(str, enum.Enum):
    """Types of world events for the event timeline."""
    BUILDING_UPGRADE = "BUILDING_UPGRADE"           # Regular building level up
    COMPOUND_UNLOCK = "COMPOUND_UNLOCK"             # Compound building unlocked
    COMPOUND_UPGRADE = "COMPOUND_UPGRADE"           # Compound building level up
    REGION_UNLOCK = "REGION_UNLOCK"                 # New region unlocked (first building >= Lv.3)
    TIER_ADVANCE = "TIER_ADVANCE"                   # Civilization tier advanced
    MILESTONE_REACHED = "MILESTONE_REACHED"         # Capability milestone achieved
    PATH_MILESTONE_COMPLETED = "PATH_MILESTONE_COMPLETED"  # Learning path milestone completed
    ERA_ADVANCE = "ERA_ADVANCE"                     # Civilization era advanced
    EXPLORATION_UNLOCK = "EXPLORATION_UNLOCK"       # Fog of war zone unlocked
    RESOURCE_BOOST = "RESOURCE_BOOST"               # Resource boost event


class MilestoneCategory(str, enum.Enum):
    """Categories for capability milestones."""
    FOUNDATION = "FOUNDATION"   # Early game: first building, first upgrade
    EXPANSION = "EXPANSION"     # Mid game: compound buildings, regions
    MASTERY = "MASTERY"         # Late game: all buildings maxed
    ERA = "ERA"                 # Era-gated milestones
    RESOURCE = "RESOURCE"       # Resource accumulation milestones


class CivilizationEra(str, enum.Enum):
    """9-era civilization progression with score thresholds and building unlocks."""
    WILDERNESS = "WILDERNESS"           # 荒野时代 — 0-100
    AGRICULTURE = "AGRICULTURE"         # 农耕时代 — 100-500
    ACADEMY = "ACADEMY"                 # 学院时代 — 500-1500
    INDUSTRY = "INDUSTRY"               # 工业时代 — 1500-3000
    INFORMATION = "INFORMATION"         # 信息时代 — 3000-6000
    AI = "AI"                          # AI时代 — 6000-10000
    INTELLIGENCE = "INTELLIGENCE"       # 智能时代 — 10000-15000
    DIGITAL = "DIGITAL"                 # 数字文明时代 — 15000-25000
    FUTURE = "FUTURE"                   # 未来文明时代 — 25000+


# Era lookup: (era_enum, min_score, name_zh, name_en, icon, unlocked_civ_types)
ERA_RANGES: list[tuple[CivilizationEra, int, str, str, str, list[CivilizationType]]] = [
    (CivilizationEra.WILDERNESS, 0, "荒野时代", "Wilderness Era", "🏕️", [
        CivilizationType.KNOWLEDGE,
    ]),
    (CivilizationEra.AGRICULTURE, 100, "农耕时代", "Agriculture Era", "🌾", [
        CivilizationType.KNOWLEDGE,
        CivilizationType.LANGUAGE,
    ]),
    (CivilizationEra.ACADEMY, 500, "学院时代", "Academy Era", "📖", [
        CivilizationType.KNOWLEDGE,
        CivilizationType.LANGUAGE,
        CivilizationType.SCIENCE,
    ]),
    (CivilizationEra.INDUSTRY, 1500, "工业时代", "Industry Era", "⚙️", [
        CivilizationType.ENGINEERING,
        CivilizationType.SCIENCE,
    ]),
    (CivilizationEra.INFORMATION, 3000, "信息时代", "Information Era", "💻", [
        CivilizationType.ENGINEERING,
        CivilizationType.DIGITAL,
        CivilizationType.FINANCE,
    ]),
    (CivilizationEra.AI, 6000, "AI时代", "AI Era", "🤖", [
        CivilizationType.AI,
        CivilizationType.DIGITAL,
    ]),
    (CivilizationEra.INTELLIGENCE, 10000, "智能时代", "Intelligence Era", "🧠", [
        CivilizationType.AI,
        CivilizationType.BUSINESS,
        CivilizationType.DESIGN,
        CivilizationType.MEDIA,
    ]),
    (CivilizationEra.DIGITAL, 15000, "数字文明时代", "Digital Civilization Era", "🌐", [
        CivilizationType.DIGITAL,
        CivilizationType.SOCIETY,
        CivilizationType.FINANCE,
        CivilizationType.HEALTH,
    ]),
    (CivilizationEra.FUTURE, 25000, "未来文明时代", "Future Civilization Era", "🚀", [
        CivilizationType.KNOWLEDGE,
        CivilizationType.ENGINEERING,
        CivilizationType.AI,
        CivilizationType.BUSINESS,
        CivilizationType.DESIGN,
        CivilizationType.MEDIA,
        CivilizationType.SCIENCE,
        CivilizationType.LANGUAGE,
        CivilizationType.HEALTH,
        CivilizationType.FINANCE,
        CivilizationType.DIGITAL,
        CivilizationType.SOCIETY,
    ]),
]
