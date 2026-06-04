"""Add badge_definitions and user_badges tables

Revision ID: 005
Revises: 004
Create Date: 2026-06-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "badge_definitions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), unique=True, nullable=False),
        sa.Column("name_en", sa.String(255), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("description_en", sa.Text, nullable=True),
        sa.Column("icon", sa.String(100), nullable=False, server_default="🏅"),
        sa.Column("criteria", JSONB, nullable=False),
        sa.Column("category", sa.String(50), nullable=False, server_default="milestone"),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.text("now()")),
    )

    op.create_table(
        "user_badges",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("badge_id", UUID(as_uuid=True), sa.ForeignKey("badge_definitions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("earned_at", sa.DateTime, nullable=False, server_default=sa.text("now()")),
        sa.Column("progress_current", sa.Integer, nullable=True),
        sa.Column("progress_target", sa.Integer, nullable=True),
        sa.UniqueConstraint("user_id", "badge_id", name="uq_user_badge"),
    )


def downgrade():
    op.drop_table("user_badges")
    op.drop_table("badge_definitions")
