"""
RaceSession model for tracking active race sessions and WebSocket connections.

This model stores information about race sessions, including their status,
metadata, and associated WebSocket connections.
"""

from datetime import datetime
from typing import Any

from sqlalchemy import String, DateTime, JSON, Integer, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column
import enum

try:
    from .database import Base
except ImportError:
    from models.database import Base


class SessionStatus(str, enum.Enum):
    """Enum for race session status."""
    PENDING = "pending"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class RaceSession(Base):
    """
    Race session model for tracking active sessions.
    
    Stores information about race sessions including their status,
    timing, and metadata. Used to coordinate WebSocket connections
    and strategy decisions across the system.
    """
    __tablename__ = "race_sessions"
    
    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    # Session identifier (unique)
    session_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
        comment="Unique identifier for the race session"
    )
    
    # Race information
    race_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        comment="Name of the race (e.g., 'Monaco Grand Prix 2024')"
    )
    
    # Timing
    start_time: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True,
        comment="When the session started"
    )
    
    end_time: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
        comment="When the session ended (null if still active)"
    )
    
    # Status
    status: Mapped[SessionStatus] = mapped_column(
        SQLEnum(SessionStatus, native_enum=False, length=20),
        nullable=False,
        default=SessionStatus.PENDING,
        index=True,
        comment="Current status of the session"
    )
    
    # Metadata (stored as JSON)
    metadata: Mapped[dict[str, Any] | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Additional session metadata (track, weather, etc.)"
    )
    
    # WebSocket connection tracking
    active_connections: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        comment="Number of active WebSocket connections"
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        comment="When the record was created"
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        comment="When the record was last updated"
    )
    
    def __repr__(self) -> str:
        return (
            f"<RaceSession(id={self.id}, session_id={self.session_id}, "
            f"race={self.race_name}, status={self.status.value}, "
            f"connections={self.active_connections})>"
        )
    
    def to_dict(self) -> dict[str, Any]:
        """
        Convert the race session to a dictionary.
        
        Returns:
            dict: Dictionary representation of the race session
        """
        return {
            "id": self.id,
            "session_id": self.session_id,
            "race_name": self.race_name,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "status": self.status.value,
            "metadata": self.metadata,
            "active_connections": self.active_connections,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
    
    @property
    def is_active(self) -> bool:
        """Check if the session is currently active."""
        return self.status == SessionStatus.ACTIVE
    
    @property
    def duration_seconds(self) -> float | None:
        """
        Calculate session duration in seconds.
        
        Returns:
            float | None: Duration in seconds, or None if session hasn't ended
        """
        if self.end_time is None:
            return None
        return (self.end_time - self.start_time).total_seconds()

# Made with Bob
