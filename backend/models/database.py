"""
Database configuration and session management for pitMind.

This module provides:
- SQLAlchemy async engine and session factory
- Database initialization and health checks
- Connection pooling configuration
"""

import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text

from config import get_settings

logger = logging.getLogger(__name__)

# SQLAlchemy Base class for all models
class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


# Global engine and session factory
_engine: AsyncEngine | None = None
_async_session_factory: async_sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine:
    """
    Get or create the async database engine.
    
    Returns:
        AsyncEngine: The SQLAlchemy async engine instance
    """
    global _engine
    
    if _engine is None:
        settings = get_settings()
        
        # Create async engine with connection pooling
        _engine = create_async_engine(
            settings.database_url,
            echo=False,  # Set to True for SQL query logging
            pool_size=settings.db_pool_size,
            max_overflow=settings.db_max_overflow,
            pool_timeout=settings.db_pool_timeout,
            pool_recycle=settings.db_pool_recycle,
            pool_pre_ping=True,  # Verify connections before using
            # Use NullPool for testing or if connection pooling causes issues
            # poolclass=NullPool,
        )
        logger.info(f"Database engine created with pool_size={settings.db_pool_size}")
    
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """
    Get or create the async session factory.
    
    Returns:
        async_sessionmaker: Factory for creating database sessions
    """
    global _async_session_factory
    
    if _async_session_factory is None:
        engine = get_engine()
        _async_session_factory = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autocommit=False,
            autoflush=False,
        )
        logger.info("Database session factory created")
    
    return _async_session_factory


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for FastAPI routes to get a database session.
    
    Usage:
        @app.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            result = await db.execute(select(Item))
            return result.scalars().all()
    
    Yields:
        AsyncSession: Database session that will be automatically closed
    """
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """
    Initialize the database by creating all tables.
    
    This should be called on application startup.
    Note: In production, use Alembic migrations instead.
    """
    try:
        engine = get_engine()
        async with engine.begin() as conn:
            # Create all tables defined in models
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise


async def check_db_health() -> dict[str, str | bool]:
    """
    Check database connection health.
    
    Returns:
        dict: Health status with 'status' and 'message' keys
    """
    try:
        engine = get_engine()
        async with engine.connect() as conn:
            # Execute a simple query to verify connection
            result = await conn.execute(text("SELECT 1"))
            result.fetchone()
        
        return {
            "status": "healthy",
            "connected": True,
            "message": "Database connection successful"
        }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "unhealthy",
            "connected": False,
            "message": f"Database connection failed: {str(e)}"
        }


async def close_db() -> None:
    """
    Close database connections and dispose of the engine.
    
    This should be called on application shutdown.
    """
    global _engine, _async_session_factory
    
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _async_session_factory = None
        logger.info("Database connections closed")

# Made with Bob
