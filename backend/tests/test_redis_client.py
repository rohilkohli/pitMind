"""
Tests for Redis client functionality.

This module tests:
- Redis connection and health checks
- Session state management
- WebSocket connection tracking
- Health metrics caching
- Graceful degradation when Redis unavailable
"""

import pytest
import json
from unittest.mock import AsyncMock, patch
from redis.exceptions import RedisError, ConnectionError, TimeoutError

from services import redis_client


@pytest.fixture
async def mock_redis():
    """Mock Redis client for testing."""
    mock = AsyncMock()
    mock.ping = AsyncMock(return_value=True)
    mock.setex = AsyncMock(return_value=True)
    mock.get = AsyncMock(return_value=None)
    mock.delete = AsyncMock(return_value=1)
    mock.sadd = AsyncMock(return_value=1)
    mock.srem = AsyncMock(return_value=1)
    mock.smembers = AsyncMock(return_value=set())
    mock.scard = AsyncMock(return_value=0)
    mock.expire = AsyncMock(return_value=True)
    mock.close = AsyncMock()
    return mock


@pytest.fixture
async def mock_connection_pool():
    """Mock Redis connection pool."""
    mock = AsyncMock()
    mock.disconnect = AsyncMock()
    return mock


class TestRedisInitialization:
    """Test Redis initialization and connection."""
    
    @pytest.mark.asyncio
    async def test_init_redis_success(self, mock_redis, mock_connection_pool):
        """Test successful Redis initialization."""
        with patch('backend.services.redis_client.ConnectionPool') as mock_pool_class, \
             patch('backend.services.redis_client.Redis') as mock_redis_class:
            
            mock_pool_class.from_url.return_value = mock_connection_pool
            mock_redis_class.return_value = mock_redis
            
            result = await redis_client.init_redis()
            
            assert result is True
            assert redis_client._redis_available is True
            mock_redis.ping.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_init_redis_connection_failure(self):
        """Test Redis initialization with connection failure."""
        with patch('backend.services.redis_client.ConnectionPool') as mock_pool_class:
            mock_pool_class.from_url.side_effect = ConnectionError("Connection failed")
            
            result = await redis_client.init_redis()
            
            assert result is False
            assert redis_client._redis_available is False
            assert redis_client._redis_client is None
    
    @pytest.mark.asyncio
    async def test_init_redis_timeout(self):
        """Test Redis initialization with timeout."""
        with patch('backend.services.redis_client.ConnectionPool') as mock_pool_class:
            mock_pool_class.from_url.side_effect = TimeoutError("Connection timeout")
            
            result = await redis_client.init_redis()
            
            assert result is False
            assert redis_client._redis_available is False
    
    @pytest.mark.asyncio
    async def test_close_redis(self, mock_redis, mock_connection_pool):
        """Test Redis connection cleanup."""
        redis_client._redis_client = mock_redis
        redis_client._connection_pool = mock_connection_pool
        redis_client._redis_available = True
        
        await redis_client.close_redis()
        
        mock_redis.close.assert_called_once()
        mock_connection_pool.disconnect.assert_called_once()
        assert redis_client._redis_client is None
        assert redis_client._connection_pool is None
        assert redis_client._redis_available is False


class TestRedisHealthCheck:
    """Test Redis health check functionality."""
    
    @pytest.mark.asyncio
    async def test_check_redis_health_success(self, mock_redis):
        """Test successful health check."""
        redis_client._redis_client = mock_redis
        redis_client._redis_available = True
        
        health = await redis_client.check_redis_health()
        
        assert health["status"] == "healthy"
        assert health["connected"] is True
        assert "successful" in health["message"].lower()
        mock_redis.ping.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_check_redis_health_unavailable(self):
        """Test health check when Redis is unavailable."""
        redis_client._redis_client = None
        redis_client._redis_available = False
        
        health = await redis_client.check_redis_health()
        
        assert health["status"] == "unavailable"
        assert health["connected"] is False
        assert "not initialized" in health["message"].lower()
    
    @pytest.mark.asyncio
    async def test_check_redis_health_ping_failure(self, mock_redis):
        """Test health check when ping fails."""
        mock_redis.ping.side_effect = RedisError("Ping failed")
        redis_client._redis_client = mock_redis
        redis_client._redis_available = True
        
        health = await redis_client.check_redis_health()
        
        assert health["status"] == "unhealthy"
        assert health["connected"] is False
        assert redis_client._redis_available is False


