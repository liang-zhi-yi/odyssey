"""Badge request / response schemas."""

from pydantic import BaseModel


class BadgeDefinitionResponse(BaseModel):
    id: str
    name: str
    name_en: str | None = None
    description: str | None = None
    description_en: str | None = None
    icon: str
    criteria: dict
    category: str

    model_config = {"from_attributes": True}


class UserBadgeResponse(BaseModel):
    badge_id: str
    badge: BadgeDefinitionResponse
    earned: bool
    earned_at: str | None = None
    progress_current: int | None = None
    progress_target: int | None = None
