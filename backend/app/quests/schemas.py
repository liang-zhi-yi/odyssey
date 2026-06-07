"""Quest request / response schemas."""

from pydantic import BaseModel, ConfigDict


class QuestRewardPreview(BaseModel):
    """Estimated rewards for completing a quest — calculated from difficulty + type."""
    knowledge: int = 0
    reasoning: int = 0
    application: int = 0
    creation: int = 0
    building_exp: int = 0
    civilization_contribution: int = 0


class QuestListResponse(BaseModel):
    id: str
    title: str
    title_en: str | None = None
    skill_id: str
    skill_name: str
    difficulty: str
    quest_type: str
    expected_deliverable: str
    # Optional: building context when using world-aware recommendations
    building_context: dict | None = None
    # Enhanced: associated building info
    associated_building: dict | None = None
    # Enhanced: reward preview
    reward_preview: QuestRewardPreview | None = None

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
    # Enhanced: associated building
    associated_building: dict | None = None
    # Enhanced: reward preview
    reward_preview: QuestRewardPreview | None = None

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
