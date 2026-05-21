"""
Redis client for caching and session management.

This module provides:
- Redis connection pool management
- Session state storage and retrieval
- WebSocket connection tracking
- Health metrics caching
- Graceful degradation when Redis is unavailable
"""

import json
import logging
from typing import Any, Optional
from contextlib import asynccontextmanager

import redis.asyncio as redis
from redis.asyncio import Redis, ConnectionPool
from redis.exceptions import RedisError, ConnectionError, TimeoutError

from config import get_settings

logger = logging.getLogger(__name__)

# Global Redis client and connection pool
_redis_client: Optional[Redis] = None
_connection_pool: Optional[ConnectionPool] = None
_redis_available: bool = False


def get_redis_client() -> Optional[Redis]:
    """
    Get the Redis client instance.
    
    Returns:
        Redis | None: Redis client if available, None otherwise
    """
    global _redis_client
    return _redis_client


async def init_redis() -> bool:
    """
    Initialize Redis connection pool and client.
    
    Returns:
        bool: True if Redis is available, False otherwise
    """
    global _redis_client, _connection_pool, _redis_available
    
    try:
        settings = get_settings()
        
        # Create connection pool
        _connection_pool = ConnectionPool.from_url(
            settings.redis_url,
            max_connections=settings.redis_max_connections,
            socket_timeout=settings.redis_socket_timeout,
            socket_connect_timeout=settings.redis_socket_connect_timeout,
            decode_responses=True,  # Automatically decode responses to strings
            retry_on_timeout=True,
        )
        
        # Create Redis client
        _redis_client = Redis(connection_pool=_connection_pool)
        
        # Test connection
        await _redis_client.ping()
        _redis_available = True
        
        logger.info(f"Redis connected successfully: {settings.redis_url}")
        return True
        
    except (RedisError, ConnectionError, TimeoutError) as e:
        logger.warning(f"Redis connection failed: {e}. Running without Redis cache.")
        _redis_available = False
        _redis_client = None
        _connection_pool = None
        return False
    except Exception as e:
        logger.error(f"Unexpected error initializing Redis: {e}")
        _redis_available = False
        _redis_client = None
        _connection_pool = None
        return False


async def close_redis() -> None:
    """
    Close Redis connections and cleanup resources.
    
    This should be called on application shutdown.
    """
    global _redis_client, _connection_pool, _redis_available
    
    if _redis_client is not None:
        try:
            await _redis_client.close()
            logger.info("Redis connection closed")
        except Exception as e:
            logger.error(f"Error closing Redis connection: {e}")
    
    if _connection_pool is not None:
        try:
            await _connection_pool.disconnect()
        except Exception as e:
            logger.error(f"Error disconnecting Redis pool: {e}")
    
    _redis_client = None
    _connection_pool = None
    _redis_available = False


async def check_redis_health() -> dict[str, Any]:
    """
    Check Redis connection health.
    
    Returns:
        dict: Health status with 'status', 'connected', and 'message' keys
    """
    global _redis_available
    
    if not _redis_available or _redis_client is None:
        return {
            "status": "unavailable",
            "connected": False,
            "message": "Redis not initialized or unavailable"
        }
    
    try:
        await _redis_client.ping()
        return {
            "status": "healthy",
            "connected": True,
            "message": "Redis connection successful"
        }
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        _redis_available = False
        return {
            "status": "unhealthy",
            "connected": False,
            "message": f"Redis connection failed: {str(e)}"
        }


@asynccontextmanager
async def redis_operation():
    """
    Context manager for Redis operations with error handling.
    
    Usage:
        async with redis_operation() as client:
            if client:
                await client.set("key", "value")
    
    Yields:
        Redis | None: Redis client if available, None otherwise
    """
    if not _redis_available or _redis_client is None:
        yield None
        return
    
    try:
        yield _redis_client
    except (RedisError, ConnectionError, TimeoutError) as e:
        logger.warning(f"Redis operation failed: {e}")
        yield None
    except Exception as e:
        logger.error(f"Unexpected error in Redis operation: {e}")
        yield None


# Session State Management

async def set_session_state(session_id: str, state: dict[str, Any], ttl: Optional[int] = None) -> bool:
    """
    Store session state in Redis.
    
    Args:
        session_id: Unique session identifier
        state: Session state dictionary
        ttl: Time to live in seconds (None for default)
    
    Returns:
        bool: True if successful, False otherwise
    """
    async with redis_operation() as client:
        if client is None:
            logger.debug(f"Redis unavailable, cannot store session state: {session_id}")
            return False
        
        try:
            settings = get_settings()
            ttl = ttl or settings.cache_ttl_session
            
            key = f"session:{session_id}"
            value = json.dumps(state)
            
            await client.setex(key, ttl, value)
            logger.debug(f"Session state stored: {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to store session state: {e}")
            return False


async def get_session_state(session_id: str) -> Optional[dict[str, Any]]:
    """
    Retrieve session state from Redis.
    
    Args:
        session_id: Unique session identifier
    
    Returns:
        dict | None: Session state if found, None otherwise
    """
    async with redis_operation() as client:
        if client is None:
            return None
        
        try:
            key = f"session:{session_id}"
            value = await client.get(key)
            
            if value is None:
                return None
            
            return json.loads(value)
            
        except Exception as e:
            logger.error(f"Failed to retrieve session state: {e}")
            return None


