"""
Database query optimization utilities for pitMind.

Provides query optimization, batching, and performance monitoring
for database operations.
"""

from typing import Any, Dict, List, Optional, TypeVar
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload
import time

from services.logger import get_logger

logger = get_logger(__name__)

T = TypeVar('T')



class QueryCache:
    """Simple in-memory query result cache."""
    
    def __init__(self, max_size: int = 1000, ttl: int = 300):
        """
        Initialize query cache.
        
        Args:
            max_size: Maximum number of cached queries
            ttl: Time to live in seconds
        """
        self._cache: Dict[str, Dict[str, Any]] = {}
        self.max_size = max_size
        self.ttl = ttl
    
    def get(self, key: str) -> Optional[Any]:
        """Get cached query result."""
        if key in self._cache:
            entry = self._cache[key]
            if time.time() - entry["timestamp"] < self.ttl:
                logger.debug("Query cache hit", cache_key=key)
                return entry["data"]
            else:
                # Expired
                del self._cache[key]
                logger.debug("Query cache expired", cache_key=key)
        return None
    
    def set(self, key: str, data: Any):
        """Cache query result."""
        # Evict oldest if at capacity
        if len(self._cache) >= self.max_size:
            oldest_key = min(self._cache.keys(), key=lambda k: self._cache[k]["timestamp"])
            del self._cache[oldest_key]
        
        self._cache[key] = {
            "data": data,
            "timestamp": time.time()
        }
        logger.debug("Query cached", cache_key=key)
    
    def clear(self):
        """Clear all cached queries."""
        self._cache.clear()
        logger.info("Query cache cleared")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        return {
            "size": len(self._cache),
            "max_size": self.max_size,
            "ttl": self.ttl
        }


# Index recommendations for common query patterns
INDEX_RECOMMENDATIONS = {
    "audit_logs": [
        "CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);",
        "CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);",
        "CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);",
        "CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action);",
    ],
    "sessions": [
        "CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);",
        "CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);",
        "CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(user_id, expires_at) WHERE expires_at > NOW();",
    ],
    "strategies": [
        "CREATE INDEX IF NOT EXISTS idx_strategies_session_id ON strategies(session_id);",
        "CREATE INDEX IF NOT EXISTS idx_strategies_created_at ON strategies(created_at DESC);",
        "CREATE INDEX IF NOT EXISTS idx_strategies_confidence ON strategies(confidence DESC);",
    ],
    "chat_messages": [
        "CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);",
        "CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);",
        "CREATE INDEX IF NOT EXISTS idx_chat_messages_session_time ON chat_messages(session_id, created_at DESC);",
    ]
}


async def apply_index_recommendations(session: AsyncSession, table: str):
    """
    Apply recommended indexes for a table.
    
    Args:
        session: Database session
        table: Table name
    """
    if table not in INDEX_RECOMMENDATIONS:
        logger.warning("No index recommendations for table", table=table)
        return
    
    for index_sql in INDEX_RECOMMENDATIONS[table]:
        try:
            await session.execute(index_sql)
            await session.commit()
            logger.info("Applied index", table=table, sql=index_sql)
        except Exception as e:
            logger.error("Failed to apply index", table=table, sql=index_sql, exc_info=e)
            await session.rollback()

# Made with Bob
