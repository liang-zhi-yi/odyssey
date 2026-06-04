"""
User ORM model.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Text, DateTime
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
    user_paths: Mapped[list["UserPath"]] = relationship(
        "UserPath", back_populates="user", lazy="selectin"
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

    def __repr__(self) -> str:
        return f"<User {self.username}>"
