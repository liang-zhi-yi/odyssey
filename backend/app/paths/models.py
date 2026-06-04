"""
Path, PathSkill, UserPath ORM models.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Integer, String, Text, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import UserPathStatus
from app.database import Base


class Path(Base):
    __tablename__ = "paths"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True
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
    difficulty: Mapped[int] = mapped_column(
        Integer, default=1, nullable=False
    )
    is_official: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    path_skills: Mapped[list["PathSkill"]] = relationship(
        "PathSkill", back_populates="path", lazy="selectin", order_by="PathSkill.stage_order"
    )
    user_paths: Mapped[list["UserPath"]] = relationship(
        "UserPath", back_populates="path", lazy="selectin"
    )


class PathSkill(Base):
    __tablename__ = "path_skills"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    path_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("paths.id", ondelete="CASCADE"), nullable=False
    )
    skill_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("skills.id", ondelete="CASCADE"), nullable=False
    )
    stage_order: Mapped[int] = mapped_column(
        Integer, nullable=False
    )
    required_score: Mapped[int] = mapped_column(
        Integer, default=60, nullable=False
    )

    # Relationships
    path: Mapped["Path"] = relationship("Path", back_populates="path_skills")
    skill: Mapped["Skill"] = relationship("Skill", back_populates="path_skills")

    __table_args__ = (
        UniqueConstraint("path_id", "skill_id", name="uq_path_skill"),
    )


class UserPath(Base):
    __tablename__ = "user_paths"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    path_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("paths.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[UserPathStatus] = mapped_column(
        default=UserPathStatus.ACTIVE, nullable=False
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="user_paths")
    path: Mapped["Path"] = relationship("Path", back_populates="user_paths")

    # MVP: one ACTIVE UserPath per user.
    # Enforced by a partial unique index created in the migration (001_initial_schema.py):
    #   CREATE UNIQUE INDEX uq_user_active_path ON user_paths (user_id) WHERE status = 'ACTIVE';
    # A model-level UniqueConstraint cannot express a partial index, so it is omitted here.
