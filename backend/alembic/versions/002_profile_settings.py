"""Add User.nickname, User.github_username, and UserSettings table.

Revision ID: 002
Revises: 001
Create Date: 2025-06-04
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ─────────────────────────────────────
    # 1. Add nickname and github_username to users
    # ─────────────────────────────────────
    op.add_column(
        "users",
        sa.Column("nickname", sa.String(100), nullable=True),
    )
    op.add_column(
        "users",
        sa.Column("github_username", sa.String(100), nullable=True),
    )
    op.create_unique_constraint(
        "uq_users_github_username", "users", ["github_username"]
    )

    # ─────────────────────────────────────
    # 2. Create user_settings table (1:1 per user)
    # ─────────────────────────────────────
    op.create_table(
        "user_settings",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            unique=True,
            nullable=False,
            index=True,
        ),
        sa.Column("llm_provider", sa.String(50), nullable=True),
        sa.Column("llm_api_key", sa.String(512), nullable=True),
        sa.Column("llm_base_url", sa.String(512), nullable=True),
        sa.Column("llm_model", sa.String(255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )


def downgrade() -> None:
    """Reverse all operations from the upgrade."""
    op.drop_table("user_settings")
    op.drop_constraint("uq_users_github_username", "users", type_="unique")
    op.drop_column("users", "github_username")
    op.drop_column("users", "nickname")
