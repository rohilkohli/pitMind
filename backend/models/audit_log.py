"""
AuditLog model for persisting strategy decisions.

This model stores all strategy recommendations made by the AI system,
including confidence scores, reasoning, and telemetry snapshots.
"""

from datetime import datetime
from typing import Any

from sqlalchemy import Index, String, Float, DateTime, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column

try:
    from .database import Base
except ImportError:
    from models.database import Base


class AuditLog(Base):
    """
    Audit log for strategy decisions.
    
    Stores comprehensive information about each strategy recommendation
    made by the AI system for analysis and debugging.
    """
    __tablename__ = "audit_logs"
    
    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    # Timestamp
    timestamp: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        index=True,
        comment="When the strategy decision was made"
    )
    
    # Session information
    session_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
        comment="Unique identifier for the race session"
    )
    
    # Driver and lap information
    driver: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
        comment="Driver name or identifier"
    )
    
    lap: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
        comment="Current lap number"
    )
    
    # Strategy details
    strategy_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="Type of strategy (e.g., 'pit_stop', 'tire_change', 'fuel_save')"
    )
    
    confidence: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="Confidence score (0.0 to 1.0)"
    )
    
    reasoning: Mapped[str] = mapped_column(
        String(2000),
        nullable=True,
        comment="AI-generated reasoning for the strategy decision"
    )
    
    # Telemetry snapshot (stored as JSON)
    telemetry_snapshot: Mapped[dict[str, Any] | None] = mapped_column(
        JSON,
        nullable=True,
        comment="Snapshot of telemetry data at decision time"
    )
    
    # Additional metadata (avoid SQLAlchemy reserved name `metadata`)
    metadata_json: Mapped[dict[str, Any] | None] = mapped_column(
        "metadata",
        JSON,
        nullable=True,
        comment="Additional metadata (model version, parameters, etc.)",
    )
    
    # Indexes for efficient querying
    __table_args__ = (
        Index("idx_session_lap", "session_id", "lap"),
        Index("idx_driver_timestamp", "driver", "timestamp"),
        Index("idx_strategy_confidence", "strategy_type", "confidence"),
        # Composite index for common query pattern (session + driver queries)
        Index("idx_session_driver", "session_id", "driver", "timestamp"),
    )
    
    def __repr__(self) -> str:
        return (
            f"<AuditLog(id={self.id}, session={self.session_id}, "
            f"driver={self.driver}, lap={self.lap}, "
            f"strategy={self.strategy_type}, confidence={self.confidence:.2f})>"
        )
    
    def to_dict(self) -> dict[str, Any]:
        """
        Convert the audit log to a dictionary.
        
        Returns:
            dict: Dictionary representation of the audit log
        """
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "session_id": self.session_id,
            "driver": self.driver,
            "lap": self.lap,
            "strategy_type": self.strategy_type,
            "confidence": self.confidence,
            "reasoning": self.reasoning,
            "telemetry_snapshot": self.telemetry_snapshot,
            "metadata": self.metadata_json,
        }

# Made with Bob

# Backwards-compatible alias for code/tests that access `metadata`.
def _get_metadata(self):
    return getattr(self, "metadata_json", None)


def _set_metadata(self, value):
    setattr(self, "metadata_json", value)


setattr(AuditLog, "metadata", property(_get_metadata, _set_metadata))
