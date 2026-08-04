"""Add has_seen_intro_video column to users table

Revision ID: 020
Revises: 019
Create Date: 2026-08-02
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '020'
down_revision = '019'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column('has_seen_intro_video', sa.Boolean(), nullable=False, server_default=sa.false())
    )


def downgrade() -> None:
    op.drop_column('users', 'has_seen_intro_video')
