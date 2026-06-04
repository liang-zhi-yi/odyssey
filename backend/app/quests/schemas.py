"""Quest request / response schemas."""

from pydantic import BaseModel


class QuestListResponse(BaseModel):
    id: str
    title: str
    skill_id: str
    skill_name: str
    difficulty: str
    quest_type: str
    expected_deliverable: str

    model_config = {"from_attributes": True}


class QuestDetailResponse(BaseModel):
    id: str
    title: str
    description: str | None = None
    skill_id: str
    skill_name: str
    difficulty: str
    quest_type: str
    expected_deliverable: str

    model_config = {"from_attributes": True}


class AcceptQuestResponse(BaseModel):
    status: str


class UserQuestResponse(BaseModel):
    quest_id: str
    quest_title: str
    status: str

    model_config = {"from_attributes": True}
