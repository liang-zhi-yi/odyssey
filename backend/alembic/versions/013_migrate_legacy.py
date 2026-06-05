"""Migrate legacy goals and paths to learning_paths.

Revision ID: 013
Revises: 012
Create Date: 2026-06-05
"""
from alembic import op

revision = "013"
down_revision = "012"
branch_labels = None
depends_on = None


def upgrade():
    # ── Phase 1: goals → learning_paths (AI_GENERATED) ──
    op.execute("""
        INSERT INTO learning_paths (
            id, user_id, title, description, category, target_date,
            status, path_type, is_official, difficulty, progress_pct,
            created_at, updated_at
        )
        SELECT
            id, user_id, title, description, category, target_date,
            status, 'AI_GENERATED', false, 1, progress_pct,
            created_at, updated_at
        FROM goals
    """)

    # ── Phase 1b: goal_milestones → learning_path_milestones ──
    op.execute("""
        INSERT INTO learning_path_milestones (
            id, learning_path_id, title, title_en,
            is_completed, completed_at, order_sequence
        )
        SELECT
            gen_random_uuid(), goal_id, title, title_en,
            is_completed, completed_at, order_sequence
        FROM goal_milestones
    """)

    # ── Phase 1c: 1 default checkpoint per goal milestone ──
    op.execute("""
        INSERT INTO path_checkpoints (
            id, milestone_id, title, title_en,
            order_sequence, required_score,
            quest_generation_status, is_completed
        )
        SELECT
            gen_random_uuid(), id, title, title_en,
            0, 60,
            'PENDING', false
        FROM learning_path_milestones
        WHERE id NOT IN (
            SELECT DISTINCT milestone_id FROM path_checkpoints
        )
    """)

    # ── Phase 2: paths (preset) → learning_paths (PRESET) ──
    op.execute("""
        INSERT INTO learning_paths (
            id, user_id, title, description, category, target_date,
            status, path_type, is_official, difficulty, progress_pct,
            path_metadata, created_at, updated_at
        )
        SELECT
            gen_random_uuid(),
            up.user_id,
            COALESCE(NULLIF(p.name_en, ''), p.name),
            COALESCE(NULLIF(p.description_en, ''), p.description),
            NULL,
            NULL,
            'ACTIVE',
            'PRESET',
            true,
            p.difficulty,
            0,
            jsonb_build_object('source_path_id', p.id::text),
            up.started_at,
            up.started_at
        FROM user_paths up
        JOIN paths p ON up.path_id = p.id
    """)

    # ── Phase 2b: path_skills → learning_path_milestones ──
    op.execute("""
        INSERT INTO learning_path_milestones (
            id, learning_path_id, title, title_en,
            skill_id,
            is_completed, completed_at, order_sequence
        )
        SELECT
            gen_random_uuid(),
            lp.id,
            COALESCE(NULLIF(s.name_en, ''), s.name, 'Milestone'),
            s.name_en,
            ps.skill_id,
            false,
            NULL,
            ps.stage_order
        FROM path_skills ps
        JOIN paths p ON ps.path_id = p.id
        JOIN learning_paths lp
            ON lp.path_metadata->>'source_path_id' = p.id::text
            AND lp.path_type = 'PRESET'
        LEFT JOIN skills s ON ps.skill_id = s.id
    """)

    # ── Phase 2c: 1 checkpoint per path-skill milestone (with required_score) ──
    op.execute("""
        INSERT INTO path_checkpoints (
            id, milestone_id, title, title_en,
            order_sequence, required_score,
            quest_generation_status, is_completed
        )
        SELECT
            gen_random_uuid(),
            lpm.id,
            lpm.title,
            lpm.title_en,
            0,
            ps.required_score,
            'PENDING',
            false
        FROM learning_path_milestones lpm
        JOIN learning_paths lp
            ON lpm.learning_path_id = lp.id
            AND lp.path_type = 'PRESET'
        JOIN path_skills ps
            ON ps.skill_id = lpm.skill_id
            AND ps.path_id::text = lp.path_metadata->>'source_path_id'
        WHERE lpm.id NOT IN (
            SELECT DISTINCT milestone_id FROM path_checkpoints
        )
    """)


def downgrade():
    """Remove migrated data from learning_paths tables."""
    op.execute("""
        DELETE FROM path_checkpoints
        WHERE milestone_id IN (
            SELECT id FROM learning_path_milestones
            WHERE learning_path_id IN (
                SELECT id FROM learning_paths
                WHERE path_type IN ('AI_GENERATED', 'PRESET')
            )
        )
    """)
    op.execute("""
        DELETE FROM learning_path_milestones
        WHERE learning_path_id IN (
            SELECT id FROM learning_paths
            WHERE path_type IN ('AI_GENERATED', 'PRESET')
        )
    """)
    op.execute("""
        DELETE FROM learning_paths
        WHERE path_type IN ('AI_GENERATED', 'PRESET')
    """)
