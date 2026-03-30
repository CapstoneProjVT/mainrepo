"""init

Revision ID: 0001_init
Revises:
Create Date: 2026-02-20
"""
from alembic import op
import sqlalchemy as sa

revision = '0001_init'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table('users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('is_admin', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.UniqueConstraint('email')
    )
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_table('profiles',
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), primary_key=True),
        sa.Column('skills_json', sa.JSON(), nullable=True),
        sa.Column('interests_text', sa.Text(), nullable=True),
        sa.Column('locations_json', sa.JSON(), nullable=True),
        sa.Column('grad_year', sa.Integer(), nullable=True)
    )
    op.create_table('opportunities',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('org', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('location', sa.String(255), nullable=False),
        sa.Column('tags_json', sa.JSON(), nullable=True),
        sa.Column('deadline_date', sa.Date(), nullable=True),
        sa.Column('url', sa.String(500), nullable=True),
        sa.Column('embedding_vector', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )
    op.create_table('saved_opportunities',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id')),
        sa.Column('opportunity_id', sa.Integer(), sa.ForeignKey('opportunities.id')),
        sa.Column('created_at', sa.DateTime()),
        sa.UniqueConstraint('user_id', 'opportunity_id')
    )
    op.create_table('applications',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id')),
        sa.Column('opportunity_id', sa.Integer(), sa.ForeignKey('opportunities.id'), nullable=True),
        sa.Column('title_snapshot', sa.String(255)),
        sa.Column('org_snapshot', sa.String(255)),
        sa.Column('url_snapshot', sa.String(500), nullable=True),
        sa.Column('stage', sa.Enum('Interested','Applied','OA','Interview','Offer','Rejected', name='stageenum')),
        sa.Column('notes', sa.Text()),
        sa.Column('deadline_date', sa.Date(), nullable=True),
        sa.Column('date_applied', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime()),
        sa.Column('updated_at', sa.DateTime()),
    )
    op.create_table('events',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('event_type', sa.String(100)),
        sa.Column('payload_json', sa.JSON()),
        sa.Column('created_at', sa.DateTime()),
    )
    op.create_index('ix_events_event_type', 'events', ['event_type'])
    op.create_table('relevance_ratings',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id')),
        sa.Column('opportunity_id', sa.Integer(), sa.ForeignKey('opportunities.id')),
        sa.Column('rating', sa.Integer()),
        sa.Column('created_at', sa.DateTime()),
        sa.UniqueConstraint('user_id', 'opportunity_id')
    )


def downgrade() -> None:
    op.drop_table('relevance_ratings')
    op.drop_index('ix_events_event_type', table_name='events')
    op.drop_table('events')
    op.drop_table('applications')
    op.drop_table('saved_opportunities')
    op.drop_table('opportunities')
    op.drop_table('profiles')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')