class TestSessionStateManagement:
    """Test session state storage and retrieval."""
    
    @pytest.mark.asyncio
    async def test_set_session_state_success(self, mock_redis):
        """Test storing session state."""
        redis_client._redis_client = mock_redis
        redis_client._redis_available = True
        
        session_id = "test-session-123"
        state = {"driver": "VER", "lap": 10, "strategy": "two_stop"}
        
        result = await redis_client.set_session_state(session_id, state, ttl=300)
        
        assert result is True
        mock_redis.setex.assert_called_once()
        call_args = mock_redis.setex.call_args
        assert call_args[0][0] == f"session:{session_id}"
        assert call_args[0][1] == 300
        stored_data = json.loads(call_args[0][2])
        assert stored_data == state
    
    @pytest.mark.asyncio
    async def test_set_session_state_redis_unavailable(self):
        """Test storing session state when Redis is unavailable."""
        redis_client._redis_client = None
        redis_client._redis_available = False
        
        result = await redis_client.set_session_state("test-session", {"data": "test"})
        
        assert result is False
    
    @pytest.mark.asyncio
    async def test_get_session_state_success(self, mock_redis):
        """Test retrieving session state."""
        redis_client._redis_client = mock_redis
        redis_client._redis_available = True
        
        session_id = "test-session-123"
        expected_state = {"driver": "VER", "lap": 10}
        mock_redis.get.return_value = json.dumps(expected_state)
        
        result = await redis_client.get_session_state(session_id)
        
        assert result == expected_state
        mock_redis.get.assert_called_once_with(f"session:{session_id}")
    
    @pytest.mark.asyncio
    async def test_get_session_state_not_found(self, mock_redis):
        """Test retrieving non-existent session state."""
        redis_client._redis_client = mock_redis
        redis_client._redis_available = True
        mock_redis.get.return_value = None
        
        result = await redis_client.get_session_state("nonexistent-session")
        
        assert result is None
    
    @pytest.mark.asyncio
    async def test_delete_session_state_success(self, mock_redis):
        """Test deleting session state."""
        redis_client._redis_client = mock_redis
        redis_client._redis_available = True
        
        session_id = "test-session-123"
        result = await redis_client.delete_session_state(session_id)
        
        assert result is True
        mock_redis.delete.assert_called_once_with(f"session:{session_id}")


class TestWebSocketConnectionTracking:
    """Test WebSocket connection tracking in Redis."""
    
    @pytest.mark.asyncio
    async def test_add_websocket_connection(self, mock_redis):
        """Test adding a WebSocket connection."""
        redis_client._redis_client = mock_redis
        redis_client._redis_available = True
        
        session_id = "race-session-1"
        connection_id = "ws-conn-123"
        
        result = await redis_client.add_websocket_connection(session_id, connection_id)
        
        assert result is True
        mock_redis.sadd.assert_called_once_with(f"ws_connections:{session_id}", connection_id)
        mock_redis.expire.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_remove_websocket_connection(self, mock_redis):
        """Test removing a WebSocket connection."""
        redis_client._redis_client = mock_redis
        redis_client._redis_available = True
        
        session_id = "race-session-1"
        connection_id = "ws-conn-123"
        
        result = await redis_client.remove_websocket_connection(session_id, connection_id)
        
        assert result is True
        mock_redis.srem.assert_called_once_with(f"ws_connections:{session_id}", connection_id)
    
    @pytest.mark.asyncio
    async def test_get_websocket_connections(self, mock_redis):
        """Test retrieving all WebSocket connections."""
        redis_client._redis_client = mock_redis
        redis_client._redis_available = True
        
        session_id = "race-session-1"
        expected_connections = {"ws-conn-1", "ws-conn-2", "ws-conn-3"}
        mock_redis.smembers.return_value = expected_connections
        
        result = await redis_client.get_websocket_connections(session_id)
        
        assert result == expected_connections
        mock_redis.smembers.assert_called_once_with(f"ws_connections:{session_id}")
    
    @pytest.mark.asyncio
    async def test_get_connection_count(self, mock_redis):
        """Test getting connection count."""
        redis_client._redis_client = mock_redis
        redis_client._redis_available = True
        
        session_id = "race-session-1"
        mock_redis.scard.return_value = 5
        
        result = await redis_client.get_connection_count(session_id)
        
        assert result == 5
        mock_redis.scard.assert_called_once_with(f"ws_connections:{session_id}")
    
    @pytest.mark.asyncio
    async def test_get_connection_count_redis_unavailable(self):
        """Test getting connection count when Redis is unavailable."""
        redis_client._redis_client = None
        redis_client._redis_available = False
        
        result = await redis_client.get_connection_count("race-session-1")
        
        assert result == 0


class TestHealthMetricsCaching:
    """Test health metrics caching functionality."""
    
    @pytest.mark.asyncio
    async def test_cache_health_metrics_success(self, mock_redis):
        """Test caching health metrics."""
        redis_client._redis_client = mock_redis
        redis_client._redis_available = True
        
        metrics = {
            "cpu_usage": 45.2,
            "memory_usage": 62.8,
            "active_connections": 12,
            "cache_hit_rate": 0.85
        }
        
        result = await redis_client.cache_health_metrics(metrics)
        
        assert result is True
        mock_redis.setex.assert_called_once()
        call_args = mock_redis.setex.call_args
        assert call_args[0][0] == "health:metrics"
        stored_data = json.loads(call_args[0][2])
        assert stored_data == metrics
    
    @pytest.mark.asyncio
    async def test_get_cached_health_metrics_success(self, mock_redis):
        """Test retrieving cached health metrics."""
        redis_client._redis_client = mock_redis
        redis_client._redis_available = True
        
        expected_metrics = {"cpu_usage": 45.2, "memory_usage": 62.8}
        mock_redis.get.return_value = json.dumps(expected_metrics)
        
        result = await redis_client.get_cached_health_metrics()
        
        assert result == expected_metrics
        mock_redis.get.assert_called_once_with("health:metrics")
    
    @pytest.mark.asyncio
    async def test_get_cached_health_metrics_not_found(self, mock_redis):
        """Test retrieving health metrics when cache is empty."""
        redis_client._redis_client = mock_redis
        redis_client._redis_available = True
        mock_redis.get.return_value = None
        
        result = await redis_client.get_cached_health_metrics()
        
        assert result is None


