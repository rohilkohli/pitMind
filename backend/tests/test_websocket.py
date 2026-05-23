"""
Tests for WebSocket functionality.

This module tests:
- WebSocket connection establishment
- WebSocket message broadcasting
- Session ID validation
- Connection cleanup
- Concurrent connections
- Redis integration for connection tracking
"""

import pytest
from unittest.mock import AsyncMock, patch
from datetime import datetime
from fastapi import WebSocket
from fastapi.testclient import TestClient

from main import app, ConnectionManager


@pytest.fixture
def mock_websocket():
    """Mock WebSocket connection."""
    mock = AsyncMock(spec=WebSocket)
    mock.accept = AsyncMock()
    mock.send_json = AsyncMock()
    mock.close = AsyncMock()
    mock.receive_text = AsyncMock()
    mock.receive_json = AsyncMock()
    return mock


@pytest.fixture
def connection_manager():
    """Create a fresh ConnectionManager instance for testing."""
    return ConnectionManager()


@pytest.fixture
def mock_redis_client():
    """Mock Redis client for WebSocket tests."""
    with patch('main.redis_client') as mock:
        mock.add_websocket_connection = AsyncMock(return_value=True)
        mock.remove_websocket_connection = AsyncMock(return_value=True)
        mock.get_websocket_connections = AsyncMock(return_value=set())
        mock.get_connection_count = AsyncMock(return_value=0)
        yield mock