async def delete_session_state(session_id: str) -> bool:
    """
    Delete session state from Redis.
    
    Args:
        session_id: Unique session identifier
    
    Returns:
        bool: True if successful, False otherwise
    """
    async with redis_operation() as client:
        if client is None:
            return False
        
        try:
            key = f"session:{session_id}"
            await client.delete(key)
            logger.debug(f"Session state deleted: {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete session state: {e}")
            return False


# WebSocket Connection Tracking

async def add_websocket_connection(session_id: str, connection_id: str) -> bool:
    """
    Track a WebSocket connection in Redis.
    
    Args:
        session_id: Race session identifier
        connection_id: Unique WebSocket connection identifier
    
    Returns:
        bool: True if successful, False otherwise
    """
    async with redis_operation() as client:
        if client is None:
            return False
        
        try:
            key = f"ws_connections:{session_id}"
            await client.sadd(key, connection_id)
            
            # Set expiry on the set
            settings = get_settings()
            await client.expire(key, settings.cache_ttl_session)
            
            logger.debug(f"WebSocket connection added: {connection_id} to session {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to add WebSocket connection: {e}")
            return False


async def remove_websocket_connection(session_id: str, connection_id: str) -> bool:
    """
    Remove a WebSocket connection from Redis.
    
    Args:
        session_id: Race session identifier
        connection_id: Unique WebSocket connection identifier
    
    Returns:
        bool: True if successful, False otherwise
    """
    async with redis_operation() as client:
        if client is None:
            return False
        
        try:
            key = f"ws_connections:{session_id}"
            await client.srem(key, connection_id)
            logger.debug(f"WebSocket connection removed: {connection_id} from session {session_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to remove WebSocket connection: {e}")
            return False


async def get_websocket_connections(session_id: str) -> set[str]:
    """
    Get all WebSocket connections for a session.
    
    Args:
        session_id: Race session identifier
    
    Returns:
        set[str]: Set of connection IDs
    """
    async with redis_operation() as client:
        if client is None:
            return set()
        
        try:
            key = f"ws_connections:{session_id}"
            connections = await client.smembers(key)
            return set(connections) if connections else set()
            
        except Exception as e:
            logger.error(f"Failed to get WebSocket connections: {e}")
            return set()


async def get_connection_count(session_id: str) -> int:
    """
    Get the number of active WebSocket connections for a session.
    
    Args:
        session_id: Race session identifier
    
    Returns:
        int: Number of active connections
    """
    async with redis_operation() as client:
        if client is None:
            return 0
        
        try:
            key = f"ws_connections:{session_id}"
            count = await client.scard(key)
            return count or 0
            
        except Exception as e:
            logger.error(f"Failed to get connection count: {e}")
            return 0


# Health Metrics Caching

async def cache_health_metrics(metrics: dict[str, Any]) -> bool:
    """
    Cache health metrics in Redis.
    
    Args:
        metrics: Health metrics dictionary
    
    Returns:
        bool: True if successful, False otherwise
    """
    async with redis_operation() as client:
        if client is None:
            return False
        
        try:
            settings = get_settings()
            key = "health:metrics"
            value = json.dumps(metrics)
            
            await client.setex(key, settings.cache_ttl_health, value)
            return True
            
        except Exception as e:
            logger.error(f"Failed to cache health metrics: {e}")
            return False


async def get_cached_health_metrics() -> Optional[dict[str, Any]]:
    """
    Retrieve cached health metrics from Redis.
    
    Returns:
        dict | None: Health metrics if found, None otherwise
    """
    async with redis_operation() as client:
        if client is None:
            return None
        
        try:
            key = "health:metrics"
            value = await client.get(key)
            
            if value is None:
                return None
            
            return json.loads(value)
            
        except Exception as e:
            logger.error(f"Failed to retrieve cached health metrics: {e}")
            return None


# Generic Cache Operations

async def cache_set(key: str, value: Any, ttl: Optional[int] = None) -> bool:
    """
    Set a value in Redis cache.
    
    Args:
        key: Cache key
        value: Value to cache (will be JSON serialized)
        ttl: Time to live in seconds (None for default)
    
    Returns:
        bool: True if successful, False otherwise
    """
    async with redis_operation() as client:
        if client is None:
            return False
        
        try:
            settings = get_settings()
            ttl = ttl or settings.cache_ttl_default
            
            serialized_value = json.dumps(value)
            await client.setex(key, ttl, serialized_value)
            return True
            
        except Exception as e:
            logger.error(f"Failed to set cache value: {e}")
            return False


async def cache_get(key: str) -> Optional[Any]:
    """
    Get a value from Redis cache.
    
    Args:
        key: Cache key
    
    Returns:
        Any | None: Cached value if found, None otherwise
    """
    async with redis_operation() as client:
        if client is None:
            return None
        
        try:
            value = await client.get(key)
            
            if value is None:
                return None
            
            return json.loads(value)
            
        except Exception as e:
            logger.error(f"Failed to get cache value: {e}")
            return None


async def cache_delete(key: str) -> bool:
    """
    Delete a value from Redis cache.
    
    Args:
        key: Cache key
    
    Returns:
        bool: True if successful, False otherwise
    """
    async with redis_operation() as client:
        if client is None:
            return False
        
        try:
            await client.delete(key)
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete cache value: {e}")
            return False

# Made with Bob