class TestGenericCacheOperations:
    """Test generic cache set/get/delete operations."""
    
    @pytest.mark.asyncio
    async def test_cache_set_success(self, mock_redis):
        """Test setting a cache value."""
        redis_client._redis_client = mock_redis
        redis_client._redis_available = True
        
        key = "test:key"
        value = {"data": "test_value", "count": 42}
        
        result = await redis_client.cache_set(key, value, ttl=600)
        
        assert result is True
        mock_redis.setex.assert_called_once()
        call_args = mock_redis.setex.call_args
        assert call_args[0][0] == key
        assert call_args[0][1] == 600
    
    @pytest.mark.asyncio
    async def test_cache_get_success(self, mock_redis):
        """Test getting a cache value."""
        redis_client._redis_client = mock_redis
        redis_client._redis_available = True
        
        key = "test:key"
        expected_value = {"data": "test_value"}
        mock_redis.get.return_value = json.dumps(expected_value)
        
        result = await redis_client.cache_get(key)
        
        assert result == expected_value
        mock_redis.get.assert_called_once_with(key)
    
    @pytest.mark.asyncio
    async def test_cache_delete_success(self, mock_redis):
        """Test deleting a cache value."""
        redis_client._redis_client = mock_redis
        redis_client._redis_available = True
        
        key = "test:key"
        result = await redis_client.cache_delete(key)
        
        assert result is True
        mock_redis.delete.assert_called_once_with(key)
    
    @pytest.mark.asyncio
    async def test_cache_operations_redis_unavailable(self):
        """Test cache operations when Redis is unavailable."""
        redis_client._redis_client = None
        redis_client._redis_available = False
        
        # All operations should return False/None gracefully
        assert await redis_client.cache_set("key", "value") is False
        assert await redis_client.cache_get("key") is None
        assert await redis_client.cache_delete("key") is False


class TestRedisOperationContextManager:
    """Test the redis_operation context manager."""
    
    @pytest.mark.asyncio
    async def test_redis_operation_success(self, mock_redis):
        """Test successful Redis operation."""
        redis_client._redis_client = mock_redis
        redis_client._redis_available = True
        
        async with redis_client.redis_operation() as client:
            assert client is mock_redis
    
    @pytest.mark.asyncio
    async def test_redis_operation_unavailable(self):
        """Test Redis operation when unavailable."""
        redis_client._redis_client = None
        redis_client._redis_available = False
        
        async with redis_client.redis_operation() as client:
            assert client is None
    
    @pytest.mark.asyncio
    async def test_redis_operation_error_handling(self, mock_redis):
        """Test error handling in Redis operation."""
        redis_client._redis_client = mock_redis
        redis_client._redis_available = True
        mock_redis.get.side_effect = RedisError("Operation failed")
        
        async with redis_client.redis_operation() as client:
            # Should yield None on error
            if client:
                try:
                    await client.get("key")
                except RedisError:
                    pass


class TestGracefulDegradation:
    """Test graceful degradation when Redis is unavailable."""
    
    @pytest.mark.asyncio
    async def test_all_operations_handle_unavailable_redis(self):
        """Test that all operations handle unavailable Redis gracefully."""
        redis_client._redis_client = None
        redis_client._redis_available = False
        
        # Session operations
        assert await redis_client.set_session_state("session", {}) is False
        assert await redis_client.get_session_state("session") is None
        assert await redis_client.delete_session_state("session") is False
        
        # WebSocket operations
        assert await redis_client.add_websocket_connection("session", "conn") is False
        assert await redis_client.remove_websocket_connection("session", "conn") is False
        assert await redis_client.get_websocket_connections("session") == set()
        assert await redis_client.get_connection_count("session") == 0
        
        # Health metrics
        assert await redis_client.cache_health_metrics({}) is False
        assert await redis_client.get_cached_health_metrics() is None
        
        # Generic cache
        assert await redis_client.cache_set("key", "value") is False
        assert await redis_client.cache_get("key") is None
        assert await redis_client.cache_delete("key") is False
    
    @pytest.mark.asyncio
    async def test_operations_continue_after_redis_failure(self, mock_redis):
        """Test that operations continue after Redis failure."""
        redis_client._redis_client = mock_redis
        redis_client._redis_available = True
        
        # Simulate Redis failure
        mock_redis.setex.side_effect = RedisError("Connection lost")
        
        # Operation should fail gracefully
        result = await redis_client.set_session_state("session", {"data": "test"})
        assert result is False
        
        # System should continue functioning
        assert redis_client._redis_client is not None

# Made with Bob