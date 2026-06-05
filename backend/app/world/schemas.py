"""
Pydantic schemas for World API responses — Phase 3 & Phase 4.
"""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


# ── Phase 3: Regular Building schemas ──────────────────────────────────

class BuildingTemplateResponse(BaseModel):
    id: UUID
    skill_id: UUID | None = None
    name: str
    name_en: str | None = None
    description: str | None = None
    description_en: str | None = None
    icon: str
    region: str
    region_en: str | None = None
    max_level: int
    level_names: dict
    position_x: int
    position_y: int

    model_config = {"from_attributes": True}


class UserBuildingResponse(BaseModel):
    id: UUID
    building_template_id: UUID
    level: int
    status: str
    constructed_at: datetime | None = None
    upgraded_at: datetime | None = None
    building_type: str = "regular"
    template: BuildingTemplateResponse | None = None

    model_config = {"from_attributes": True}


class RegionResponse(BaseModel):
    key: str
    name: str
    buildings: int
    highest_level: int
    unlocked: bool


class WorldStats(BaseModel):
    total_buildings: int
    active_buildings: int
    average_level: float
    highest_level: int
    highest_level_building_name: str | None = None
    civilization_level: int
    compound_buildings: int = 0
    active_compound_buildings: int = 0
    milestones_unlocked: int = 0
    total_milestones: int = 0


# ── Phase 4: Compound Building schemas ─────────────────────────────────

class CompoundBuildingTemplateResponse(BaseModel):
    id: UUID
    name: str
    name_en: str | None = None
    description: str | None = None
    description_en: str | None = None
    icon: str
    region: str
    region_en: str | None = None
    max_level: int
    level_names: dict
    required_skills: list[dict]
    position_x: int
    position_y: int

    model_config = {"from_attributes": True}


class UserCompoundBuildingResponse(BaseModel):
    id: UUID
    building_template_id: UUID
    level: int
    status: str
    constructed_at: datetime | None = None
    upgraded_at: datetime | None = None
    building_type: str = "compound"
    template: CompoundBuildingTemplateResponse | None = None

    model_config = {"from_attributes": True}


class SourceSkillScore(BaseModel):
    skill_name: str
    min_level: int
    knowledge: int
    reasoning: int
    application: int
    creation: int
    overall: int
    rank: str


class CompoundBuildingDetailResponse(UserCompoundBuildingResponse):
    source_skill_scores: list[SourceSkillScore] = []
    next_level_at: int = 101
    level_label: str = ""


# ── Phase 4: World Events schemas ──────────────────────────────────────

class WorldEventResponse(BaseModel):
    id: UUID
    event_type: str
    title: str
    title_en: str | None = None
    description: str | None = None
    description_en: str | None = None
    building_ref_id: UUID | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Phase 4: Milestone schemas ─────────────────────────────────────────

class MilestoneDefinitionResponse(BaseModel):
    id: UUID
    name: str
    name_en: str | None = None
    description: str | None = None
    description_en: str | None = None
    icon: str
    category: str
    criteria: dict
    order_sequence: int

    model_config = {"from_attributes": True}


class UserMilestoneResponse(BaseModel):
    id: UUID
    name: str
    name_en: str | None = None
    description: str | None = None
    description_en: str | None = None
    icon: str
    category: str
    criteria: dict
    order_sequence: int
    unlocked: bool
    unlocked_at: datetime | None = None


# ── Phase 4: Tech Tree schemas ─────────────────────────────────────────

class TechTreeNodeResponse(BaseModel):
    id: UUID
    name: str
    name_en: str | None = None
    icon: str
    region: str | None = None
    region_en: str | None = None
    level: int
    status: str
    position_x: int
    position_y: int
    node_type: str  # "regular" | "compound"
    required_skills: list[dict] | None = None
    prereq_progress: list[dict] | None = None
    all_prereqs_met: bool | None = None


class TechTreeResponse(BaseModel):
    regular_nodes: list[TechTreeNodeResponse]
    compound_nodes: list[TechTreeNodeResponse]


# ── Updated WorldResponse (Phase 4) ────────────────────────────────────

class WorldResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    civilization_level: int
    tier: str = "SETTLER"
    tier_name: str = "定居者"
    tier_score: int = 0
    next_tier_at: int = 0
    created_at: datetime
    updated_at: datetime
    regions: list[RegionResponse]
    buildings: list[UserBuildingResponse]
    compound_buildings: list[UserCompoundBuildingResponse] = []
    stats: WorldStats
    recent_events: list[WorldEventResponse] = []

    model_config = {"from_attributes": True}


# ── Building detail (regular) ──────────────────────────────────────────

class BuildingDetailResponse(UserBuildingResponse):
    skill_scores: dict | None = None
    next_level_at: int
    level_label: str


# ── Upgrade event ──────────────────────────────────────────────────────

class UpgradeEvent(BaseModel):
    building_name: str
    building_name_en: str | None = None
    from_level: int
    to_level: int
    level_name: str = ""
    level_name_en: str | None = None


# ── Civilization Direction ─────────────────────────────────────────────

class TargetedBuildingResponse(BaseModel):
    building_id: str
    building_name: str
    building_name_en: str | None = None
    building_icon: str
    current_level: int
    projected_level: int
    remaining_milestones: int
    region: str
    region_en: str | None = None
    max_level: int


class ActivePathDirection(BaseModel):
    path_id: str
    path_title: str
    progress_pct: int
    targeted_buildings: list[TargetedBuildingResponse]


class CivilizationDirectionResponse(BaseModel):
    active_paths: list[ActivePathDirection]
    summary: str
    suggested_focus: str
