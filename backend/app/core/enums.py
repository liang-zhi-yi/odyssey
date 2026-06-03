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


class AssessmentStatus(str, enum.Enum):
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
