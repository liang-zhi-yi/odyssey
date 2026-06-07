"""Project request / response schemas."""

from datetime import datetime
from pydantic import BaseModel


class CreateProjectRequest(BaseModel):
    title: str
    description: str | None = None
    github_url: str | None = None
    demo_url: str | None = None
    related_skill_id: str | None = None
    quest_submission_id: str | None = None


# ── Nested info types for enriched responses ──────────────────────────

class RelatedSkillInfo(BaseModel):
    id: str
    name: str
    category: str


class RelatedBuildingInfo(BaseModel):
    id: str
    name: str
    icon: str
    level: int


class QuestSubmissionInfo(BaseModel):
    id: str
    status: str
    quest_title: str
    quest_id: str
    assessment_score: int | None = None
    assessment_grade: str | None = None  # S / A / B / C / D


class SourcePathInfo(BaseModel):
    id: str
    title: str


# ── Response schemas ──────────────────────────────────────────────────

class ProjectResponse(BaseModel):
    id: str
    title: str
    description: str | None = None
    github_url: str | None = None
    demo_url: str | None = None
    created_at: datetime | None = None

    # Enriched relations (null if not linked)
    related_skill: RelatedSkillInfo | None = None
    related_building: RelatedBuildingInfo | None = None
    quest_submission: QuestSubmissionInfo | None = None
    source_path: SourcePathInfo | None = None

    model_config = {"from_attributes": True}


class ProjectDetailResponse(ProjectResponse):
    """Full project detail — same shape as list for now, may diverge later."""
    pass
