"""Initial schema with audit_logs and race_sessions tables

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-05-20 07:16:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create audit_logs and race_sessions tables."""
    
    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False, comment='When the strategy decision was made'),
        sa.Column('session_id', sa.String(length=255), nullable=False, comment='Unique identifier for the race session'),
        sa.Column('driver', sa.String(length=100), nullable=False, comment='Driver name or identifier'),
        sa.Column('lap', sa.Integer(), nullable=False, comment='Current lap number'),
        sa.Column('strategy_type', sa.String(length=50), nullable=False, comment='Type of strategy (e.g., pit_stop, tire_change, fuel_save)'),
        sa.Column('confidence', sa.Float(), nullable=False, comment='Confidence score (0.0 to 1.0)'),
        sa.Column('reasoning', sa.String(length=2000), nullable=True, comment='AI-generated reasoning for the strategy decision'),
        sa.Column('telemetry_snapshot', postgresql.JSON(astext_type=sa.Text()), nullable=True, comment='Snapshot of telemetry data at decision time'),
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True, comment='Additional metadata (model version, parameters, etc.)'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes for audit_logs
    op.create_index('idx_driver_timestamp', 'audit_logs', ['driver', 'timestamp'], unique=False)
    op.create_index('idx_session_lap', 'audit_logs', ['session_id', 'lap'], unique=False)
    op.create_index('idx_strategy_confidence', 'audit_logs', ['strategy_type', 'confidence'], unique=False)
    op.create_index(op.f('ix_audit_logs_driver'), 'audit_logs', ['driver'], unique=False)
    op.create_index(op.f('ix_audit_logs_lap'), 'audit_logs', ['lap'], unique=False)
    op.create_index(op.f('ix_audit_logs_session_id'), 'audit_logs', ['session_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_timestamp'), 'audit_logs', ['timestamp'], unique=False)
    
    # Create race_sessions table
    op.create_table(
        'race_sessions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('session_id', sa.String(length=255), nullable=False, comment='Unique identifier for the race session'),
        sa.Column('race_name', sa.String(length=255), nullable=False, comment='Name of the race (e.g., Monaco Grand Prix 2024)'),
        sa.Column('start_time', sa.DateTime(), nullable=False, comment='When the session started'),
        sa.Column('end_time', sa.DateTime(), nullable=True, comment='When the session ended (null if still active)'),
        sa.Column('status', sa.String(length=20), nullable=False, comment='Current status of the session'),
        sa.Column('metadata', postgresql.JSON(astext_type=sa.Text()), nullable=True, comment='Additional session metadata (track, weather, etc.)'),
        sa.Column('active_connections', sa.Integer(), nullable=False, comment='Number of active WebSocket connections'),
        sa.Column('created_at', sa.DateTime(), nullable=False, comment='When the record was created'),
        sa.Column('updated_at', sa.DateTime(), nullable=False, comment='When the record was last updated'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('session_id')
    )
    
    # Create indexes for race_sessions
    op.create_index(op.f('ix_race_sessions_session_id'), 'race_sessions', ['session_id'], unique=True)
    op.create_index(op.f('ix_race_sessions_start_time'), 'race_sessions', ['start_time'], unique=False)
    op.create_index(op.f('ix_race_sessions_status'), 'race_sessions', ['status'], unique=False)


def downgrade() -> None:
    """Drop audit_logs and race_sessions tables."""
    
    # Drop race_sessions table and indexes
    op.drop_index(op.f('ix_race_sessions_status'), table_name='race_sessions')
    op.drop_index(op.f('ix_race_sessions_start_time'), table_name='race_sessions')
    op.drop_index(op.f('ix_race_sessions_session_id'), table_name='race_sessions')
    op.drop_table('race_sessions')
    
    # Drop audit_logs table and indexes
    op.drop_index(op.f('ix_audit_logs_timestamp'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_session_id'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_lap'), table_name='audit_logs')
    op.drop_index(op.f('ix_audit_logs_driver'), table_name='audit_logs')
    op.drop_index('idx_strategy_confidence', table_name='audit_logs')
    op.drop_index('idx_session_lap', table_name='audit_logs')
    op.drop_index('idx_driver_timestamp', table_name='audit_logs')
    op.drop_table('audit_logs')

# Made with Bob
