"""Add goals, goal_milestones, and learning_plans tables.

Revision ID: 010
Revises: 009
Create Date: 2026-06-05
"""
from alembic import op
import sqlalchemy as sa

revision = "010"
down_revision = "009"
branch_labels = None
depends_on = None


def upgrade():
    # ── goals ──────────────────────────────────────────────────
    op.create_table(
        "goals",
        sa.Column(
            "id",
            sa.UUID(),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "user_id",
            sa.UUID(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(50), nullable=True),
        sa.Column("target_date", sa.Date(), nullable=True),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default="ACTIVE",
        ),
        sa.Column("progress_pct", sa.Integer(), server_default="0"),
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
    op.create_index("idx_goals_user_id", "goals", ["user_id"])

    # ── goal_milestones ────────────────────────────────────────
    op.create_table(
        "goal_milestones",
        sa.Column(
            "id",
            sa.UUID(),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "goal_id",
            sa.UUID(),
            sa.ForeignKey("goals.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("title_en", sa.String(300), nullable=True),
        sa.Column("is_completed", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column(
            "order_sequence", sa.Integer(), nullable=False, server_default="0"
        ),
    )
    op.create_index("idx_goal_milestones_goal_id", "goal_milestones", ["goal_id"])

    # ── learning_plans ─────────────────────────────────────────
    op.create_table(
        "learning_plans",
        sa.Column(
            "id",
            sa.UUID(),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "user_id",
            sa.UUID(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("weekly_hours", sa.Integer(), server_default="5"),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default="ACTIVE",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("idx_learning_plans_user_id", "learning_plans", ["user_id"])


def downgrade():
    op.drop_index("idx_learning_plans_user_id", table_name="learning_plans")
    op.drop_table("learning_plans")
    op.drop_index("idx_goal_milestones_goal_id", table_name="goal_milestones")
    op.drop_table("goal_milestones")
    op.drop_index("idx_goals_user_id", table_name="goals")
    op.drop_table("goals")
