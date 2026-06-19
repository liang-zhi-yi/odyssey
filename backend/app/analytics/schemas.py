"""Analytics request / response schemas."""

from __future__ import annotations

import enum
from typing import Optional

from pydantic import BaseModel


class InsightType(str, enum.Enum):
    GROWTH_ACCELERATION = "growth_acceleration"
    PLATEAU_WARNING = "plateau_warning"
    SKILL_GAP = "skill_gap"
    STRENGTH_AREA = "strength_area"
    RECOMMENDED_FOCUS = "recommended_focus"


class AIInsight(BaseModel):
    type: InsightType
    title: str
    title_en: str
    description: str
    description_en: str
    icon: str  # emoji
    related_skill_id: Optional[str] = None
    action_label: Optional[str] = None
    action_label_en: Optional[str] = None


class InsightsResponse(BaseModel):
    insights: list[AIInsight]


class AnalyticsSummary(BaseModel):
    total_quests: int
    total_assessments: int
    growth_rate: float  # average overall score delta per assessment
    streak_days: int = 0  # current consecutive days with activity
    strongest_skill: Optional[str] = None  # skill name with highest overall score
    strongest_skill_en: Optional[str] = None
    strongest_skill_score: Optional[int] = None
    weakest_skill: Optional[str] = None
    weakest_skill_en: Optional[str] = None
    weakest_skill_score: Optional[int] = None


class TrendPoint(BaseModel):
    date: str
    overall: int
    knowledge: int
    reasoning: int
    application: int
    creation: int


class TrendsResponse(BaseModel):
    skill_id: str
    skill_name: str
    skill_name_en: Optional[str] = None
    points: list[TrendPoint]
