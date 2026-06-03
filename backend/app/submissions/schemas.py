"""Submission request / response schemas."""

from pydantic import BaseModel


class SubmitRequest(BaseModel):
    quest_id: str
    content: str | None = None
    github_url: str | None = None
    demo_url: str | None = None


class SubmitResponse(BaseModel):
    submission_id: str
    status: str


class SubmissionResponse(BaseModel):
    submission_id: str
    quest_id: str
    content: str | None = None
    github_url: str | None = None
    demo_url: str | None = None
    status: str

    model_config = {"from_attributes": True}
