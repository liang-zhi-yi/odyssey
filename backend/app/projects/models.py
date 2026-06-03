"""
Project ORM model.

User-created portfolio piece. Optionally linked to a passed QuestSubmission.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    description: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    github_url: Mapped[str | None] = mapped_column(
        String(2048), nullable=True
    )
    demo_url: Mapped[str | None] = mapped_column(
        String(2048), nullable=True
    )
    related_skill_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("skills.id", ondelete="SET NULL"), nullable=True
    )
    quest_submission_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("quest_submissions.id", ondelete="SET NULL"),
        nullable=True,
        comment="Must reference a submission with status PASSED.",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="projects")
    quest_submission: Mapped["QuestSubmission | None"] = relationship(
        "QuestSubmission", back_populates="projects"
    )
