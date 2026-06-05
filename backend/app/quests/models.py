"""
Quest ORM model.

Quest is a capability challenge template — it has no per-user status.
All per-user tracking lives on QuestSubmission.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import QuestDifficulty, QuestType, DeliverableType
from app.database import Base


class Quest(Base):
    __tablename__ = "quests"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    title_en: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    description: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    description_en: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    skill_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("skills.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True
    )
    difficulty: Mapped[QuestDifficulty] = mapped_column(
        default=QuestDifficulty.LEVEL_1, nullable=False
    )
    quest_type: Mapped[QuestType] = mapped_column(
        default=QuestType.APPLICATION, nullable=False
    )
    expected_deliverable: Mapped[DeliverableType] = mapped_column(
        default=DeliverableType.PROMPT, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    skill: Mapped["Skill"] = relationship("Skill", back_populates="quests")
    owner: Mapped["User | None"] = relationship("User")
    submissions: Mapped[list["QuestSubmission"]] = relationship(
        "QuestSubmission", back_populates="quest", lazy="selectin"
    )
