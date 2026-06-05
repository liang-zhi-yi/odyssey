"""
LearningPath, LearningPathMilestone, PathCheckpoint, LearningPathQuest, and UserMemory ORM models.

LearningPath = unified goals + paths. AI generates milestones + checkpoints.
PathCheckpoint = fine-grained level within a milestone, auto-generates quests.
UserMemory = per-user memory bank for LLM personalization.
"""
from __future__ import annotations

import uuid
from datetime import date, datetime, timezone

from sqlalchemy import (
    Integer, String, Text, Date, DateTime, Boolean, ForeignKey,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class LearningPath(Base):
    """Unified goals + paths -- AI-generated or preset learning trajectory."""

    __tablename__ = "learning_paths"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)
    target_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="ACTIVE"
    )
    path_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="AI_GENERATED"
    )
    is_official: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    difficulty: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    progress_pct: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    path_metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="learning_paths")
    milestones: Mapped[list["LearningPathMilestone"]] = relationship(
        "LearningPathMilestone", back_populates="learning_path",
        lazy="selectin", order_by="LearningPathMilestone.order_sequence",
        cascade="all, delete-orphan",
    )


class LearningPathMilestone(Base):
    """A major milestone/node within a learning path. Can be linked to a skill."""

    __tablename__ = "learning_path_milestones"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    learning_path_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("learning_paths.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    title_en: Mapped[str | None] = mapped_column(String(300), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    description_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    skill_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("skills.id", ondelete="SET NULL"),
        nullable=True,
    )
    is_completed: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    order_sequence: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )

    # Relationships
    learning_path: Mapped["LearningPath"] = relationship(
        "LearningPath", back_populates="milestones"
    )
    skill: Mapped["Skill | None"] = relationship("Skill")
    checkpoints: Mapped[list["PathCheckpoint"]] = relationship(
        "PathCheckpoint", back_populates="milestone",
        lazy="selectin", order_by="PathCheckpoint.order_sequence",
        cascade="all, delete-orphan",
    )


class PathCheckpoint(Base):
    """Fine-grained checkpoint/level within a milestone. Generates quests via LLM."""

    __tablename__ = "path_checkpoints"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    milestone_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("learning_path_milestones.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    title_en: Mapped[str | None] = mapped_column(String(300), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    description_en: Mapped[str | None] = mapped_column(Text, nullable=True)
    order_sequence: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    required_score: Mapped[int] = mapped_column(
        Integer, default=60, nullable=False
    )
    quest_generation_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="PENDING"
    )
    is_completed: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )

    # Relationships
    milestone: Mapped["LearningPathMilestone"] = relationship(
        "LearningPathMilestone", back_populates="checkpoints"
    )
    generated_quests: Mapped[list["LearningPathQuest"]] = relationship(
        "LearningPathQuest", back_populates="checkpoint",
        lazy="selectin", cascade="all, delete-orphan",
    )


class LearningPathQuest(Base):
    """Links a generated quest to a path checkpoint + user + skill."""

    __tablename__ = "learning_path_quests"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    checkpoint_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("path_checkpoints.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    quest_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("quests.id", ondelete="SET NULL"),
        nullable=True,
    )
    skill_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("skills.id", ondelete="SET NULL"),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="ACTIVE"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    checkpoint: Mapped["PathCheckpoint"] = relationship(
        "PathCheckpoint", back_populates="generated_quests"
    )
    quest: Mapped["Quest | None"] = relationship("Quest")


class UserMemory(Base):
    """Per-user memory bank for LLM personalization -- preferences, habits, style."""

    __tablename__ = "user_memory"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    memory_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )
    key: Mapped[str] = mapped_column(String(200), nullable=False)
    value: Mapped[dict] = mapped_column(
        JSONB, nullable=False, default=dict
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
