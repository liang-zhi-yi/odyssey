"""
Pydantic schemas for World, BuildingTemplate, and UserBuilding API responses.
"""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class BuildingTemplateResponse(BaseModel):
    id: UUID
    skill_id: UUID
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


class WorldResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    civilization_level: int
    created_at: datetime
    updated_at: datetime
    regions: list[RegionResponse]
    buildings: list[UserBuildingResponse]
    stats: WorldStats

    model_config = {"from_attributes": True}


class BuildingDetailResponse(UserBuildingResponse):
    skill_scores: dict | None = None
    next_level_at: int
    level_label: str


class UpgradeEvent(BaseModel):
    building_name: str
    building_name_en: str | None = None
    from_level: int
    to_level: int
    level_name: str
    level_name_en: str | None = None
