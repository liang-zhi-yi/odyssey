"""Phase 5A: Extended Profile — title, location, website, social_links

Revision ID: 008
Revises: 007
Create Date: 2026-06-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("title", sa.String(100), nullable=True))
    op.add_column("users", sa.Column("location", sa.String(200), nullable=True))
    op.add_column("users", sa.Column("website", sa.String(500), nullable=True))
    op.add_column("users", sa.Column("social_links", JSONB, nullable=True))


def downgrade():
    op.drop_column("users", "social_links")
    op.drop_column("users", "website")
    op.drop_column("users", "location")
    op.drop_column("users", "title")
