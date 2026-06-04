"""
Skill and UserSkill ORM models.

UserSkill is the ⭐ most important entity in the entire system.
All features ultimately affect UserSkill.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import SkillRank
from app.database import Base


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True, index=True
    )
    name_en: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    description: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    description_en: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    category: Mapped[str] = mapped_column(
        String(100), nullable=False, default="AI"
    )
    max_score: Mapped[int] = mapped_column(
        Integer, default=100, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    path_skills: Mapped[list["PathSkill"]] = relationship(
        "PathSkill", back_populates="skill", lazy="selectin"
    )
    user_skills: Mapped[list["UserSkill"]] = relationship(
        "UserSkill", back_populates="skill", lazy="selectin"
    )
    quests: Mapped[list["Quest"]] = relationship(
        "Quest", back_populates="skill", lazy="selectin"
    )
    credentials: Mapped[list["Credential"]] = relationship(
        "Credential", back_populates="skill", lazy="selectin"
    )
    # Note: Skill → ProgressLog navigation removed to avoid circular import.
    # Query ProgressLog directly with .filter(ProgressLog.skill_id == skill_id).


class UserSkill(Base):
    """⭐ Core table — records the user's capability state for each skill.

    Four-dimension model:
      - knowledge_score   (0–100)
      - reasoning_score   (0–100)
      - application_score (0–100)
      - creation_score    (0–100)

    overall_score = K×0.2 + R×0.25 + A×0.35 + C×0.2
    rank is derived from overall_score (0-20 NOVICE, 21-40 BEGINNER, ...)
    """
    __tablename__ = "user_skills"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    skill_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("skills.id", ondelete="CASCADE"), nullable=False
    )
    knowledge_score: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    reasoning_score: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    application_score: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    creation_score: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    overall_score: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    rank: Mapped[SkillRank] = mapped_column(
        default=SkillRank.NOVICE, nullable=False
    )
    last_assessed_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="user_skills")
    skill: Mapped["Skill"] = relationship("Skill", back_populates="user_skills")

    __table_args__ = (
        UniqueConstraint("user_id", "skill_id", name="uq_user_skill"),
    )

    # ── Rank helpers ──────────────────────────────────────────────
    @staticmethod
    def compute_overall(
        knowledge: int, reasoning: int, application: int, creation: int
    ) -> int:
        return round(
            knowledge * 0.2 + reasoning * 0.25 + application * 0.35 + creation * 0.2
        )

    @staticmethod
    def compute_rank(overall: int) -> SkillRank:
        if overall <= 20:
            return SkillRank.NOVICE
        elif overall <= 40:
            return SkillRank.BEGINNER
        elif overall <= 60:
            return SkillRank.PRACTITIONER
        elif overall <= 80:
            return SkillRank.ENGINEER
        else:
            return SkillRank.ARCHITECT

    @staticmethod
    def apply_assessment(
        old: int, assessed: int, weight: float = 0.2
    ) -> int:
        """Smoothed per-dimension update: new = old×0.8 + assessed×0.2."""
        return round(old * (1 - weight) + assessed * weight)
