"""Skill request / response schemas."""

from pydantic import BaseModel


class SkillResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    category: str

    model_config = {"from_attributes": True}


class UserSkillResponse(BaseModel):
    skill_id: str
    skill_name: str | None = None
    knowledge: int
    reasoning: int
    application: int
    creation: int
    overall: int
    rank: str

    model_config = {"from_attributes": True}
