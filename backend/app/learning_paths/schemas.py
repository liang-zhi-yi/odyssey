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
    milestone_count: int | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LearningPathDetailResponse(LearningPathResponse):
    milestones: list[MilestoneResponse] = []

    model_config = {"from_attributes": True}


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
