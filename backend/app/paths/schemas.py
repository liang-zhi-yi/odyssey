"""Path request / response schemas."""

from pydantic import BaseModel


class PathResponse(BaseModel):
    id: str
    name: str
    name_en: str | None = None
    description: str | None = None
    description_en: str | None = None
    difficulty: int
    is_official: bool = True

    model_config = {"from_attributes": True}


class SelectPathRequest(BaseModel):
    path_id: str


class SelectPathResponse(BaseModel):
    status: str


class UserPathResponse(BaseModel):
    path_id: str
    name: str
    name_en: str | None = None
    progress: int = 0

    model_config = {"from_attributes": True}


# ── Path Node (detailed growth path stages) ──────────────────────

class PathSkillNode(BaseModel):
    """A single node (stage) in a growth path, with skill details."""
    stage_order: int
    skill_id: str
    skill_name: str
    skill_name_en: str | None = None
    skill_description: str | None = None
    skill_description_en: str | None = None
    required_score: int

    model_config = {"from_attributes": True}


class PathNodesResponse(BaseModel):
    """Detailed breakdown of a growth path's stages."""
    path_id: str
    path_name: str
    path_name_en: str | None = None
    path_description: str | None = None
    path_description_en: str | None = None
    nodes: list[PathSkillNode]
