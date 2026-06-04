"""Add bilingual (_en) fields to Path, Quest, and Skill tables.

Revision ID: 003
Revises: 002
Create Date: 2026-06-04
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ─────────────────────────────────────
    # 1. paths: name_en, description_en
    # ─────────────────────────────────────
    op.add_column(
        "paths",
        sa.Column("name_en", sa.String(255), nullable=True),
    )
    op.add_column(
        "paths",
        sa.Column("description_en", sa.Text(), nullable=True),
    )

    # ─────────────────────────────────────
    # 2. quests: title_en, description_en
    # ─────────────────────────────────────
    op.add_column(
        "quests",
        sa.Column("title_en", sa.String(255), nullable=True),
    )
    op.add_column(
        "quests",
        sa.Column("description_en", sa.Text(), nullable=True),
    )

    # ─────────────────────────────────────
    # 3. skills: name_en, description_en
    # ─────────────────────────────────────
    op.add_column(
        "skills",
        sa.Column("name_en", sa.String(255), nullable=True),
    )
    op.add_column(
        "skills",
        sa.Column("description_en", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    # skills
    op.drop_column("skills", "description_en")
    op.drop_column("skills", "name_en")

    # quests
    op.drop_column("quests", "description_en")
    op.drop_column("quests", "title_en")

    # paths
    op.drop_column("paths", "description_en")
    op.drop_column("paths", "name_en")
