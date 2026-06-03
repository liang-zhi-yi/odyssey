"""Progress request / response schemas."""

from datetime import datetime

from pydantic import BaseModel


class ProgressLogResponse(BaseModel):
    skill: str
    previous: int
    current: int
    delta: int
    reason: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SkillGrowthPoint(BaseModel):
    date: str
    score: int
