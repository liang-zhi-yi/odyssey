"""
Notification ORM model.

Notifications are created by the system for significant user events:
credential earned, tier advance, milestone reached, assessment complete, weekly digest.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )
    title: Mapped[str] = mapped_column(
        String(200), nullable=False
    )
    title_en: Mapped[str | None] = mapped_column(
        String(200), nullable=True
    )
    body: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    body_en: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    is_read: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    link: Mapped[str | None] = mapped_column(
        String(500), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="notifications")
