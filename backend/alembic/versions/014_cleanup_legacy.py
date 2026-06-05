"""Drop legacy tables after data migration to learning_paths.

Revision ID: 014
Revises: 013
Create Date: 2026-06-05
"""
from alembic import op
import sqlalchemy as sa

revision = "014"
down_revision = "013"
branch_labels = None
depends_on = None


def upgrade():
    """Drop legacy tables: goals, goal_milestones, learning_plans,
    path_skills, user_paths, paths."""
    op.drop_table("goal_milestones")
    op.drop_table("goals")
    op.drop_table("learning_plans")
    op.drop_table("path_skills")
    op.drop_table("user_paths")
    op.drop_table("paths")


def downgrade():
    """Recreate legacy tables — structural only, no data restored."""
    # -- goals
    op.create_table(
        "goals",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True),
                  primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"),
                  nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("category", sa.String(50), nullable=True),
        sa.Column("target_date", sa.Date, nullable=True),
        sa.Column("status", sa.String(20), nullable=False,
                  server_default="ACTIVE"),
        sa.Column("progress_pct", sa.Integer, nullable=False,
                  server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
    )

    # -- goal_milestones
    op.create_table(
        "goal_milestones",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True),
                  primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("goal_id", sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("goals.id", ondelete="CASCADE"),
                  nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("title_en", sa.String(300), nullable=True),
        sa.Column("is_completed", sa.Boolean, nullable=False,
                  server_default=sa.text("false")),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("order_sequence", sa.Integer, nullable=False,
                  server_default="0"),
    )

    # -- learning_plans
    op.create_table(
        "learning_plans",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True),
                  primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"),
                  nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("weekly_hours", sa.Integer, nullable=False,
                  server_default="5"),
        sa.Column("start_date", sa.Date, nullable=True),
        sa.Column("end_date", sa.Date, nullable=True),
        sa.Column("status", sa.String(20), nullable=False,
                  server_default="ACTIVE"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
    )

    # -- paths
    op.create_table(
        "paths",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True),
                  primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(255), nullable=False, unique=True),
        sa.Column("name_en", sa.String(255), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("description_en", sa.Text, nullable=True),
        sa.Column("difficulty", sa.Integer, nullable=False,
                  server_default="1"),
        sa.Column("is_official", sa.Boolean, nullable=False,
                  server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
    )

    # -- path_skills
    op.create_table(
        "path_skills",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True),
                  primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("path_id", sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("paths.id", ondelete="CASCADE"),
                  nullable=False),
        sa.Column("skill_id", sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("skills.id", ondelete="CASCADE"),
                  nullable=False),
        sa.Column("stage_order", sa.Integer, nullable=False),
        sa.Column("required_score", sa.Integer, nullable=False,
                  server_default="60"),
        sa.UniqueConstraint("path_id", "skill_id", name="uq_path_skill"),
    )

    # -- user_paths
    op.create_table(
        "user_paths",
        sa.Column("id", sa.dialects.postgresql.UUID(as_uuid=True),
                  primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"),
                  nullable=False),
        sa.Column("path_id", sa.dialects.postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("paths.id", ondelete="CASCADE"),
                  nullable=False),
        sa.Column("status", sa.String(20), nullable=False,
                  server_default="ACTIVE"),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
