"""Project request / response schemas."""

import re
from datetime import datetime
from pydantic import BaseModel, field_validator

_URL_RE = re.compile(r"^https?://", re.IGNORECASE)


class CreateProjectRequest(BaseModel):
    title: str
    description: str | None = None
    github_url: str | None = None
    demo_url: str | None = None
    related_skill_id: str | None = None
    quest_submission_id: str | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("项目标题不能为空")
        return v

    @field_validator("github_url", "demo_url")
    @classmethod
    def validate_url(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        if not v:
            return None
        if not _URL_RE.match(v):
            raise ValueError("URL 必须以 http:// 或 https:// 开头")
        return v


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
