"""
QuestSubmission ORM model.

Tracks per-user quest state. Created on quest acceptance.
State machine: ACCEPTED → IN_PROGRESS → SUBMITTED → ASSESSING → PASSED | FAILED
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import SubmissionStatus
from app.database import Base


class QuestSubmission(Base):
    __tablename__ = "quest_submissions"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    quest_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("quests.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    submission_content: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    submission_url: Mapped[str | None] = mapped_column(
        String(2048), nullable=True
    )
    status: Mapped[SubmissionStatus] = mapped_column(
        default=SubmissionStatus.ACCEPTED, nullable=False, index=True
    )
    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="submissions")
    quest: Mapped["Quest"] = relationship("Quest", back_populates="submissions")
    assessment: Mapped["Assessment | None"] = relationship(
        "Assessment", back_populates="submission", uselist=False, lazy="selectin"
    )
    projects: Mapped[list["Project"]] = relationship(
        "Project", back_populates="quest_submission", lazy="selectin"
    )