class TestConnectionManager:
    """Test ConnectionManager class functionality."""
    
    @pytest.mark.asyncio
    async def test_connect_new_session(self, connection_manager, mock_websocket, mock_redis_client):
        """Test connecting to a new session."""
        session_id = "test-session-1"
        
        await connection_manager.connect(mock_websocket, session_id)
        
        # Verify WebSocket was accepted
        mock_websocket.accept.assert_called_once()
        
        # Verify session was created
        assert session_id in connection_manager.active_connections
        assert mock_websocket in connection_manager.active_connections[session_id]
        assert session_id in connection_manager.message_count
        assert connection_manager.message_count[session_id] == 0
        
        # Verify connection ID was generated
        assert mock_websocket in connection_manager.connection_ids
        
        # Verify Redis tracking was called
        mock_redis_client.add_websocket_connection.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_connect_existing_session(self, connection_manager, mock_redis_client):
        """Test connecting multiple clients to the same session."""
        session_id = "test-session-1"
        mock_ws1 = AsyncMock(spec=WebSocket)
        mock_ws1.accept = AsyncMock()
        mock_ws2 = AsyncMock(spec=WebSocket)
        mock_ws2.accept = AsyncMock()
        
        await connection_manager.connect(mock_ws1, session_id)
        await connection_manager.connect(mock_ws2, session_id)
        
        # Verify both connections are tracked
        assert len(connection_manager.active_connections[session_id]) == 2
        assert mock_ws1 in connection_manager.active_connections[session_id]
        assert mock_ws2 in connection_manager.active_connections[session_id]
    
    @pytest.mark.asyncio
    async def test_disconnect_removes_connection(self, connection_manager, mock_websocket, mock_redis_client):
        """Test disconnecting a WebSocket."""
        session_id = "test-session-1"
        
        await connection_manager.connect(mock_websocket, session_id)
        connection_manager.disconnect(mock_websocket, session_id)
        
        # Verify connection was removed
        assert session_id not in connection_manager.active_connections
        assert mock_websocket not in connection_manager.connection_ids
    
    @pytest.mark.asyncio
    async def test_disconnect_keeps_other_connections(self, connection_manager, mock_redis_client):
        """Test disconnecting one client doesn't affect others."""
        session_id = "test-session-1"
        mock_ws1 = AsyncMock(spec=WebSocket)
        mock_ws1.accept = AsyncMock()
        mock_ws2 = AsyncMock(spec=WebSocket)
        mock_ws2.accept = AsyncMock()
        
        await connection_manager.connect(mock_ws1, session_id)
        await connection_manager.connect(mock_ws2, session_id)
        
        connection_manager.disconnect(mock_ws1, session_id)
        
        # Verify only one connection remains
        assert len(connection_manager.active_connections[session_id]) == 1
        assert mock_ws2 in connection_manager.active_connections[session_id]
        assert mock_ws1 not in connection_manager.active_connections[session_id]
    
    @pytest.mark.asyncio
    async def test_broadcast_telemetry_to_all_clients(self, connection_manager, mock_redis_client):
        """Test broadcasting telemetry to all connected clients."""
        session_id = "test-session-1"
        mock_ws1 = AsyncMock(spec=WebSocket)
        mock_ws1.accept = AsyncMock()
        mock_ws1.send_json = AsyncMock()
        mock_ws2 = AsyncMock(spec=WebSocket)
        mock_ws2.accept = AsyncMock()
        mock_ws2.send_json = AsyncMock()
        
        await connection_manager.connect(mock_ws1, session_id)
        await connection_manager.connect(mock_ws2, session_id)
        
        telemetry = {
            "type": "telemetry",
            "lap": 15,
            "speed": 285,
            "timestamp": datetime.now().isoformat()
        }
        
        await connection_manager.broadcast_telemetry(session_id, telemetry)
        
        # Verify both clients received the message
        mock_ws1.send_json.assert_called_once_with(telemetry)
        mock_ws2.send_json.assert_called_once_with(telemetry)
        
        # Verify message count was incremented
        assert connection_manager.message_count[session_id] == 1
    
    @pytest.mark.asyncio
    async def test_broadcast_removes_stale_connections(self, connection_manager, mock_redis_client):
        """Test that broadcasting removes stale connections."""
        session_id = "test-session-1"
        mock_ws1 = AsyncMock(spec=WebSocket)
        mock_ws1.accept = AsyncMock()
        mock_ws1.send_json = AsyncMock(side_effect=Exception("Connection lost"))
        mock_ws2 = AsyncMock(spec=WebSocket)
        mock_ws2.accept = AsyncMock()
        mock_ws2.send_json = AsyncMock()
        
        await connection_manager.connect(mock_ws1, session_id)
        await connection_manager.connect(mock_ws2, session_id)
        
        telemetry = {"type": "telemetry", "lap": 15}
        
        await connection_manager.broadcast_telemetry(session_id, telemetry)
        
        # Verify stale connection was removed
        assert mock_ws1 not in connection_manager.active_connections[session_id]
        assert mock_ws2 in connection_manager.active_connections[session_id]
    
    @pytest.mark.asyncio
    async def test_send_to_one_client(self, connection_manager, mock_websocket):
        """Test sending a message to a single client."""
        message = {"type": "ping", "timestamp": datetime.now().isoformat()}
        
        await connection_manager.send_to_one(mock_websocket, message)
        
        mock_websocket.send_json.assert_called_once_with(message)
    
    @pytest.mark.asyncio
    async def test_send_to_one_handles_error(self, connection_manager, mock_websocket):
        """Test that send_to_one handles errors gracefully."""
        mock_websocket.send_json.side_effect = Exception("Send failed")
        message = {"type": "ping"}
        
        # Should not raise exception
        await connection_manager.send_to_one(mock_websocket, message)
    
    @pytest.mark.asyncio
    async def test_multiple_sessions_isolated(self, connection_manager, mock_redis_client):
        """Test that multiple sessions are isolated from each other."""
        session1 = "session-1"
        session2 = "session-2"
        
        mock_ws1 = AsyncMock(spec=WebSocket)
        mock_ws1.accept = AsyncMock()
        mock_ws1.send_json = AsyncMock()
        mock_ws2 = AsyncMock(spec=WebSocket)
        mock_ws2.accept = AsyncMock()
        mock_ws2.send_json = AsyncMock()
        
        await connection_manager.connect(mock_ws1, session1)
        await connection_manager.connect(mock_ws2, session2)
        
        telemetry = {"type": "telemetry", "lap": 10}
        
        # Broadcast to session1 only
        await connection_manager.broadcast_telemetry(session1, telemetry)
        
        # Verify only session1 client received the message
        mock_ws1.send_json.assert_called_once_with(telemetry)
        mock_ws2.send_json.assert_not_called()


