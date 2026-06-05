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
}


class MilestoneCategory(str, enum.Enum):
    """Categories for capability milestones."""
    FOUNDATION = "FOUNDATION"   # Early game: first building, first upgrade
    EXPANSION = "EXPANSION"     # Mid game: compound buildings, regions
    MASTERY = "MASTERY"         # Late game: all buildings maxed
