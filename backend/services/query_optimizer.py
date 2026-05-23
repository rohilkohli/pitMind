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


# Global query cache instance
_query_cache = QueryCache()


def get_query_cache() -> QueryCache:
    """Get global query cache instance."""
    return _query_cache

# Made with Bob
