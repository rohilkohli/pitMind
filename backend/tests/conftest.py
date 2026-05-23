"""
Shared pytest fixtures and configuration for backend tests.

This module provides reusable fixtures for:
- Mock Redis clients
- Mock database sessions
- Mock WebSocket connections
- Sample telemetry data
- Test configuration
"""

import pytest
import asyncio
from typing import Generator
from unittest.mock import AsyncMock, MagicMock

from backend.models.race_state import LapPoint, TelemetryPayload


# ============================================================================
# Pytest Configuration
# ============================================================================

@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# ============================================================================
# Sample Data Fixtures
# ============================================================================

@pytest.fixture
def sample_lap_points() -> list[LapPoint]:
    """Create sample lap points for testing."""
    laps = []
    for i in range(1, 21):
        laps.append(
            LapPoint(
                lap=i,
                lap_time_s=82.0 + i * 0.1,
                sector1_s=27.0,
                sector2_s=28.0,
                sector3_s=27.0,
                tyre_wear_pct=50.0 + i * 1.5,
                tyre_compound="SOFT",
                fuel_kg=100 - i * 1.5,
                gap_ahead_s=1.0 + (i % 4) * 0.05,
                gap_behind_s=1.5,
            )
        )
    return laps


@pytest.fixture
def sample_telemetry_payload(sample_lap_points) -> TelemetryPayload:
    """Create a sample telemetry payload for testing."""
    return TelemetryPayload(
        circuit="Monza",
        session_label="R",
        driver="VER",
        laps=sample_lap_points
    )


@pytest.fixture
def high_wear_telemetry_payload() -> TelemetryPayload:
    """Create telemetry payload with high tire wear."""
    laps = []
    for i in range(1, 21):
        laps.append(
            LapPoint(
                lap=i,
                lap_time_s=82.0 + i * 0.25,  # Increasing lap times
                sector1_s=27.0,
                sector2_s=28.0,
                sector3_s=27.0,
                tyre_wear_pct=min(95.0, 72.0 + i * 1.2),  # High wear
                tyre_compound="SOFT",
                fuel_kg=100 - i * 1.5,
                gap_ahead_s=1.0,
                gap_behind_s=1.5,
            )
        )
    return TelemetryPayload(
        circuit="Monza",
        session_label="R",
        driver="VER",
        laps=laps
    )


@pytest.fixture
def low_wear_telemetry_payload() -> TelemetryPayload:
    """Create telemetry payload with low tire wear."""
    laps = []
    for i in range(1, 21):
        laps.append(
            LapPoint(
                lap=i,
                lap_time_s=82.0 + i * 0.01,  # Stable lap times
                sector1_s=27.0,
                sector2_s=28.0,
                sector3_s=27.0,
                tyre_wear_pct=30.0 + i * 0.5,  # Low wear
                tyre_compound="HARD",
                fuel_kg=100 - i * 1.5,
                gap_ahead_s=1.0,
                gap_behind_s=1.5,
            )
        )
    return TelemetryPayload(
        circuit="Monaco",
        session_label="R",
        driver="HAM",
        laps=laps
    )


# ============================================================================
# Mock Redis Fixtures
# ============================================================================

@pytest.fixture
def mock_redis_client():
    """Create a mock Redis client for testing."""
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
def mock_redis_connection_pool():
    """Create a mock Redis connection pool."""
    mock = AsyncMock()
    mock.disconnect = AsyncMock()
    return mock


# ============================================================================
# Mock Database Fixtures
# ============================================================================

@pytest.fixture
def mock_db_session():
    """Create a mock database session for testing."""
    mock = AsyncMock()
    mock.add = MagicMock()
    mock.commit = AsyncMock()
    mock.rollback = AsyncMock()
    mock.close = AsyncMock()
    mock.execute = AsyncMock()
    mock.refresh = AsyncMock()
    mock.delete = AsyncMock()
    mock.flush = AsyncMock()
    return mock


@pytest.fixture
def mock_db_engine():
    """Create a mock database engine."""
    mock = AsyncMock()
    mock.dispose = AsyncMock()
    mock.begin = AsyncMock()
    mock.connect = AsyncMock()
    return mock


# ============================================================================
# Mock WebSocket Fixtures
# ============================================================================

