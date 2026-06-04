"""
World, BuildingTemplate, and UserBuilding ORM models.

Phase 3 — Capability World: Each Skill maps to a Building.
Building level (1-5) derives from UserSkill.overall_score.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, UniqueConstraint, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import BuildingStatus
from app.database import Base


class BuildingTemplate(Base):
    """Blueprint that maps a Skill to a visual Building type."""

    __tablename__ = "building_templates"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    skill_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("skills.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # One template per skill
    )
    name: Mapped[str] = mapped_column(
        String(255), nullable=False
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
        String(100), default="🏛️", nullable=False
    )
    region: Mapped[str] = mapped_column(
        String(100), nullable=False
    )
    region_en: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )
    max_level: Mapped[int] = mapped_column(
        Integer, default=5, nullable=False
    )
    level_names: Mapped[dict] = mapped_column(
        JSON, nullable=False
    )
    position_x: Mapped[int] = mapped_column(
        Integer, nullable=False
    )
    position_y: Mapped[int] = mapped_column(
        Integer, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    skill: Mapped["Skill"] = relationship("Skill", back_populates="building_template")
    user_buildings: Mapped[list["UserBuilding"]] = relationship(
        "UserBuilding", back_populates="building_template", lazy="selectin"
    )


class UserBuilding(Base):
    """A user's building instance — level derived from UserSkill scores."""

    __tablename__ = "user_buildings"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    building_template_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("building_templates.id", ondelete="CASCADE"), nullable=False
    )
    level: Mapped[int] = mapped_column(
        Integer, default=1, nullable=False
    )
    status: Mapped[BuildingStatus] = mapped_column(
        default=BuildingStatus.LOCKED, nullable=False
    )
    constructed_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    upgraded_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="user_buildings")
    building_template: Mapped["BuildingTemplate"] = relationship(
        "BuildingTemplate", back_populates="user_buildings"
    )

    __table_args__ = (
        UniqueConstraint("user_id", "building_template_id", name="uq_user_building"),
    )


class World(Base):
    """One world per user — aggregates all buildings and civilization state."""

    __tablename__ = "worlds"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # One world per user
    )
    name: Mapped[str] = mapped_column(
        String(255), default="我的世界", nullable=False
    )
    civilization_level: Mapped[int] = mapped_column(
        Integer, default=1, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="world")
