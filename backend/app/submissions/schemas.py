"""Submission request / response schemas."""

import re
from pydantic import BaseModel, field_validator, model_validator

_URL_RE = re.compile(r"^https?://", re.IGNORECASE)


class SubmitRequest(BaseModel):
    quest_id: str
    content: str | None = None
    github_url: str | None = None
    demo_url: str | None = None

    @field_validator("content", "github_url", "demo_url")
    @classmethod
    def strip_fields(cls, v: str | None) -> str | None:
        if v is None:
            return v
        v = v.strip()
        return v or None

    @field_validator("github_url", "demo_url")
    @classmethod
    def validate_url(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not _URL_RE.match(v):
            raise ValueError("URL 必须以 http:// 或 https:// 开头")
        return v

    @model_validator(mode="after")
    def require_content(self):
        if not (self.content or self.github_url or self.demo_url):
            raise ValueError("提交内容不能为空")
        return self


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