@pytest.fixture
def mock_websocket():
    """Create a mock WebSocket connection."""
    mock = AsyncMock()
    mock.accept = AsyncMock()
    mock.send_json = AsyncMock()
    mock.send_text = AsyncMock()
    mock.receive_json = AsyncMock()
    mock.receive_text = AsyncMock()
    mock.close = AsyncMock()
    return mock


@pytest.fixture
def multiple_mock_websockets():
    """Create multiple mock WebSocket connections for testing."""
    websockets = []
    for i in range(5):
        mock = AsyncMock()
        mock.accept = AsyncMock()
        mock.send_json = AsyncMock()
        mock.send_text = AsyncMock()
        mock.receive_json = AsyncMock()
        mock.receive_text = AsyncMock()
        mock.close = AsyncMock()
        websockets.append(mock)
    return websockets


# ============================================================================
# Test Configuration Fixtures
# ============================================================================

@pytest.fixture
def test_session_id() -> str:
    """Provide a test session ID."""
    return "test-session-123"


@pytest.fixture
def test_driver_name() -> str:
    """Provide a test driver name."""
    return "VER"


@pytest.fixture
def test_circuit_name() -> str:
    """Provide a test circuit name."""
    return "Monza"


# ============================================================================
# Mock Strategy Response Fixtures
# ============================================================================

@pytest.fixture
def mock_strategy_scores():
    """Create mock strategy scores."""
    mock = MagicMock()
    mock.pit_urgency = 75.0
    mock.sc_probability_next_3_laps = 45.0
    mock.overtake_risk = 60.0
    mock.recommended_window_laps = (28, 31)
    return mock


@pytest.fixture
def mock_strategy_response(mock_strategy_scores):
    """Create a complete mock strategy response."""
    return (
        mock_strategy_scores,
        ["High tire wear detected", "Optimal pit window approaching"],
        {
            "circuit": "Monza",
            "driver": "VER",
            "current_lap": 27,
            "wear": 75.5,
            "degradation": 0.25,
            "suggested_compound": "MEDIUM"
        }
    )


# ============================================================================
# Mock Health Check Fixtures
# ============================================================================

@pytest.fixture
def mock_redis_health_healthy():
    """Mock healthy Redis health check response."""
    return {
        "status": "healthy",
        "connected": True,
        "message": "Redis connection successful"
    }


@pytest.fixture
def mock_redis_health_unavailable():
    """Mock unavailable Redis health check response."""
    return {
        "status": "unavailable",
        "connected": False,
        "message": "Redis not initialized or unavailable"
    }


@pytest.fixture
def mock_db_health_healthy():
    """Mock healthy database health check response."""
    return {
        "status": "healthy",
        "connected": True,
        "message": "Database connection successful"
    }


@pytest.fixture
def mock_db_health_unavailable():
    """Mock unavailable database health check response."""
    return {
        "status": "unhealthy",
        "connected": False,
        "message": "Database connection failed"
    }


# ============================================================================
# Mock Cache Fixtures
# ============================================================================

@pytest.fixture
def mock_cache_stats():
    """Create mock cache statistics."""
    mock = MagicMock()
    mock.hit_rate = 75.5
    mock.total_requests = 100
    mock.hits = 75
    mock.misses = 25
    return mock


# ============================================================================
# Cleanup Fixtures
# ============================================================================

@pytest.fixture(autouse=True)
async def cleanup_after_test():
    """Cleanup after each test."""
    yield
    # Cleanup code here if needed
    await asyncio.sleep(0)  # Allow pending tasks to complete


# ============================================================================
# Marker Fixtures
# ============================================================================

def pytest_configure(config):
    """Configure custom pytest markers."""
    config.addinivalue_line(
        "markers", "unit: mark test as a unit test"
    )
    config.addinivalue_line(
        "markers", "integration: mark test as an integration test"
    )
    config.addinivalue_line(
        "markers", "performance: mark test as a performance test"
    )
    config.addinivalue_line(
        "markers", "slow: mark test as slow running"
    )

# ============================================================================
# Auth Overrides
# ============================================================================

@pytest.fixture(autouse=True)
def override_auth_for_tests(request):
    """Override auth dependency for all tests except auth tests."""
    from backend.main import app
    from backend.routes.auth import verify_token
    
    if "test_auth_fixes" not in str(request.node.name) and "test_auth_fixes" not in str(request.node.fspath):
        app.dependency_overrides[verify_token] = lambda: "test_uid_123"
        yield
        app.dependency_overrides.pop(verify_token, None)
    else:
        yield

# Made with Bob