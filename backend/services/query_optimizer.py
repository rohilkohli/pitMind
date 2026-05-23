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


class QueryOptimizer:
    """Utility class for optimizing database queries."""
    
    @staticmethod
    async def batch_fetch(
        session: AsyncSession,
        model: type[T],
        ids: List[Any],
        batch_size: int = 100
    ) -> List[T]:
        """
        Fetch records in batches to avoid large IN clauses.
        
        Args:
            session: Database session
            model: SQLAlchemy model class
            ids: List of IDs to fetch
            batch_size: Number of IDs per batch
            
        Returns:
            List of model instances
        """
        import asyncio
        start_time = time.time()
        
        # We process everything using a single query and rely on the database's ability
        # to execute IN queries efficiently, removing the sequential loop overhead entirely.

        stmt = select(model).where(model.id.in_(ids))
        result = await session.execute(stmt)
        results = list(result.scalars().all())
        
        duration_ms = (time.time() - start_time) * 1000
        logger.log_database_query(
            query_type="SELECT",
            table=model.__tablename__,
            duration_ms=duration_ms,
            rows_affected=len(results)
        )
        
        return results
    
    @staticmethod
    async def count_with_cache(
        session: AsyncSession,
        model: type[T],
        filters: Optional[Dict[str, Any]] = None
    ) -> int:
        """
        Count records with optional filters.
        
        Args:
            session: Database session
            model: SQLAlchemy model class
            filters: Optional filter conditions
            
        Returns:
            Count of matching records
        """
        start_time = time.time()
        
        stmt = select(func.count()).select_from(model)
        
        if filters:
            for key, value in filters.items():
                if hasattr(model, key):
                    stmt = stmt.where(getattr(model, key) == value)
        
        result = await session.execute(stmt)
        count = result.scalar_one()
        
        duration_ms = (time.time() - start_time) * 1000
        logger.log_database_query(
            query_type="COUNT",
            table=model.__tablename__,
            duration_ms=duration_ms,
            rows_affected=count
        )
        
        return count
    
    @staticmethod
    def with_eager_loading(stmt, relationships: List[str]):
        """
        Add eager loading for relationships to avoid N+1 queries.
        
        Args:
            stmt: SQLAlchemy statement
            relationships: List of relationship names to eager load
            
        Returns:
            Statement with eager loading
        """
        for rel in relationships:
            stmt = stmt.options(selectinload(rel))
        return stmt
    
    @staticmethod
    def with_joined_loading(stmt, relationships: List[str]):
        """
        Add joined loading for relationships (use for one-to-one).
        
        Args:
            stmt: SQLAlchemy statement
            relationships: List of relationship names to join load
            
        Returns:
            Statement with joined loading
        """
        for rel in relationships:
            stmt = stmt.options(joinedload(rel))
        return stmt
    
    @staticmethod
    async def paginate(
        session: AsyncSession,
        stmt,
        page: int = 1,
        page_size: int = 50,
        max_page_size: int = 100
    ) -> Dict[str, Any]:
        """
        Paginate query results.
        
        Args:
            session: Database session
            stmt: SQLAlchemy statement
            page: Page number (1-indexed)
            page_size: Items per page
            max_page_size: Maximum allowed page size
            
        Returns:
            Dict with items, total, page, page_size, total_pages
        """
        start_time = time.time()
        
        # Validate and limit page size
        page_size = min(page_size, max_page_size)
        page = max(1, page)
        
        # Get total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await session.execute(count_stmt)
        total = total_result.scalar_one()
        
        # Calculate pagination
        total_pages = (total + page_size - 1) // page_size
        offset = (page - 1) * page_size
        
        # Get paginated results
        paginated_stmt = stmt.limit(page_size).offset(offset)
        result = await session.execute(paginated_stmt)
        items = result.scalars().all()
        
        duration_ms = (time.time() - start_time) * 1000
        logger.log_database_query(
            query_type="SELECT_PAGINATED",
            table="paginated_query",
            duration_ms=duration_ms,
            rows_affected=len(items)
        )
        
        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1
        }


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
