"""
World, BuildingTemplate, UserBuilding, CompoundBuildingTemplate,
UserCompoundBuilding, WorldEvent, MilestoneDefinition, UserMilestone ORM models.

Phase 3 — Capability World: Each Skill maps to a Building.
Phase 4 — Capability Civilization: Compound buildings, events, milestones, tier system.
Building level (1-5) derives from UserSkill.overall_score.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Integer, String, Text, DateTime, ForeignKey, UniqueConstraint, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.enums import BuildingStatus, MilestoneCategory
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
    civilization_type: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    era: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    max_level: Mapped[int] = mapped_column(
        Integer, default=10, nullable=False
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
    tier: Mapped[str] = mapped_column(
        String(50), default="SETTLER", nullable=False
    )
    tier_score: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    era: Mapped[str] = mapped_column(
        String(50), default="WILDERNESS", nullable=False
    )
    era_score: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    knowledge_points: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    tech_points: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    population: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    exploration_progress: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
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


# ---------------------------------------------------------------------------
# Phase 4 — Compound Buildings, Events, Milestones
# ---------------------------------------------------------------------------

class CompoundBuildingTemplate(Base):
    """Blueprint for a building that requires multiple skills at minimum levels."""

    __tablename__ = "compound_building_templates"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
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
    civilization_type: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    era: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    max_level: Mapped[int] = mapped_column(
        Integer, default=10, nullable=False
    )
    level_names: Mapped[dict] = mapped_column(
        JSON, nullable=False
    )
    required_skills: Mapped[list] = mapped_column(
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
    user_compound_buildings: Mapped[list["UserCompoundBuilding"]] = relationship(
        "UserCompoundBuilding", back_populates="compound_template", lazy="selectin"
    )


class UserCompoundBuilding(Base):
    """A user's compound building instance — level derived from min of source skills."""

    __tablename__ = "user_compound_buildings"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    compound_template_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("compound_building_templates.id", ondelete="CASCADE"), nullable=False
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
    user: Mapped["User"] = relationship("User", back_populates="user_compound_buildings")
    compound_template: Mapped["CompoundBuildingTemplate"] = relationship(
        "CompoundBuildingTemplate", back_populates="user_compound_buildings"
    )

    __table_args__ = (
        UniqueConstraint("user_id", "compound_template_id", name="uq_user_compound_building"),
    )


class WorldEvent(Base):
    """Historical log of significant world events (upgrades, unlocks, milestones)."""

    __tablename__ = "world_events"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    event_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )
    title: Mapped[str] = mapped_column(
        String(500), nullable=False
    )
    title_en: Mapped[str | None] = mapped_column(
        String(500), nullable=True
    )
    description: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    description_en: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )
    building_ref_id: Mapped[uuid.UUID | None] = mapped_column(
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="world_events")

    __table_args__ = (
        Index("ix_world_events_user_id", "user_id"),
    )


class MilestoneDefinition(Base):
    """Blueprint for a capability milestone — progressive achievement checkpoint."""

    __tablename__ = "milestone_definitions"

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
        String(500), nullable=True
    )
    description_en: Mapped[str | None] = mapped_column(
        String(500), nullable=True
    )
    icon: Mapped[str] = mapped_column(
        String(100), default="🎯", nullable=False
    )
    category: Mapped[MilestoneCategory] = mapped_column(
        String(50), default=MilestoneCategory.FOUNDATION, nullable=False
    )
    criteria: Mapped[dict] = mapped_column(
        JSON, nullable=False
    )
    order_sequence: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    user_milestones: Mapped[list["UserMilestone"]] = relationship(
        "UserMilestone", back_populates="milestone", lazy="selectin"
    )


class UserMilestone(Base):
    """A user's earned milestone record."""

    __tablename__ = "user_milestones"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    milestone_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("milestone_definitions.id", ondelete="CASCADE"), nullable=False
    )
    unlocked_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="user_milestones")
    milestone: Mapped["MilestoneDefinition"] = relationship(
        "MilestoneDefinition", back_populates="user_milestones"
    )

    __table_args__ = (
        UniqueConstraint("user_id", "milestone_id", name="uq_user_milestone"),
    )
