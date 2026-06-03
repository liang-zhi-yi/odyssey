"""Project request / response schemas."""

from pydantic import BaseModel


class CreateProjectRequest(BaseModel):
    title: str
    description: str | None = None
    github_url: str | None = None
    demo_url: str | None = None
    related_skill_id: str | None = None
    quest_submission_id: str | None = None


class ProjectResponse(BaseModel):
    id: str
    title: str
    description: str | None = None
    github_url: str | None = None
    demo_url: str | None = None

    model_config = {"from_attributes": True}
