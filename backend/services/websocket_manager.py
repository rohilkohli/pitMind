"""WebSocket connection manager service for real-time telemetry streaming."""

import time
import uuid
from datetime import datetime
from typing import Any

from fastapi import WebSocket

try:
    from ..services import redis_client
    from ..services.logger import get_logger
except ImportError:
    from services import redis_client
    from services.logger import get_logger

logger = get_logger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections for real-time telemetry streaming.
    
    Features:
    - In-memory connection tracking
    - Redis-backed session tracking for distributed deployments
    - Message sequence numbers for ordering guarantees
    - Automatic stale connection cleanup
    """

    def __init__(self):
        # In-memory storage (always available)
        self.active_connections: dict[str, list[WebSocket]] = {}
        self.message_count: dict[str, int] = {}
        self.start_time = time.time()
        # Connection ID mapping for Redis tracking
        self.connection_ids: dict[WebSocket, str] = {}
        # Message sequence numbers for ordering guarantee
        self.sequence_numbers: dict[str, int] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()

        # Generate unique connection ID
        connection_id = str(uuid.uuid4())
        self.connection_ids[websocket] = connection_id

        # Store in memory
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
            self.message_count[session_id] = 0
            self.sequence_numbers[session_id] = 0
        self.active_connections[session_id].append(websocket)

        # Track in Redis (graceful degradation if unavailable)
        await redis_client.add_websocket_connection(session_id, connection_id)

        logger.info(
            f"WebSocket connected",
            connection_id=connection_id,
            session_id=session_id,
            active_count=len(self.active_connections[session_id])
        )

    async def disconnect(self, websocket: WebSocket, session_id: str):
        """Unregister a disconnected WebSocket."""
        # Get connection ID
        connection_id = self.connection_ids.get(websocket, "unknown")

        # Remove from memory
        if session_id in self.active_connections:
            try:
                self.active_connections[session_id].remove(websocket)
            except ValueError:
                pass
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
                del self.message_count[session_id]
                if session_id in self.sequence_numbers:
                    del self.sequence_numbers[session_id]

        # Remove from connection ID mapping
        if websocket in self.connection_ids:
            del self.connection_ids[websocket]

        # Remove from Redis
        await redis_client.remove_websocket_connection(session_id, connection_id)

        logger.info(
            f"WebSocket disconnected",
            connection_id=connection_id,
            session_id=session_id
        )

    async def broadcast_telemetry(self, session_id: str, telemetry: dict[str, Any]):
        """
        Broadcast telemetry to all connected clients in a session.

        Adds sequence number and server timestamp to ensure clients can
        detect and reorder out-of-sequence messages.
        """
        if session_id in self.active_connections:
            self.message_count[session_id] += 1

            # Increment sequence number for this session
            if session_id not in self.sequence_numbers:
                self.sequence_numbers[session_id] = 0
            self.sequence_numbers[session_id] += 1

            # Add sequence number and server timestamp to message
            telemetry["sequence"] = self.sequence_numbers[session_id]
            telemetry["server_timestamp"] = datetime.now().isoformat()

            stale_connections: list[WebSocket] = []
            for connection in list(self.active_connections[session_id]):
                try:
                    await connection.send_json(telemetry)
                except Exception as e:
                    logger.error(f"Error broadcasting telemetry: {e}")
                    stale_connections.append(connection)

            # Clean up stale connections
            for stale in stale_connections:
                await self.disconnect(stale, session_id)

    async def send_to_one(self, websocket: WebSocket, message: dict[str, Any]):
        """Send a message to a single client."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending message: {e}")

    def get_connection_count(self, session_id: str) -> int:
        """Get the number of active connections for a session."""
        return len(self.active_connections.get(session_id, []))

    def get_total_connections(self) -> int:
        """Get the total number of active connections across all sessions."""
        return sum(len(conns) for conns in self.active_connections.values())

    def get_session_stats(self, session_id: str) -> dict[str, Any]:
        """Get statistics for a specific session."""
        return {
            "active_connections": self.get_connection_count(session_id),
            "messages_sent": self.message_count.get(session_id, 0),
            "current_sequence": self.sequence_numbers.get(session_id, 0),
        }
