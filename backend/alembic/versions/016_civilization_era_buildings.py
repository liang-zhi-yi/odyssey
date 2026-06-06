"""Add civilization_type, era columns to building templates + expand to 10-level.

Revision ID: 016
Revises: 015
Create Date: 2026-06-05
"""
from alembic import op
import sqlalchemy as sa


revision = "016"
down_revision = "015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add civilization_type and era to building_templates
    op.add_column("building_templates",
        sa.Column("civilization_type", sa.String(50), nullable=True))
    op.add_column("building_templates",
        sa.Column("era", sa.String(50), nullable=True))
    # Change max_level default from 5 to 10
    op.alter_column("building_templates", "max_level",
        existing_type=sa.Integer(), existing_nullable=False, server_default="10")

    # Add same columns to compound_building_templates
    op.add_column("compound_building_templates",
        sa.Column("civilization_type", sa.String(50), nullable=True))
    op.add_column("compound_building_templates",
        sa.Column("era", sa.String(50), nullable=True))
    # Change max_level default from 5 to 10
    op.alter_column("compound_building_templates", "max_level",
        existing_type=sa.Integer(), existing_nullable=False, server_default="10")


def downgrade() -> None:
    op.drop_column("building_templates", "civilization_type")
    op.drop_column("building_templates", "era")
    op.alter_column("building_templates", "max_level",
        existing_type=sa.Integer(), existing_nullable=False, server_default="5")

    op.drop_column("compound_building_templates", "civilization_type")
    op.drop_column("compound_building_templates", "era")
    op.alter_column("compound_building_templates", "max_level",
        existing_type=sa.Integer(), existing_nullable=False, server_default="5")
