"""
User settings ORM model — per-user LLM configuration.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class UserSettings(Base):
    """Per-user model provider configuration for assessments.

    One row per user (1:1). Any null field falls back to the global
    application settings from .env / app.config.
    """

    __tablename__ = "user_settings"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    # Provider key matching PROVIDERS dict keys (e.g. "openai", "deepseek")
    llm_provider: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    # API key — stored as plaintext for MVP.
    # TODO(production): Encrypt this field (e.g. Fernet with key derived from JWT_SECRET).
    llm_api_key: Mapped[str | None] = mapped_column(
        String(512), nullable=True
    )
    llm_base_url: Mapped[str | None] = mapped_column(
        String(512), nullable=True
    )
    llm_model: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="settings")

    def __repr__(self) -> str:
        return f"<UserSettings user={self.user_id}>"
