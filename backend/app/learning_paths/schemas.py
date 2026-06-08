"""Learning Paths schemas -- request/response models."""
from __future__ import annotations

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel


# -- Path Metadata (LLM-generated) --

class PathMetadataSchema(BaseModel):
    path_summary: str | None = None
    difficulty: int | None = None
    estimated_weeks: int | None = None
    recommended_skills: list[str] | None = None


# -- Checkpoint --

class CheckpointResponse(BaseModel):
    id: UUID
    milestone_id: UUID
    title: str
    title_en: str | None = None
    description: str | None = None
    description_en: str | None = None
    order_sequence: int
    required_score: int
    estimated_hours: int = 2
    quest_generation_status: str
    is_completed: bool
    completed_at: datetime | None = None
    generated_quests: list["GeneratedQuestResponse"] | None = None

    model_config = {"from_attributes": True}


# -- Milestone --

class MilestoneResponse(BaseModel):
    id: UUID
    learning_path_id: UUID
    title: str
    title_en: str | None = None
    description: str | None = None
    description_en: str | None = None
    skill_id: UUID | None = None
    skill_name: str | None = None
    is_completed: bool
    completed_at: datetime | None = None
    order_sequence: int
    building_target_id: UUID | None = None
    building_target: dict | None = None  # { name, name_en, icon, region }
    checkpoints: list[CheckpointResponse] | None = None

    model_config = {"from_attributes": True}


# -- Generated Quest --

class GeneratedQuestResponse(BaseModel):
    id: UUID
    quest_id: UUID | None = None
    title: str | None = None
    skill_id: UUID | None = None
    skill_name: str | None = None
    status: str

    model_config = {"from_attributes": True}


# -- Learning Path --

class LearningPathResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    description: str | None = None
    category: str | None = None
    target_date: date | None = None
    status: str
    path_type: str
    is_official: bool
    difficulty: int
    progress_pct: int
    path_metadata: dict | None = None
    civilization_type: str | None = None
    milestone_count: int | None = None
    targeted_buildings: list[dict] | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LearningPathDetailResponse(LearningPathResponse):
    milestones: list[MilestoneResponse] = []
    roadmap_nodes: list["MilestoneNodeResponse"] = []
    rewards_preview: "PathRewardsPreview | None" = None

    model_config = {"from_attributes": True}


# ── Roadmap / Civilization Development View ─────────────────────────────

class MilestoneNodeResponse(BaseModel):
    """Roadmap node for the civilization development map view."""
    id: UUID
    title: str
    title_en: str | None = None
    order_sequence: int
    estimated_hours: int = 4  # default 4 hours per milestone
    status: str = "LOCKED"  # LOCKED | ACTIVE | COMPLETED
    skill_name: str | None = None
    associated_building: dict | None = None  # { name, name_en, icon, region }
    progress_pct: int = 0  # 0–100
    checkpoints: list[CheckpointResponse] | None = None


class PathRewardsPreview(BaseModel):
    """Preview of buildings that will be unlocked/upgraded after completing the path."""
    buildings: list[dict] = []  # [{ name, icon, current_level, projected_level }]
    civilization_level_projection: int | None = None
    tier_projection: dict | None = None  # { current_tier, projected_tier }


# ── Stats Summary ──────────────────────────────────────────────────────

class PathStatsSummary(BaseModel):
    """Top-level stats for the paths page civilization overview."""
    civilization_level: int
    civilization_name: str
    era: str
    era_icon: str
    unlocked_buildings: int
    total_buildings: int
    completed_quests: int
    total_skill_value: int  # sum of all UserSkill overall scores


# ── AI Mentor ──────────────────────────────────────────────────────────

class MentorSuggestionResponse(BaseModel):
    """AI mentor panel suggestions."""
    current_suggestion: str  # "You're close to upgrading 语言学院 — complete 2 more quests!"
    recommended_quests: list[dict] = []  # [{ quest_id, title, skill_name, reward_summary }]
    estimated_growth: dict | None = None  # { building_upgrades: [...], tier_projection: str }
    actions: list[dict] = []  # [{ label, url, type: "continue" | "plan" | "chat" }]


class CreateLearningPathRequest(BaseModel):
    title: str
    description: str | None = None
    category: str | None = None
    target_date: date | None = None
    generate_with_ai: bool = True


class UpdateLearningPathRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    target_date: date | None = None
    status: str | None = None


class ToggleMilestoneResponse(BaseModel):
    milestone_id: UUID
    is_completed: bool
    path_progress_pct: int
    next_checkpoint_unlocked: bool


# -- AI Generation --

class GeneratePathResponse(BaseModel):
    path_id: UUID
    path_summary: str
    difficulty: int
    estimated_weeks: int
    milestone_count: int
    total_checkpoints: int
    quests_generated: int = 0


class GenerateQuestsRequest(BaseModel):
    skill_id: UUID | None = None


class GenerateQuestsResponse(BaseModel):
    checkpoint_id: UUID
    quests_generated: int
    quests: list[GeneratedQuestResponse]


# -- Memory Bank --

class UserMemoryEntry(BaseModel):
    id: UUID
    memory_type: str
    key: str
    value: dict
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UpsertMemoryRequest(BaseModel):
    memory_type: str
    key: str
    value: dict


class MemoryContextResponse(BaseModel):
    entries: list[UserMemoryEntry]
    summary: str