class TestWebSocketEndpoint:
    """Test WebSocket endpoint functionality."""
    
    @pytest.mark.asyncio
    async def test_websocket_accepts_valid_session_id(self):
        """Test WebSocket accepts valid session ID."""
        with TestClient(app) as client:
            with client.websocket_connect("/api/v1/stream/telemetry?session_id=test_session_123") as websocket:
                # Should connect successfully
                data = websocket.receive_json()
                assert "type" in data
    
    @pytest.mark.asyncio
    async def test_websocket_uses_default_session_id(self):
        """Test WebSocket uses default session ID when not provided."""
        with TestClient(app) as client:
            with client.websocket_connect("/api/v1/stream/telemetry") as websocket:
                # Should connect with default session_id
                data = websocket.receive_json()
                assert "type" in data


class TestWebSocketSessionValidation:
    """Test session ID validation logic."""
    
    def test_valid_session_ids(self):
        """Test that valid session IDs are accepted."""
        valid_ids = [
            "test_session_123",
            "race-2024-monaco",
            "session123",
            "TEST_SESSION",
            "race_2024_q3",
        ]
        
        for session_id in valid_ids:
            # Alphanumeric with underscores and hyphens
            assert session_id.replace("_", "").replace("-", "").isalnum()
    
    def test_invalid_session_ids(self):
        """Test that invalid session IDs are rejected."""
        invalid_ids = [
            "session@123",
            "race!2024",
            "test session",
            "session#123",
            "race$2024",
        ]
        
        for session_id in invalid_ids:
            # Should contain invalid characters
            assert not session_id.replace("_", "").replace("-", "").isalnum()


class TestWebSocketConcurrency:
    """Test concurrent WebSocket connections."""
    
    @pytest.mark.asyncio
    async def test_concurrent_connections_same_session(self, connection_manager, mock_redis_client):
        """Test multiple concurrent connections to the same session."""
        session_id = "test-session"
        num_connections = 10
        
        websockets = []
        for i in range(num_connections):
            mock_ws = AsyncMock(spec=WebSocket)
            mock_ws.accept = AsyncMock()
            mock_ws.send_json = AsyncMock()
            websockets.append(mock_ws)
            await connection_manager.connect(mock_ws, session_id)
        
        # Verify all connections are tracked
        assert len(connection_manager.active_connections[session_id]) == num_connections
        
        # Broadcast to all
        telemetry = {"type": "telemetry", "lap": 5}
        await connection_manager.broadcast_telemetry(session_id, telemetry)
        
        # Verify all received the message
        for ws in websockets:
            ws.send_json.assert_called_once_with(telemetry)
    
    @pytest.mark.asyncio
    async def test_concurrent_connections_different_sessions(self, connection_manager, mock_redis_client):
        """Test concurrent connections to different sessions."""
        num_sessions = 5
        connections_per_session = 3
        
        for session_num in range(num_sessions):
            session_id = f"session-{session_num}"
            for conn_num in range(connections_per_session):
                mock_ws = AsyncMock(spec=WebSocket)
                mock_ws.accept = AsyncMock()
                await connection_manager.connect(mock_ws, session_id)
        
        # Verify all sessions are tracked
        assert len(connection_manager.active_connections) == num_sessions
        
        # Verify each session has correct number of connections
        for session_num in range(num_sessions):
            session_id = f"session-{session_num}"
            assert len(connection_manager.active_connections[session_id]) == connections_per_session


class TestWebSocketRedisIntegration:
    """Test WebSocket integration with Redis."""
    
    @pytest.mark.asyncio
    async def test_connection_tracked_in_redis(self, connection_manager, mock_websocket, mock_redis_client):
        """Test that connections are tracked in Redis."""
        session_id = "test-session"
        
        await connection_manager.connect(mock_websocket, session_id)
        
        # Verify Redis tracking was called
        mock_redis_client.add_websocket_connection.assert_called_once()
        call_args = mock_redis_client.add_websocket_connection.call_args
        assert call_args[0][0] == session_id
        # Connection ID should be a UUID string
        assert isinstance(call_args[0][1], str)
        assert len(call_args[0][1]) > 0
    
    @pytest.mark.asyncio
    async def test_connection_works_without_redis(self, connection_manager, mock_websocket):
        """Test that connections work even when Redis is unavailable."""
        with patch('main.redis_client') as mock_redis:
            mock_redis.add_websocket_connection = AsyncMock(return_value=False)
            
            session_id = "test-session"
            
            # Should still connect successfully
            await connection_manager.connect(mock_websocket, session_id)
            
            # Verify in-memory tracking works
            assert session_id in connection_manager.active_connections
            assert mock_websocket in connection_manager.active_connections[session_id]


