"""Path request / response schemas."""

from pydantic import BaseModel


class PathResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
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
    progress: int = 0

    model_config = {"from_attributes": True}
