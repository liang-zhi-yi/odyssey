"""
User ORM model.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    username: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    password_hash: Mapped[str] = mapped_column(
        String(255), nullable=False
    )
    avatar_url: Mapped[str | None] = mapped_column(
        String(512), nullable=True
    )
    bio: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    nickname: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    github_username: Mapped[str | None] = mapped_column(
        String(100), nullable=True, unique=True
    )
    title: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    location: Mapped[str | None] = mapped_column(
        String(200), nullable=True
    )
    website: Mapped[str | None] = mapped_column(
        String(500), nullable=True
    )
    social_links: Mapped[dict | list | None] = mapped_column(
        JSON, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    settings: Mapped["UserSettings | None"] = relationship(
        "UserSettings", back_populates="user", uselist=False, lazy="selectin"
    )
    user_skills: Mapped[list["UserSkill"]] = relationship(
        "UserSkill", back_populates="user", lazy="selectin"
    )
    submissions: Mapped[list["QuestSubmission"]] = relationship(
        "QuestSubmission", back_populates="user", lazy="selectin"
    )
    progress_logs: Mapped[list["ProgressLog"]] = relationship(
        "ProgressLog", back_populates="user", lazy="selectin"
    )
    user_credentials: Mapped[list["UserCredential"]] = relationship(
        "UserCredential", back_populates="user", lazy="selectin"
    )
    projects: Mapped[list["Project"]] = relationship(
        "Project", back_populates="user", lazy="selectin"
    )
    user_badges: Mapped[list["UserBadge"]] = relationship(
        "UserBadge", back_populates="user", lazy="selectin"
    )
    user_buildings: Mapped[list["UserBuilding"]] = relationship(
        "UserBuilding", back_populates="user", lazy="selectin"
    )
    world: Mapped["World | None"] = relationship(
        "World", back_populates="user", uselist=False, lazy="selectin"
    )
    user_compound_buildings: Mapped[list["UserCompoundBuilding"]] = relationship(
        "UserCompoundBuilding", back_populates="user", lazy="selectin"
    )
    world_events: Mapped[list["WorldEvent"]] = relationship(
        "WorldEvent", back_populates="user", lazy="selectin"
    )
    user_milestones: Mapped[list["UserMilestone"]] = relationship(
        "UserMilestone", back_populates="user", lazy="selectin"
    )
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification", back_populates="user", lazy="selectin"
    )
    learning_paths: Mapped[list["LearningPath"]] = relationship(
        "LearningPath", back_populates="user", lazy="selectin"
    )
    memory_entries: Mapped[list["UserMemory"]] = relationship(
        "UserMemory", lazy="selectin"
    )
    conversations: Mapped[list["ConversationHistory"]] = relationship(
        "ConversationHistory", back_populates="user", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<User {self.username}>"