class TestWebSocketMessageCount:
    """Test message counting functionality."""
    
    @pytest.mark.asyncio
    async def test_message_count_increments(self, connection_manager, mock_redis_client):
        """Test that message count increments correctly."""
        session_id = "test-session"
        mock_ws = AsyncMock(spec=WebSocket)
        mock_ws.accept = AsyncMock()
        mock_ws.send_json = AsyncMock()
        
        await connection_manager.connect(mock_ws, session_id)
        
        # Send multiple messages
        for i in range(5):
            await connection_manager.broadcast_telemetry(session_id, {"lap": i})
        
        # Verify count
        assert connection_manager.message_count[session_id] == 5
    
    @pytest.mark.asyncio
    async def test_message_count_resets_on_session_cleanup(self, connection_manager, mock_websocket, mock_redis_client):
        """Test that message count is cleaned up when session ends."""
        session_id = "test-session"
        
        await connection_manager.connect(mock_websocket, session_id)
        await connection_manager.broadcast_telemetry(session_id, {"lap": 1})
        
        connection_manager.disconnect(mock_websocket, session_id)
        
        # Verify message count was removed
        assert session_id not in connection_manager.message_count


class TestWebSocketConnectionCleanup:
    """Test connection cleanup functionality."""
    
    @pytest.mark.asyncio
    async def test_disconnect_handles_missing_connection(self, connection_manager):
        """Test disconnecting a connection that doesn't exist."""
        session_id = "test-session"
        mock_ws = AsyncMock(spec=WebSocket)
        
        # Should not raise exception
        connection_manager.disconnect(mock_ws, session_id)
    
    @pytest.mark.asyncio
    async def test_disconnect_handles_missing_session(self, connection_manager, mock_websocket):
        """Test disconnecting from a session that doesn't exist."""
        session_id = "nonexistent-session"
        
        # Should not raise exception
        connection_manager.disconnect(mock_websocket, session_id)
    
    @pytest.mark.asyncio
    async def test_broadcast_to_nonexistent_session(self, connection_manager):
        """Test broadcasting to a session with no connections."""
        session_id = "nonexistent-session"
        telemetry = {"type": "telemetry", "lap": 1}
        
        # Should not raise exception
        await connection_manager.broadcast_telemetry(session_id, telemetry)


class TestWebSocketConnectionIDs:
    """Test connection ID generation and tracking."""
    
    @pytest.mark.asyncio
    async def test_unique_connection_ids(self, connection_manager, mock_redis_client):
        """Test that each connection gets a unique ID."""
        session_id = "test-session"
        connection_ids = set()
        
        for i in range(10):
            mock_ws = AsyncMock(spec=WebSocket)
            mock_ws.accept = AsyncMock()
            await connection_manager.connect(mock_ws, session_id)
            
            conn_id = connection_manager.connection_ids[mock_ws]
            connection_ids.add(conn_id)
        
        # All IDs should be unique
        assert len(connection_ids) == 10
    
    @pytest.mark.asyncio
    async def test_connection_id_format(self, connection_manager, mock_websocket, mock_redis_client):
        """Test that connection IDs are valid UUIDs."""
        session_id = "test-session"
        
        await connection_manager.connect(mock_websocket, session_id)
        
        conn_id = connection_manager.connection_ids[mock_websocket]
        
        # Should be a valid UUID string (36 characters with hyphens)
        assert isinstance(conn_id, str)
        assert len(conn_id) == 36
        assert conn_id.count('-') == 4

# Made with Bob