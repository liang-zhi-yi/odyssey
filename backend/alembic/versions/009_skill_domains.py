"""Add domain column to skills table for domain-based skill grouping.

Revision ID: 009
Revises: 008
Create Date: 2026-06-05
"""
from alembic import op
import sqlalchemy as sa

revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "skills",
        sa.Column("domain", sa.String(50), nullable=False, server_default="AI"),
    )
    op.create_index(op.f("ix_skills_domain"), "skills", ["domain"])


def downgrade():
    op.drop_index(op.f("ix_skills_domain"), table_name="skills")
    op.drop_column("skills", "domain")
