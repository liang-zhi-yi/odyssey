"""Add era, resources columns to worlds table.

Revision ID: 017
Revises: 016
Create Date: 2026-06-05
"""
from alembic import op
import sqlalchemy as sa


revision = "017"
down_revision = "016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("worlds",
        sa.Column("era", sa.String(50), nullable=False, server_default="WILDERNESS"))
    op.add_column("worlds",
        sa.Column("era_score", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("worlds",
        sa.Column("knowledge_points", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("worlds",
        sa.Column("tech_points", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("worlds",
        sa.Column("population", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("worlds",
        sa.Column("exploration_progress", sa.Integer(), nullable=False, server_default="0"))


def downgrade() -> None:
    op.drop_column("worlds", "era")
    op.drop_column("worlds", "era_score")
    op.drop_column("worlds", "knowledge_points")
    op.drop_column("worlds", "tech_points")
    op.drop_column("worlds", "population")
    op.drop_column("worlds", "exploration_progress")
