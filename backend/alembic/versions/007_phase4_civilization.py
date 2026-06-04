"""Phase 4: Capability Civilization — compound buildings, world events, milestones, tier system

Revision ID: 007
Revises: 006
Create Date: 2026-06-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade():
    # 1. compound_building_templates — blueprints for multi-skill buildings
    op.create_table(
        "compound_building_templates",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("name_en", sa.String(255), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("description_en", sa.Text, nullable=True),
        sa.Column("icon", sa.String(100), nullable=False, server_default="🏛️"),
        sa.Column("region", sa.String(100), nullable=False),
        sa.Column("region_en", sa.String(100), nullable=True),
        sa.Column("max_level", sa.Integer, nullable=False, server_default="5"),
        sa.Column("level_names", JSONB, nullable=False),
        sa.Column("required_skills", JSONB, nullable=False),
        sa.Column("position_x", sa.Integer, nullable=False),
        sa.Column("position_y", sa.Integer, nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.text("now()")),
    )

    # 2. user_compound_buildings — per-user compound building instances
    op.create_table(
        "user_compound_buildings",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("compound_template_id", UUID(as_uuid=True), sa.ForeignKey("compound_building_templates.id", ondelete="CASCADE"), nullable=False),
        sa.Column("level", sa.Integer, nullable=False, server_default="1"),
        sa.Column("status", sa.String(50), nullable=False, server_default="LOCKED"),
        sa.Column("constructed_at", sa.DateTime, nullable=True),
        sa.Column("upgraded_at", sa.DateTime, nullable=True),
        sa.UniqueConstraint("user_id", "compound_template_id", name="uq_user_compound_building"),
    )

    # 3. world_events — historical log of significant events
    op.create_table(
        "world_events",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("title_en", sa.String(500), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("description_en", sa.Text, nullable=True),
        sa.Column("building_ref_id", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_world_events_user_id", "world_events", ["user_id"])

    # 4. milestone_definitions — capability milestone blueprints
    op.create_table(
        "milestone_definitions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False, unique=True),
        sa.Column("name_en", sa.String(255), nullable=True),
        sa.Column("description", sa.String(500), nullable=True),
        sa.Column("description_en", sa.String(500), nullable=True),
        sa.Column("icon", sa.String(100), nullable=False, server_default="🎯"),
        sa.Column("category", sa.String(50), nullable=False, server_default="FOUNDATION"),
        sa.Column("criteria", JSONB, nullable=False),
        sa.Column("order_sequence", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.text("now()")),
    )

    # 5. user_milestones — per-user milestone progress
    op.create_table(
        "user_milestones",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("milestone_id", UUID(as_uuid=True), sa.ForeignKey("milestone_definitions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("unlocked_at", sa.DateTime, nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("user_id", "milestone_id", name="uq_user_milestone"),
    )

    # Add tier columns to worlds table
    op.add_column("worlds", sa.Column("tier", sa.String(50), nullable=False, server_default="SETTLER"))
    op.add_column("worlds", sa.Column("tier_score", sa.Integer, nullable=False, server_default="0"))


def downgrade():
    op.drop_column("worlds", "tier_score")
    op.drop_column("worlds", "tier")
    op.drop_table("user_milestones")
    op.drop_table("milestone_definitions")
    op.drop_table("world_events")
    op.drop_index("ix_world_events_user_id", "world_events")
    op.drop_table("user_compound_buildings")
    op.drop_table("compound_building_templates")
