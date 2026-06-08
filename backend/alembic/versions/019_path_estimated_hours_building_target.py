"""Add estimated_hours to path_checkpoints and building_target_id to learning_path_milestones

Revision ID: 019
Revises: 018
Create Date: 2026-06-08
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '019'
down_revision = '018'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add estimated_hours to path_checkpoints
    op.add_column(
        'path_checkpoints',
        sa.Column('estimated_hours', sa.Integer(), nullable=False, server_default='2')
    )
    # Add building_target_id to learning_path_milestones
    op.add_column(
        'learning_path_milestones',
        sa.Column('building_target_id', postgresql.UUID(as_uuid=True), nullable=True)
    )
    op.create_foreign_key(
        'fk_milestone_building_target',
        'learning_path_milestones',
        'building_templates',
        ['building_target_id'],
        ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    op.drop_constraint('fk_milestone_building_target', 'learning_path_milestones', type_='foreignkey')
    op.drop_column('learning_path_milestones', 'building_target_id')
    op.drop_column('path_checkpoints', 'estimated_hours')
