"""
Credential and UserCredential ORM models.

Credentials are unlocked when all four dimensions of a skill reach >= 60.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Credential(Base):
    __tablename__ = "credentials"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True
    )
    skill_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("skills.id", ondelete="SET NULL"), nullable=True
    )
    required_score: Mapped[int] = mapped_column(
        Integer, default=60, nullable=False
    )
    description: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )

    # Relationships
    skill: Mapped["Skill | None"] = relationship("Skill", back_populates="credentials")
    user_credentials: Mapped[list["UserCredential"]] = relationship(
        "UserCredential", back_populates="credential", lazy="selectin"
    )


class UserCredential(Base):
    __tablename__ = "user_credentials"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    credential_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("credentials.id", ondelete="CASCADE"), nullable=False
    )
    issued_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="user_credentials")
    credential: Mapped["Credential"] = relationship(
        "Credential", back_populates="user_credentials"
    )

    __table_args__ = (
        UniqueConstraint("user_id", "credential_id", name="uq_user_credential"),
    )
