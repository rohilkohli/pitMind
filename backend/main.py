"""PitMind FastAPI entrypoint."""

from __future__ import annotations

import asyncio
import json
import logging
import time
import uuid
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

try:
    # When executed as a package module (e.g., `uvicorn backend.main:app`)
    from .config import cors_origin_list, get_settings
    from .models.chat import ChatRequest, ChatResponse, DebriefResponse
    from .models.strategy import StrategyRecommendation, DriverCompareRequest, DriverCompareResponse
    from .models.race_state import TelemetryPayload
    from .services import sanitize
    from .services import pipeline as pipeline_svc
    from .services import granite
    from .services.strategy_engine import predict_strategy
    from .services import redis_client
    from .services.cache_manager import get_cache_stats
    from .services.logger import get_logger, RequestIDMiddleware, PerformanceTimer
    from .middleware.error_handler import register_exception_handlers, ErrorTrackingMiddleware
    from .models import database as db
except ImportError:
    # When executed from the `backend/` directory (e.g., `uvicorn main:app`)
    from config import cors_origin_list, get_settings
    from models.chat import ChatRequest, ChatResponse, DebriefResponse
    from models.strategy import StrategyRecommendation, DriverCompareRequest, DriverCompareResponse
    from models.race_state import TelemetryPayload
    from services import sanitize
    from services import pipeline as pipeline_svc
    from services import granite
    from services.strategy_engine import predict_strategy
    from services import redis_client
    from services.cache_manager import get_cache_stats
    from services.logger import get_logger, RequestIDMiddleware, PerformanceTimer
    from middleware.error_handler import register_exception_handlers, ErrorTrackingMiddleware
    from models import database as db

try:
    # Use explicit project ID for local development if credentials aren't set
    settings = get_settings()
    firebase_admin.initialize_app(options={"projectId": settings.firebase_project_id})
except ValueError:
    pass  # App already initialized
except Exception as e:
    logging.warning(f"Firebase initialization failed: {e}")

# Initialize structured logger
logger = get_logger(__name__)

