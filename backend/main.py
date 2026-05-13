"""PitMind FastAPI entrypoint."""

from __future__ import annotations

import asyncio
import json
import logging
import time
from datetime import datetime
from typing import Any

from fastapi import FastAPI, File, HTTPException, Request, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import firebase_admin
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from config import cors_origin_list, get_settings

try:
    # Use explicit project ID for local development if credentials aren't set
    settings = get_settings()
    firebase_admin.initialize_app(options={"projectId": settings.firebase_project_id})
except ValueError:
    pass  # App already initialized
except Exception as e:
    logging.warning(f"Firebase initialization failed: {e}")

from models.chat import ChatRequest, ChatResponse, DebriefResponse
from models.strategy import StrategyRecommendation, DriverCompareRequest, DriverCompareResponse
from models.race_state import TelemetryPayload
from services import sanitize
from services import pipeline as pipeline_svc
from services import granite
from services.strategy_engine import predict_strategy

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)
RATE_LIMIT = f"{get_settings().rate_limit_per_minute}/minute"
app = FastAPI(title="PitMind API", version="0.1.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origin_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["Cache-Control"] = "no-store"
    return response


@app.get("/health")
async def health() -> dict[str, Any]:
    return {"status": "ok", **granite.get_ai_status()}


@app.get("/api/health")
async def api_health() -> dict[str, Any]:
    return {"status": "ok", **granite.get_ai_status()}


@app.get("/api/v1/metrics/health")
async def get_health_metrics() -> dict[str, Any]:
    """Get detailed system health metrics for HealthConsole."""
    ai_status = granite.get_ai_status()
    return {
        "api": {
            "name": "API Gateway",
            "status": "healthy",
            "value": "Online",
            "lastUpdated": datetime.now().isoformat(),
        },
        "latency": {
            "name": "Response Latency",
            "status": "healthy",
            "value": 142,
            "unit": "ms",
            "threshold": 500,
            "lastUpdated": datetime.now().isoformat(),
        },
        "dataQuality": {
            "name": "Data Quality Score",
            "status": "healthy",
            "value": 96.8,
            "unit": "%",
            "threshold": 90,
            "lastUpdated": datetime.now().isoformat(),
        },
        "engineerApprovals": {
            "name": "Engineer Approvals",
            "status": "healthy",
            "value": 4,
            "unit": "decisions",
            "lastUpdated": datetime.now().isoformat(),
        },
        "uptime": {
            "name": "System Uptime",
            "status": "healthy",
            "value": "4h 23m",
            "lastUpdated": datetime.now().isoformat(),
        },
        "strategyCallCount": {
            "name": "Strategy Calls",
            "status": "healthy",
            "value": 12,
            "unit": "total",
            "lastUpdated": datetime.now().isoformat(),
        },
        "errorRate": {
            "name": "Error Rate",
            "status": "healthy",
            "value": 0.3,
            "unit": "%",
            "threshold": 2.0,
            "lastUpdated": datetime.now().isoformat(),
        },
        "telemetryDatapoints": {
            "name": "Telemetry Points",
            "status": "healthy",
            "value": 2847,
            "unit": "pts",
            "lastUpdated": datetime.now().isoformat(),
        },
        "ai": ai_status,
    }


# WebSocket connection manager
class ConnectionManager:
    """Manages WebSocket connections for real-time telemetry streaming."""
    
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}
        self.message_count: dict[str, int] = {}
        self.start_time = time.time()
    
    async def connect(self, websocket: WebSocket, session_id: str):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
            self.message_count[session_id] = 0
        self.active_connections[session_id].append(websocket)
        logger.info(f"Client connected to session {session_id}. Active: {len(self.active_connections[session_id])}")
    
    def disconnect(self, websocket: WebSocket, session_id: str):
        """Unregister a disconnected WebSocket."""
        if session_id in self.active_connections:
            self.active_connections[session_id].remove(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
                del self.message_count[session_id]
        logger.info(f"Client disconnected from session {session_id}")
    
    async def broadcast_telemetry(self, session_id: str, telemetry: dict[str, Any]):
        """Broadcast telemetry to all connected clients in a session."""
        if session_id in self.active_connections:
            self.message_count[session_id] += 1
            for connection in self.active_connections[session_id]:
                try:
                    await connection.send_json(telemetry)
                except Exception as e:
                    logger.error(f"Error broadcasting telemetry: {e}")
    
    async def send_to_one(self, websocket: WebSocket, message: dict[str, Any]):
        """Send a message to a single client."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending message: {e}")


manager = ConnectionManager()


@app.websocket("/api/v1/stream/telemetry")
async def websocket_telemetry_stream(websocket: WebSocket):
    """
    WebSocket endpoint for real-time telemetry streaming.
    Handles ping/pong for latency measurement and broadcasts telemetry data.
    """
    session_id = "current_race"  # In production, extract from auth token
    logger.info(f"Connecting WebSocket session: {session_id}")
    await manager.connect(websocket, session_id)
    logger.info(f"WebSocket connected: {session_id}")
    
    try:
        # Generate and send initial state
        initial_telemetry = {
            "type": "telemetry",
            "timestamp": datetime.now().isoformat(),
            "lap": 27,
            "driver": "demoDriverA",
            "speed": 285,
            "gear": 7,
            "throttle": 95,
            "brake": 0,
            "tyre_compound": "soft",
            "tyre_wear": 85.2,
            "fuel": 3.4,
            "gap_to_leader": 0.0,
            "gap_to_p2": 1.234,
        }
        logger.info(f"Sending initial telemetry to {session_id}")
        await manager.send_to_one(websocket, initial_telemetry)
        logger.info(f"Initial telemetry sent to {session_id}")
        
        # Handle incoming messages and broadcast telemetry
        while True:
            # Receive client messages (heartbeat/ping)
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                
                # Handle ping - respond with pong
                if message.get("type") == "ping":
                    await manager.send_to_one(websocket, {
                        "type": "pong",
                        "timestamp": message.get("timestamp"),
                    })
                
            except json.JSONDecodeError:
                logger.warning(f"Invalid JSON from client: {data}")
                continue
            
            # Broadcast simulated telemetry every 1 second
            await asyncio.sleep(1)
            telemetry = {
                "type": "telemetry",
                "timestamp": datetime.now().isoformat(),
                "lap": 27,
                "driver": "demoDriverA",
                "speed": 280 + (time.time() % 10),  # Simulate varying speed
                "gear": 7,
                "throttle": 90 + (time.time() % 10),  # Simulate varying throttle
                "brake": 0,
                "tyre_compound": "soft",
                "tyre_wear": 85.2 + (time.time() % 5),  # Simulate wear progression
                "fuel": 3.4 - (time.time() % 0.5),  # Simulate fuel consumption
                "gap_to_leader": 0.0,
                "gap_to_p2": 1.234 + (time.time() % 0.3),  # Simulate gap changes
            }
            await manager.broadcast_telemetry(session_id, telemetry)
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)
        logger.info(f"WebSocket closed for session {session_id}")
    except Exception as e:
        manager.disconnect(websocket, session_id)
        logger.error(f"WebSocket error: {e}")


@app.get("/api/v1/events/session/{session_id}")
async def get_session_events(session_id: str) -> dict[str, Any]:
    """Get race control events for a session."""
    return {
        "session_id": session_id,
        "events": [
            {
                "id": "sc_1",
                "type": "safety_car",
                "lap": 12,
                "timestamp": datetime.now().isoformat(),
                "description": "Safety car deployed",
                "severity": "critical",
            },
            {
                "id": "pit_1",
                "type": "pit_stop",
                "lap": 15,
                "timestamp": datetime.now().isoformat(),
                "description": "P1 pit stop - Soft to Hard",
                "severity": "info",
            },
            {
                "id": "incident_1",
                "type": "incident",
                "lap": 23,
                "timestamp": datetime.now().isoformat(),
                "description": "Minor contact between P5 and P6",
                "severity": "warning",
            },
            {
                "id": "weather_1",
                "type": "weather",
                "lap": 27,
                "timestamp": datetime.now().isoformat(),
                "description": "Track temperature rising: 52°C",
                "severity": "info",
            },
        ],
    }


from routes import strategy, commentary, fan, auth

app.include_router(strategy.router)
app.include_router(commentary.router)
app.include_router(fan.router)
app.include_router(auth.router)
