"""Credential request / response schemas."""

from datetime import datetime

from pydantic import BaseModel


class CredentialResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    required_score: int

    model_config = {"from_attributes": True}


class UserCredentialResponse(BaseModel):
    id: str
    name: str
    issued_at: datetime

    model_config = {"from_attributes": True}