limiter = Limiter(key_func=get_remote_address)
RATE_LIMIT = f"{get_settings().rate_limit_per_minute}/minute"
app = FastAPI(title="PitMind API", version="0.1.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Register custom exception handlers
register_exception_handlers(app)

# Add middleware in correct order (last added = first executed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origin_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add request ID tracking middleware
app.add_middleware(RequestIDMiddleware)

# Add error tracking middleware
app.add_middleware(ErrorTrackingMiddleware)


# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize database and Redis connections on startup."""
    logger.info("Starting up PitMind API...")
    
    # Initialize Redis (graceful degradation if unavailable)
    redis_available = await redis_client.init_redis()
    if redis_available:
        logger.info("✓ Redis initialized successfully")
    else:
        logger.warning("⚠ Redis unavailable - running with in-memory fallback")
    
    # Initialize database (graceful degradation if unavailable)
    try:
        await db.init_db()
        db_health = await db.check_db_health()
        if db_health.get("connected"):
            logger.info("✓ Database initialized successfully")
        else:
            logger.warning("⚠ Database unavailable - audit logs will not be persisted")
    except Exception as e:
        logger.error(f"⚠ Database initialization failed: {e} - audit logs will not be persisted")
    
    logger.info("PitMind API startup complete")


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up database and Redis connections on shutdown."""
    logger.info("Shutting down PitMind API...")
    
    # Close Redis connections
    await redis_client.close_redis()
    logger.info("✓ Redis connections closed")
    
    # Close database connections
    await db.close_db()
    logger.info("✓ Database connections closed")
    
    logger.info("PitMind API shutdown complete")


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["Cache-Control"] = "no-store"
    return response


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all HTTP requests with performance metrics."""
    start_time = time.time()
    
    # Log incoming request
    logger.info(
        "Incoming request",
        method=request.method,
        path=str(request.url.path),
        query_params=dict(request.query_params),
        client_host=request.client.host if request.client else None
    )
    
    # Process request
    response = await call_next(request)
    
    # Calculate duration
    duration_ms = (time.time() - start_time) * 1000
    
    # Log completed request
    logger.log_request(
        method=request.method,
        path=str(request.url.path),
        status_code=response.status_code,
        duration_ms=duration_ms
    )
    
    return response


@app.get("/health")
async def health() -> dict[str, Any]:
    """Basic health check with Redis, database, and cache status."""
    redis_health = await redis_client.check_redis_health()
    db_health = await db.check_db_health()
    cache_stats = get_cache_stats()
    
    overall_status = "ok"
    if not redis_health.get("connected") or not db_health.get("connected"):
        overall_status = "degraded"
    
    return {
        "status": overall_status,
        "redis": redis_health,
        "database": db_health,
        "cache": {
            "hit_rate": cache_stats.hit_rate,
            "total_requests": cache_stats.total_requests,
            "hits": cache_stats.hits,
            "misses": cache_stats.misses,
        },
        **granite.get_ai_status()
    }


@app.get("/api/health")
async def api_health() -> dict[str, Any]:
    """API health check with Redis, database, and cache status."""
    redis_health = await redis_client.check_redis_health()
    db_health = await db.check_db_health()
    cache_stats = get_cache_stats()
    
    overall_status = "ok"
    if not redis_health.get("connected") or not db_health.get("connected"):
        overall_status = "degraded"
    
    return {
        "status": overall_status,
        "redis": redis_health,
        "database": db_health,
        "cache": {
            "hit_rate": cache_stats.hit_rate,
            "total_requests": cache_stats.total_requests,
            "hits": cache_stats.hits,
            "misses": cache_stats.misses,
        },
        **granite.get_ai_status()
    }


@app.get("/api/v1/metrics/health")
async def get_health_metrics() -> dict[str, Any]:
    """Get detailed system health metrics for HealthConsole."""
    ai_status = granite.get_ai_status()
    redis_health = await redis_client.check_redis_health()
    db_health = await db.check_db_health()
    cache_stats = get_cache_stats()
    
    # Get cached metrics or use defaults
    cached_metrics = await redis_client.get_cached_health_metrics()
    
    # Determine cache health status based on hit rate
    cache_status = "healthy"
    if cache_stats.total_requests > 10:  # Only evaluate if we have enough data
        if cache_stats.hit_rate < 30:
            cache_status = "degraded"
        elif cache_stats.hit_rate < 50:
            cache_status = "warning"
    
    return {
        "api": {
            "name": "API Gateway",
            "status": "healthy",
            "value": "Online",
            "lastUpdated": datetime.now().isoformat(),
        },
        "redis": {
            "name": "Redis Cache",
            "status": "healthy" if redis_health.get("connected") else "degraded",
            "value": "Connected" if redis_health.get("connected") else "Disconnected",
            "lastUpdated": datetime.now().isoformat(),
        },
        "database": {
            "name": "PostgreSQL",
            "status": "healthy" if db_health.get("connected") else "degraded",
            "value": "Connected" if db_health.get("connected") else "Disconnected",
            "lastUpdated": datetime.now().isoformat(),
        },
        "cacheHitRate": {
            "name": "Cache Hit Rate",
            "status": cache_status,
            "value": cache_stats.hit_rate,
            "unit": "%",
            "threshold": 50,
            "lastUpdated": datetime.now().isoformat(),
            "metadata": {
                "hits": cache_stats.hits,
                "misses": cache_stats.misses,
                "total_requests": cache_stats.total_requests,
            },
        },
        "latency": {
            "name": "Response Latency",
            "status": "healthy",
            "value": cached_metrics.get("latency", 142) if cached_metrics else 142,
            "unit": "ms",
            "threshold": 500,
            "lastUpdated": datetime.now().isoformat(),
        },
        "dataQuality": {
            "name": "Data Quality Score",
            "status": "healthy",
            "value": cached_metrics.get("dataQuality", 96.8) if cached_metrics else 96.8,
            "unit": "%",
            "threshold": 90,
            "lastUpdated": datetime.now().isoformat(),
        },
        "engineerApprovals": {
            "name": "Engineer Approvals",
            "status": "healthy",
            "value": cached_metrics.get("engineerApprovals", 4) if cached_metrics else 4,
            "unit": "decisions",
            "lastUpdated": datetime.now().isoformat(),
        },
        "uptime": {
            "name": "System Uptime",
            "status": "healthy",
            "value": cached_metrics.get("uptime", "4h 23m") if cached_metrics else "4h 23m",
            "lastUpdated": datetime.now().isoformat(),
        },
        "strategyCallCount": {
            "name": "Strategy Calls",
            "status": "healthy",
            "value": cached_metrics.get("strategyCallCount", 12) if cached_metrics else 12,
            "unit": "total",
            "lastUpdated": datetime.now().isoformat(),
        },
        "errorRate": {
            "name": "Error Rate",
            "status": "healthy",
            "value": cached_metrics.get("errorRate", 0.3) if cached_metrics else 0.3,
            "unit": "%",
            "threshold": 2.0,
            "lastUpdated": datetime.now().isoformat(),
        },
        "telemetryDatapoints": {
            "name": "Telemetry Points",
            "status": "healthy",
            "value": cached_metrics.get("telemetryDatapoints", 2847) if cached_metrics else 2847,
            "unit": "pts",
            "lastUpdated": datetime.now().isoformat(),
        },
        "ai": ai_status,
    }


# WebSocket connection manager
class ConnectionManager:
    """Manages WebSocket connections for real-time telemetry streaming with Redis tracking."""
    
    def __init__(self):
        # In-memory storage (always available)
        self.active_connections: dict[str, list[WebSocket]] = {}
        self.message_count: dict[str, int] = {}
        self.start_time = time.time()
        # Connection ID mapping for Redis tracking
        self.connection_ids: dict[WebSocket, str] = {}
    
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
        self.active_connections[session_id].append(websocket)
        
        # Track in Redis (graceful degradation if unavailable)
        await redis_client.add_websocket_connection(session_id, connection_id)
        
        logger.info(f"Client {connection_id} connected to session {session_id}. Active: {len(self.active_connections[session_id])}")
    
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
                if session_id in self.message_count:
                    del self.message_count[session_id]
        
        # Remove from connection ID mapping
        if websocket in self.connection_ids:
            del self.connection_ids[websocket]
        
        # Remove from Redis
        await redis_client.remove_websocket_connection(session_id, connection_id)
        
        logger.info(f"Client {connection_id} disconnected from session {session_id}")
    
    async def broadcast_telemetry(self, session_id: str, telemetry: dict[str, Any]):
        """Broadcast telemetry to all connected clients in a session."""
        if session_id in self.active_connections:
            self.message_count[session_id] += 1
            stale_connections: list[WebSocket] = []
            for connection in list(self.active_connections[session_id]):
                try:
                    await connection.send_json(telemetry)
                except Exception as e:
                    logger.error(f"Error broadcasting telemetry: {e}")
                    stale_connections.append(connection)

            if stale_connections:
                cleanup_tasks = [self.disconnect(stale, session_id) for stale in stale_connections]
                await asyncio.gather(*cleanup_tasks)
    
    async def send_to_one(self, websocket: WebSocket, message: dict[str, Any]):
        """Send a message to a single client."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Error sending message: {e}")


manager = ConnectionManager()


@app.websocket("/api/v1/stream/telemetry")
async def websocket_telemetry_stream(websocket: WebSocket, session_id: str | None = None):
    """
    WebSocket endpoint for real-time telemetry streaming.
    Handles ping/pong for latency measurement and broadcasts telemetry data.
    
    Args:
        websocket: WebSocket connection
        session_id: Session identifier from query parameter (e.g., ?session_id=race_2024_monaco)
                   Defaults to "current_race" if not provided for backward compatibility
    """
    # Extract session_id from query parameter or use default
    if not session_id:
        session_id = "current_race"
        logger.warning("No session_id provided, using default 'current_race'")
    
    # Validate session_id format (alphanumeric, underscores, hyphens only)
    if not session_id.replace("_", "").replace("-", "").isalnum():
        logger.error(f"Invalid session_id format: {session_id}")
        await websocket.close(code=1008, reason="Invalid session_id format")
        return
    
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
        
        async def receive_handler():
            try:
                while True:
                    data = await websocket.receive_text()
                    try:
                        message = json.loads(data)
                        if message.get("type") == "ping":
                            await manager.send_to_one(websocket, {
                                "type": "pong",
                                "timestamp": message.get("timestamp"),
                            })
                    except json.JSONDecodeError:
                        logger.warning(f"Invalid JSON from client: {data}")
            except WebSocketDisconnect:
                pass
            except Exception as e:
                logger.error(f"Receive handler error: {e}")

        async def broadcast_handler():
            try:
                while True:
                    await asyncio.sleep(1)
                    telemetry = {
                        "type": "telemetry",
                        "timestamp": datetime.now().isoformat(),
                        "lap": 27,
                        "driver": "demoDriverA",
                        "speed": 280 + (time.time() % 10),
                        "gear": 7,
                        "throttle": 90 + (time.time() % 10),
                        "brake": 0,
                        "tyre_compound": "soft",
                        "tyre_wear": 85.2 + (time.time() % 5),
                        "fuel": 3.4 - (time.time() % 0.5),
                        "gap_to_leader": 0.0,
                        "gap_to_p2": 1.234 + (time.time() % 0.3),
                    }
                    await manager.broadcast_telemetry(session_id, telemetry)
            except Exception as e:
                logger.error(f"Broadcast handler error: {e}")

        # Run both handlers concurrently
        await asyncio.gather(receive_handler(), broadcast_handler())
    except WebSocketDisconnect:
        await manager.disconnect(websocket, session_id)
        logger.info(f"WebSocket closed for session {session_id}")
    except Exception as e:
        await manager.disconnect(websocket, session_id)
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


try:
    from .routes import strategy, commentary, fan, auth
except ImportError:
    from routes import strategy, commentary, fan, auth

app.include_router(strategy.router)
app.include_router(commentary.router)
app.include_router(fan.router)
app.include_router(auth.router)
