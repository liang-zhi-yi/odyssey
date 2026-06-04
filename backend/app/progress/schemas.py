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


# ── Path Growth ──────────────────────────────────────────────────────

class PathSkillGrowth(BaseModel):
    """Growth curve data for a single skill within a path."""
    skill_id: str
    skill_name: str
    points: list[SkillGrowthPoint]


class PathGrowthResponse(BaseModel):
    """Growth curves for all skills in a learning path."""
    path_id: str
    path_name: str
    skills: list[PathSkillGrowth]


class TimelineEvent(BaseModel):
    date: str  # YYYY-MM-DD
    skill_name: str
    event_type: str = "assessment"
    previous_score: int
    new_score: int
    delta: int
    reason: str


class TimelineResponse(BaseModel):
    events: list[TimelineEvent]
    total: int
