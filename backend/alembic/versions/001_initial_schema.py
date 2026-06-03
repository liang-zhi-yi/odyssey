"""Initial schema — all 13 MVP tables.

Revision ID: 001
Revises: None
Create Date: 2025-06-03
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ─────────────────────────────────────
    # 1. users
    # ─────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("username", sa.String(100), unique=True, nullable=False, index=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("avatar_url", sa.String(512), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False,
                  server_default=sa.text("now()")),
    )

    # ─────────────────────────────────────
    # 2. skills
    # ─────────────────────────────────────
    op.create_table(
        "skills",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("category", sa.String(100), nullable=False, server_default="AI"),
        sa.Column("max_score", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("created_at", sa.DateTime(), nullable=False,
                  server_default=sa.text("now()")),
    )

    # ─────────────────────────────────────
    # 3. paths
    # ─────────────────────────────────────
    op.create_table(
        "paths",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(255), unique=True, nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("difficulty", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("is_official", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False,
                  server_default=sa.text("now()")),
    )

    # ─────────────────────────────────────
    # 4. path_skills
    # ─────────────────────────────────────
    op.create_table(
        "path_skills",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("path_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("paths.id", ondelete="CASCADE"), nullable=False),
        sa.Column("skill_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("skills.id", ondelete="CASCADE"), nullable=False),
        sa.Column("stage_order", sa.Integer(), nullable=False),
        sa.Column("required_score", sa.Integer(), nullable=False, server_default="60"),
        sa.UniqueConstraint("path_id", "skill_id", name="uq_path_skill"),
    )

    # ─────────────────────────────────────
    # 5. user_paths
    # ─────────────────────────────────────
    op.create_table(
        "user_paths",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("path_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("paths.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="ACTIVE"),
        sa.Column("started_at", sa.DateTime(), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        # MVP: one ACTIVE UserPath per user (Partial Unique Index)
    )
    # Partial unique index: only one ACTIVE path per user
    op.execute("""
        CREATE UNIQUE INDEX uq_user_active_path ON user_paths (user_id)
        WHERE status = 'ACTIVE';
    """)

    # ─────────────────────────────────────
    # 6. user_skills  ⭐ most important table
    # ─────────────────────────────────────
    op.create_table(
        "user_skills",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("skill_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("skills.id", ondelete="CASCADE"), nullable=False),
        sa.Column("knowledge_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("reasoning_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("application_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("creation_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("overall_score", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("rank", sa.String(20), nullable=False, server_default="NOVICE"),
        sa.Column("last_assessed_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("user_id", "skill_id", name="uq_user_skill"),
    )

    # ─────────────────────────────────────
    # 7. quests
    # ─────────────────────────────────────
    op.create_table(
        "quests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("skill_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("skills.id", ondelete="RESTRICT"), nullable=False, index=True),
        sa.Column("difficulty", sa.String(20), nullable=False, server_default="LEVEL_1"),
        sa.Column("quest_type", sa.String(20), nullable=False, server_default="APPLICATION"),
        sa.Column("expected_deliverable", sa.String(20), nullable=False, server_default="PROMPT"),
        sa.Column("created_at", sa.DateTime(), nullable=False,
                  server_default=sa.text("now()")),
    )

    # ─────────────────────────────────────
    # 8. quest_submissions
    # ─────────────────────────────────────
    op.create_table(
        "quest_submissions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("quest_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("quests.id", ondelete="RESTRICT"), nullable=False, index=True),
        sa.Column("submission_content", sa.Text(), nullable=True),
        sa.Column("submission_url", sa.String(2048), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="ACCEPTED", index=True),
        sa.Column("submitted_at", sa.DateTime(), nullable=True),
    )

    # ─────────────────────────────────────
    # 9. assessments (1:1 with quest_submissions)
    # ─────────────────────────────────────
    op.create_table(
        "assessments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("submission_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("quest_submissions.id", ondelete="CASCADE"),
                  unique=True, nullable=False, index=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="PROCESSING"),
        sa.Column("knowledge_score", sa.Integer(), nullable=True),
        sa.Column("reasoning_score", sa.Integer(), nullable=True),
        sa.Column("application_score", sa.Integer(), nullable=True),
        sa.Column("creation_score", sa.Integer(), nullable=True),
        sa.Column("overall_score", sa.Integer(), nullable=True),
        sa.Column("feedback", sa.Text(), nullable=True),
        sa.Column("improvement_suggestions", sa.Text(), nullable=True),
        sa.Column("error_message", sa.String(512), nullable=True),
        sa.Column("assessed_at", sa.DateTime(), nullable=True),
    )

    # ─────────────────────────────────────
    # 10. progress_logs
    # ─────────────────────────────────────
    op.create_table(
        "progress_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("skill_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("skills.id", ondelete="RESTRICT"), nullable=False, index=True),
        sa.Column("previous_score", sa.Integer(), nullable=False),
        sa.Column("new_score", sa.Integer(), nullable=False),
        sa.Column("score_delta", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(512), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False,
                  server_default=sa.text("now()"), index=True),
    )

    # ─────────────────────────────────────
    # 11. credentials
    # ─────────────────────────────────────
    op.create_table(
        "credentials",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(255), unique=True, nullable=False),
        sa.Column("skill_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("skills.id", ondelete="SET NULL"), nullable=True),
        sa.Column("required_score", sa.Integer(), nullable=False, server_default="60"),
        sa.Column("description", sa.Text(), nullable=True),
    )

    # ─────────────────────────────────────
    # 12. user_credentials
    # ─────────────────────────────────────
    op.create_table(
        "user_credentials",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("credential_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("credentials.id", ondelete="CASCADE"), nullable=False),
        sa.Column("issued_at", sa.DateTime(), nullable=False,
                  server_default=sa.text("now()")),
        sa.UniqueConstraint("user_id", "credential_id", name="uq_user_credential"),
    )

    # ─────────────────────────────────────
    # 13. projects
    # ─────────────────────────────────────
    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("github_url", sa.String(2048), nullable=True),
        sa.Column("demo_url", sa.String(2048), nullable=True),
        sa.Column("related_skill_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("skills.id", ondelete="SET NULL"), nullable=True),
        sa.Column("quest_submission_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("quest_submissions.id", ondelete="SET NULL"), nullable=True,
                  comment="Must reference a submission with status PASSED."),
        sa.Column("created_at", sa.DateTime(), nullable=False,
                  server_default=sa.text("now()")),
    )


def downgrade() -> None:
    """Drop all tables in reverse dependency order."""
    op.drop_table("projects")
    op.drop_table("user_credentials")
    op.drop_table("credentials")
    op.drop_table("progress_logs")
    op.drop_table("assessments")
    op.drop_table("quest_submissions")
    op.drop_table("quests")
    op.drop_table("user_skills")
    op.execute("DROP INDEX IF EXISTS uq_user_active_path")
    op.drop_table("user_paths")
    op.drop_table("path_skills")
    op.drop_table("paths")
    op.drop_table("skills")
    op.drop_table("users")
