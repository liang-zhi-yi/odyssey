"""
BadgeDefinition and UserBadge ORM models.

Badges are achievement-based recognition awarded when users meet
specific criteria (first quest, all dimensions >= 60, rank achieved, etc.).
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, UniqueConstraint, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class BadgeDefinition(Base):
    __tablename__ = "badge_definitions"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False
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
    icon: Mapped[str] = mapped_column(
        String(100), default="🏅", nullable=False
    )
    criteria: Mapped[dict] = mapped_column(
        JSON, nullable=False
    )
    category: Mapped[str] = mapped_column(
        String(50), default="milestone", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    user_badges: Mapped[list["UserBadge"]] = relationship(
        "UserBadge", back_populates="badge", lazy="selectin"
    )


class UserBadge(Base):
    __tablename__ = "user_badges"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    badge_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("badge_definitions.id", ondelete="CASCADE"), nullable=False
    )
    earned_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    progress_current: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )
    progress_target: Mapped[int | None] = mapped_column(
        Integer, nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="user_badges")
    badge: Mapped["BadgeDefinition"] = relationship(
        "BadgeDefinition", back_populates="user_badges"
    )

    __table_args__ = (
        UniqueConstraint("user_id", "badge_id", name="uq_user_badge"),
    )
