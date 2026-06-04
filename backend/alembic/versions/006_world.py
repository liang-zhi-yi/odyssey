"""Add building_templates, user_buildings, and worlds tables

Revision ID: 006
Revises: 005
Create Date: 2026-06-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "building_templates",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("skill_id", UUID(as_uuid=True), sa.ForeignKey("skills.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("name_en", sa.String(255), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("description_en", sa.Text, nullable=True),
        sa.Column("icon", sa.String(100), nullable=False, server_default="🏛️"),
        sa.Column("region", sa.String(100), nullable=False),
        sa.Column("region_en", sa.String(100), nullable=True),
        sa.Column("max_level", sa.Integer, nullable=False, server_default="5"),
        sa.Column("level_names", JSONB, nullable=False),
        sa.Column("position_x", sa.Integer, nullable=False),
        sa.Column("position_y", sa.Integer, nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "user_buildings",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("building_template_id", UUID(as_uuid=True), sa.ForeignKey("building_templates.id", ondelete="CASCADE"), nullable=False),
        sa.Column("level", sa.Integer, nullable=False, server_default="1"),
        sa.Column("status", sa.String(50), nullable=False, server_default="LOCKED"),
        sa.Column("constructed_at", sa.DateTime, nullable=True),
        sa.Column("upgraded_at", sa.DateTime, nullable=True),
        sa.UniqueConstraint("user_id", "building_template_id", name="uq_user_building"),
    )

    op.create_table(
        "worlds",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("name", sa.String(255), nullable=False, server_default="我的世界"),
        sa.Column("civilization_level", sa.Integer, nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime, nullable=False, server_default=sa.text("now()")),
    )


def downgrade():
    op.drop_table("worlds")
    op.drop_table("user_buildings")
    op.drop_table("building_templates")
