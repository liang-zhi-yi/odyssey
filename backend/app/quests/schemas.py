"""Quest request / response schemas."""

from pydantic import BaseModel, ConfigDict


class QuestListResponse(BaseModel):
    id: str
    title: str
    title_en: str | None = None
    skill_id: str
    skill_name: str
    difficulty: str
    quest_type: str
    expected_deliverable: str

    model_config = {"from_attributes": True}


class QuestDetailResponse(BaseModel):
    id: str
    title: str
    title_en: str | None = None
    description: str | None = None
    description_en: str | None = None
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
    quest_title_en: str | None = None
    status: str
    latest_submission_id: str | None = None
    submission_count: int = 0

    model_config = ConfigDict(from_attributes=True)
