"""Add use_path_llm_override to user_settings for unified LLM config.

Revision ID: 018
Revises: 017
Create Date: 2026-06-07
"""
from alembic import op
import sqlalchemy as sa


revision = "018"
down_revision = "017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("user_settings",
        sa.Column("use_path_llm_override", sa.Boolean(),
                  nullable=False, server_default="false"))


def downgrade() -> None:
    op.drop_column("user_settings", "use_path_llm_override")
