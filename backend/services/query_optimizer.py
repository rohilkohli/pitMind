"""Database query optimization utilities for pitMind."""

from __future__ import annotations

import time
from typing import Any, Dict, Iterable, Optional, TypeVar

from sqlalchemy import select

from services.logger import get_logger

logger = get_logger(__name__)

T = TypeVar("T")


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
            oldest_key = min(
                self._cache.keys(), key=lambda k: self._cache[k]["timestamp"]
            )
            del self._cache[oldest_key]

        self._cache[key] = {"data": data, "timestamp": time.time()}
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
            "ttl": self.ttl,
        }


# Global query cache instance
_query_cache = QueryCache()


def get_query_cache() -> QueryCache:
    """Get global query cache instance."""
    return _query_cache


def _chunked(values: list[Any], size: int) -> Iterable[list[Any]]:
    for index in range(0, len(values), size):
        yield values[index : index + size]


class QueryOptimizer:
    """Helpers for optimizing async database queries."""

    @staticmethod
    async def batch_fetch(session, model, ids: list[Any], batch_size: int = 100):
        """Fetch rows in batches to avoid oversized IN clauses."""
        if not ids:
            return []
        if batch_size <= 0:
            raise ValueError("batch_size must be greater than 0")

        identifier = getattr(model, "id", None)
        if identifier is None:
            raise AttributeError("model must define an id column")

        results = []
        for batch_ids in _chunked(ids, batch_size):
            query = select(model).where(identifier.in_(batch_ids))
            response = await session.execute(query)
            results.extend(response.scalars().all())
        return results
