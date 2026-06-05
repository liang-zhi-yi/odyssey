"""Add learning_paths, user_memory tables. Extend quests and user_settings.

Revision ID: 012
Revises: 011
Create Date: 2026-06-05
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "012"
down_revision = "011"
branch_labels = None
depends_on = None


def upgrade():
    # -- learning_paths
    op.create_table(
        "learning_paths",
        sa.Column("id", UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"),
                  nullable=False, index=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("category", sa.String(50), nullable=True),
        sa.Column("target_date", sa.Date, nullable=True),
        sa.Column("status", sa.String(20), nullable=False,
                  server_default="ACTIVE"),
        sa.Column("path_type", sa.String(20), nullable=False,
                  server_default="AI_GENERATED"),
        sa.Column("is_official", sa.Boolean, nullable=False,
                  server_default=sa.text("false")),
        sa.Column("difficulty", sa.Integer, nullable=False,
                  server_default="1"),
        sa.Column("progress_pct", sa.Integer, nullable=False,
                  server_default="0"),
        sa.Column("path_metadata", JSONB, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
    )

    # -- learning_path_milestones
    op.create_table(
        "learning_path_milestones",
        sa.Column("id", UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("learning_path_id", UUID(as_uuid=True),
                  sa.ForeignKey("learning_paths.id", ondelete="CASCADE"),
                  nullable=False, index=True),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("title_en", sa.String(300), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("description_en", sa.Text, nullable=True),
        sa.Column("skill_id", UUID(as_uuid=True),
                  sa.ForeignKey("skills.id", ondelete="SET NULL"),
                  nullable=True),
        sa.Column("is_completed", sa.Boolean, nullable=False,
                  server_default=sa.text("false")),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("order_sequence", sa.Integer, nullable=False,
                  server_default="0"),
    )

    # -- path_checkpoints
    op.create_table(
        "path_checkpoints",
        sa.Column("id", UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("milestone_id", UUID(as_uuid=True),
                  sa.ForeignKey("learning_path_milestones.id", ondelete="CASCADE"),
                  nullable=False, index=True),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("title_en", sa.String(300), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("description_en", sa.Text, nullable=True),
        sa.Column("order_sequence", sa.Integer, nullable=False,
                  server_default="0"),
        sa.Column("required_score", sa.Integer, nullable=False,
                  server_default="60"),
        sa.Column("quest_generation_status", sa.String(20), nullable=False,
                  server_default="PENDING"),
        sa.Column("is_completed", sa.Boolean, nullable=False,
                  server_default=sa.text("false")),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )

    # -- learning_path_quests
    op.create_table(
        "learning_path_quests",
        sa.Column("id", UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("checkpoint_id", UUID(as_uuid=True),
                  sa.ForeignKey("path_checkpoints.id", ondelete="CASCADE"),
                  nullable=False, index=True),
        sa.Column("user_id", UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"),
                  nullable=False),
        sa.Column("quest_id", UUID(as_uuid=True),
                  sa.ForeignKey("quests.id", ondelete="SET NULL"),
                  nullable=True),
        sa.Column("skill_id", UUID(as_uuid=True),
                  sa.ForeignKey("skills.id", ondelete="SET NULL"),
                  nullable=True),
        sa.Column("status", sa.String(20), nullable=False,
                  server_default="ACTIVE"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
    )

    # -- user_memory
    op.create_table(
        "user_memory",
        sa.Column("id", UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"),
                  nullable=False, index=True),
        sa.Column("memory_type", sa.String(50), nullable=False),
        sa.Column("key", sa.String(200), nullable=False),
        sa.Column("value", JSONB, nullable=False,
                  server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
    )
    op.create_index("ix_user_memory_type", "user_memory",
                    ["user_id", "memory_type"])

    # -- Extend quests: add user_id for per-user generated quests
    op.add_column("quests",
                  sa.Column("user_id", UUID(as_uuid=True),
                            sa.ForeignKey("users.id", ondelete="CASCADE"),
                            nullable=True))
    op.create_index("ix_quests_user_id", "quests", ["user_id"])

    # -- Extend user_settings: path LLM fields
    op.add_column("user_settings",
                  sa.Column("path_llm_provider", sa.String(50), nullable=True))
    op.add_column("user_settings",
                  sa.Column("path_llm_api_key", sa.String(512), nullable=True))
    op.add_column("user_settings",
                  sa.Column("path_llm_base_url", sa.String(512), nullable=True))
    op.add_column("user_settings",
                  sa.Column("path_llm_model", sa.String(255), nullable=True))


def downgrade():
    op.drop_column("user_settings", "path_llm_model")
    op.drop_column("user_settings", "path_llm_base_url")
    op.drop_column("user_settings", "path_llm_api_key")
    op.drop_column("user_settings", "path_llm_provider")
    op.drop_index("ix_quests_user_id", table_name="quests")
    op.drop_column("quests", "user_id")
    op.drop_index("ix_user_memory_type", table_name="user_memory")
    op.drop_table("user_memory")
    op.drop_table("learning_path_quests")
    op.drop_table("path_checkpoints")
    op.drop_table("learning_path_milestones")
    op.drop_table("learning_paths")
