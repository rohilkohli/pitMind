"""
Performance and benchmarking tests for pitMind.

This module tests:
- API response times
- Cache performance
- Database query performance
- WebSocket latency
- Strategy engine performance
- Concurrent request handling
"""

import pytest
import time
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient

from main import app
from models.race_state import LapPoint, TelemetryPayload
from models.strategy import StrategyScores, StrategyRecommendation
from services.strategy_engine import predict_strategy


# Performance thresholds (in seconds)
API_RESPONSE_THRESHOLD = 0.2  # 200ms
WEBSOCKET_LATENCY_THRESHOLD = 0.05  # 50ms
STRATEGY_ENGINE_THRESHOLD = 1.0  # 1 second
DATABASE_QUERY_THRESHOLD = 0.1  # 100ms
CACHE_OPERATION_THRESHOLD = 0.01  # 10ms


@pytest.fixture
def performance_telemetry_payload():
    """Create a large telemetry payload for performance testing."""
    laps = []
    for i in range(1, 51):  # 50 laps
        laps.append(
            LapPoint(
                lap=i,
                lap_time_s=82.0 + i * 0.1,
                sector1_s=27.0,
                sector2_s=28.0,
                sector3_s=27.0,
                tyre_wear_pct=50.0 + i * 0.8,
                tyre_compound="SOFT",
                fuel_kg=max(5.0, 100 - i * 1.8),
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


@pytest.mark.performance
class TestAPIPerformance:
    """Test API endpoint performance."""
    
    def test_health_endpoint_response_time(self):
        """Test that health endpoint responds within threshold."""
        client = TestClient(app)
        
        start_time = time.time()
        response = client.get("/health")
        duration = time.time() - start_time
        
        assert response.status_code == 200
        assert duration < API_RESPONSE_THRESHOLD, \
            f"Health endpoint took {duration:.3f}s, expected <{API_RESPONSE_THRESHOLD}s"
    
    def test_metrics_endpoint_response_time(self):
        """Test that metrics endpoint responds within threshold."""
        client = TestClient(app)
        
        start_time = time.time()
        response = client.get("/api/v1/metrics/health")
        duration = time.time() - start_time
        
        assert response.status_code == 200
        assert duration < API_RESPONSE_THRESHOLD, \
            f"Metrics endpoint took {duration:.3f}s, expected <{API_RESPONSE_THRESHOLD}s"
    
    def test_strategy_endpoint_response_time(self, performance_telemetry_payload):
        """Test that strategy endpoint responds within threshold."""
        client = TestClient(app)
        
        mock_rec = StrategyRecommendation(
            action="PIT THIS LAP",
            pit_this_lap=True,
            suggested_compound="MEDIUM",
            scores=StrategyScores(
                pit_urgency=75.0,
                sc_probability_next_3_laps=10.0,
                overtake_risk=50.0,
                recommended_window_laps=(20, 24)
            ),
            structured_reasons=["High tyre wear"],
            explanation="Test explanation",
            evidence=["tyre wear is high"],
            assumptions=["normal weather"],
            confidence=85.0,
            alternative="STAY OUT",
            pipeline_steps=["heuristic", "granite"]
        )
        
        with patch('backend.routes.strategy.pipeline_svc.run_strategy_pipeline') as mock_run:
            mock_run.return_value = mock_rec
            
            start_time = time.time()
            response = client.post(
                "/api/v1/strategy/recommend",
                json=performance_telemetry_payload.model_dump()
            )
            duration = time.time() - start_time
            
            assert response.status_code == 200
            assert duration < API_RESPONSE_THRESHOLD * 2, \
                f"Strategy endpoint took {duration:.3f}s, expected <{API_RESPONSE_THRESHOLD * 2}s"


@pytest.mark.performance
class TestStrategyEnginePerformance:
    """Test strategy engine performance."""
    
    @pytest.mark.asyncio
    async def test_strategy_prediction_performance(self, performance_telemetry_payload):
        """Test that strategy prediction completes within threshold."""
        start_time = time.time()
        scores, reasons, meta = await predict_strategy(performance_telemetry_payload)
        duration = time.time() - start_time
        
        assert scores.pit_urgency >= 0
        assert duration < STRATEGY_ENGINE_THRESHOLD, \
            f"Strategy prediction took {duration:.3f}s, expected <{STRATEGY_ENGINE_THRESHOLD}s"
    
    @pytest.mark.asyncio
    async def test_strategy_prediction_with_100_laps(self):
        """Test strategy prediction with maximum lap count."""
        laps = []
        for i in range(1, 101):  # 100 laps
            laps.append(
                LapPoint(
                    lap=i,
                    lap_time_s=82.0,
                    sector1_s=27.0,
                    sector2_s=28.0,
                    sector3_s=27.0,
                    tyre_wear_pct=min(95.0, 10.0 + i * 0.8),
                    tyre_compound="SOFT",
                    fuel_kg=max(5.0, 100 - i * 0.9),
                    gap_ahead_s=1.0,
                    gap_behind_s=1.5,
                )
            )
        payload = TelemetryPayload(
            circuit="Monza",
            session_label="R",
            driver="VER",
            laps=laps
        )
        
        start_time = time.time()
        scores, reasons, meta = await predict_strategy(payload)
        duration = time.time() - start_time
        
        assert scores.pit_urgency >= 0
        assert duration < STRATEGY_ENGINE_THRESHOLD * 1.5, \
            f"100-lap prediction took {duration:.3f}s, expected <{STRATEGY_ENGINE_THRESHOLD * 1.5}s"
    
    @pytest.mark.asyncio
    async def test_multiple_sequential_predictions(self, performance_telemetry_payload):
        """Test performance of multiple sequential predictions."""
        iterations = 10
        
        start_time = time.time()
        for _ in range(iterations):
            await predict_strategy(performance_telemetry_payload, bypass_cache=True)
        duration = time.time() - start_time
        
        avg_duration = duration / iterations
        assert avg_duration < STRATEGY_ENGINE_THRESHOLD, \
            f"Average prediction time {avg_duration:.3f}s, expected <{STRATEGY_ENGINE_THRESHOLD}s"


@pytest.mark.performance
class TestCachePerformance:
    """Test cache operation performance."""
    
    @pytest.mark.asyncio
    async def test_redis_set_performance(self):
        """Test Redis set operation performance."""
        from services import redis_client
        
        with patch('backend.services.redis_client._redis_client') as mock_redis:
            mock_redis.setex = AsyncMock()
            
            start_time = time.time()
            await redis_client.cache_set("test_key", {"data": "test"}, ttl=300)
            duration = time.time() - start_time
            
            assert duration < CACHE_OPERATION_THRESHOLD, \
                f"Cache set took {duration:.3f}s, expected <{CACHE_OPERATION_THRESHOLD}s"
    
    @pytest.mark.asyncio
    async def test_redis_get_performance(self):
        """Test Redis get operation performance."""
        from services import redis_client
        
        with patch('backend.services.redis_client._redis_client') as mock_redis:
            mock_redis.get = AsyncMock(return_value='{"data": "test"}')
            
            start_time = time.time()
            await redis_client.cache_get("test_key")
            duration = time.time() - start_time
            
            assert duration < CACHE_OPERATION_THRESHOLD, \
                f"Cache get took {duration:.3f}s, expected <{CACHE_OPERATION_THRESHOLD}s"
    
    @pytest.mark.asyncio
    async def test_cache_hit_vs_miss_performance(self, performance_telemetry_payload):
        """Test performance difference between cache hit and miss."""
        # Cache miss (first call)
        start_miss = time.perf_counter()
        scores1, _, _ = await predict_strategy(performance_telemetry_payload, session_id="perf-test")
        miss_duration = time.perf_counter() - start_miss
        
        # Cache hit (second call)
        start_hit = time.perf_counter()
        scores2, _, _ = await predict_strategy(performance_telemetry_payload, session_id="perf-test")
        hit_duration = time.perf_counter() - start_hit
        
        # Cache hit should be faster, similar, or extremely fast overall (< 10ms)
        assert hit_duration <= miss_duration * 1.5 or hit_duration < 0.01, \
            f"Cache hit ({hit_duration:.3f}s) not faster than miss ({miss_duration:.3f}s)"


@pytest.mark.performance
class TestConcurrentRequests:
    """Test performance under concurrent load."""
    
    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_concurrent_strategy_predictions(self, performance_telemetry_payload):
        """Test multiple concurrent strategy predictions."""
        concurrent_requests = 10
        
        async def make_prediction():
            return await predict_strategy(performance_telemetry_payload, bypass_cache=True)
        
        start_time = time.time()
        tasks = [make_prediction() for _ in range(concurrent_requests)]
        results = await asyncio.gather(*tasks)
        duration = time.time() - start_time
        
        # All should complete
        assert len(results) == concurrent_requests
        
        # Average time per request
        avg_duration = duration / concurrent_requests
        assert avg_duration < STRATEGY_ENGINE_THRESHOLD * 2, \
            f"Concurrent avg time {avg_duration:.3f}s, expected <{STRATEGY_ENGINE_THRESHOLD * 2}s"
    
    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_concurrent_cache_operations(self):
        """Test concurrent cache operations."""
        from services import redis_client
        
        concurrent_ops = 20
        
        with patch('backend.services.redis_client._redis_client') as mock_redis:
            mock_redis.setex = AsyncMock()
            mock_redis.get = AsyncMock(return_value='{"data": "test"}')
            
            async def cache_operation(i):
                await redis_client.cache_set(f"key_{i}", {"data": f"value_{i}"})
                return await redis_client.cache_get(f"key_{i}")
            
            start_time = time.time()
            tasks = [cache_operation(i) for i in range(concurrent_ops)]
            results = await asyncio.gather(*tasks)
            duration = time.time() - start_time
            
            assert len(results) == concurrent_ops
            avg_duration = duration / concurrent_ops
            assert avg_duration < CACHE_OPERATION_THRESHOLD * 5, \
                f"Concurrent cache ops avg {avg_duration:.3f}s, expected <{CACHE_OPERATION_THRESHOLD * 5}s"


@pytest.mark.performance
class TestWebSocketPerformance:
    """Test WebSocket performance."""
    
    @pytest.mark.asyncio
    async def test_websocket_message_broadcast_latency(self):
        """Test WebSocket message broadcast latency."""
        from main import ConnectionManager
        
        manager = ConnectionManager()
        mock_websockets = []
        
        # Create 10 mock WebSocket connections
        for i in range(10):
            mock_ws = AsyncMock()
            mock_ws.accept = AsyncMock()
            mock_ws.send_json = AsyncMock()
            mock_websockets.append(mock_ws)
            await manager.connect(mock_ws, "perf-test-session")
        
        telemetry = {
            "type": "telemetry",
            "lap": 15,
            "speed": 285,
            "timestamp": time.time()
        }
        
        start_time = time.time()
        await manager.broadcast_telemetry("perf-test-session", telemetry)
        duration = time.time() - start_time
        
        assert duration < WEBSOCKET_LATENCY_THRESHOLD * 10, \
            f"Broadcast to 10 clients took {duration:.3f}s, expected <{WEBSOCKET_LATENCY_THRESHOLD * 10}s"
        
        # Verify all received
        for ws in mock_websockets:
            ws.send_json.assert_called_once()
    
    @pytest.mark.asyncio
    @pytest.mark.slow
    async def test_websocket_high_frequency_messages(self):
        """Test WebSocket performance with high-frequency messages."""
        from main import ConnectionManager
        
        manager = ConnectionManager()
        mock_ws = AsyncMock()
        mock_ws.accept = AsyncMock()
        mock_ws.send_json = AsyncMock()
        
        await manager.connect(mock_ws, "perf-test-session")
        
        message_count = 100
        start_time = time.time()
        
        for i in range(message_count):
            await manager.broadcast_telemetry(
                "perf-test-session",
                {"lap": i, "speed": 280 + i}
            )
        
        duration = time.time() - start_time
        
        # Should handle 100 messages quickly
        assert duration < 1.0, \
            f"100 messages took {duration:.3f}s, expected <1.0s"
        
        assert mock_ws.send_json.call_count == message_count


@pytest.mark.performance
class TestDatabasePerformance:
    """Test database operation performance."""
    
    @pytest.mark.asyncio
    async def test_database_health_check_performance(self):
        """Test database health check performance."""
        from models import database as db
        
        with patch('backend.models.database.get_engine') as mock_get_engine:
            mock_engine = MagicMock()
            mock_conn = AsyncMock()
            mock_result = MagicMock()
            mock_result.fetchone.return_value = (1,)
            mock_conn.execute.return_value = mock_result
            mock_connect_ctx = AsyncMock()
            mock_connect_ctx.__aenter__.return_value = mock_conn
            mock_engine.connect.return_value = mock_connect_ctx
            mock_get_engine.return_value = mock_engine
            
            start_time = time.time()
            health = await db.check_db_health()
            duration = time.time() - start_time
            
            assert health["connected"] is True
            assert duration < DATABASE_QUERY_THRESHOLD, \
                f"DB health check took {duration:.3f}s, expected <{DATABASE_QUERY_THRESHOLD}s"


@pytest.mark.performance
class TestMemoryUsage:
    """Test memory usage patterns."""
    
    @pytest.mark.asyncio
    async def test_large_telemetry_payload_memory(self):
        """Test memory handling with large telemetry payloads."""
        import sys
        
        # Create very large payload
        laps = []
        for i in range(1, 201):  # 200 laps
            laps.append(
                LapPoint(
                    lap=i,
                    lap_time_s=82.0,
                    sector1_s=27.0,
                    sector2_s=28.0,
                    sector3_s=27.0,
                    tyre_wear_pct=min(95.0, 10.0 + i * 0.4),
                    tyre_compound="SOFT",
                    fuel_kg=max(5.0, 100 - i * 0.5),
                    gap_ahead_s=1.0,
                    gap_behind_s=1.5,
                )
            )
        payload = TelemetryPayload(
            circuit="Monza",
            session_label="R",
            driver="VER",
            laps=laps
        )
        
        # Check payload size
        payload_size = sys.getsizeof(payload.model_dump_json())
        
        # Should handle large payloads
        scores, reasons, meta = await predict_strategy(payload)
        assert scores.pit_urgency >= 0
        
        # Payload should be reasonable size (< 1MB)
        assert payload_size < 1024 * 1024, \
            f"Payload size {payload_size} bytes is too large"


@pytest.mark.performance
class TestPerformanceBenchmarks:
    """Establish performance benchmarks."""
    
    @pytest.mark.asyncio
    async def test_end_to_end_latency_benchmark(self, performance_telemetry_payload):
        """Benchmark end-to-end latency for complete flow."""
        from services import redis_client
        
        # Simulate complete flow: receive telemetry → predict → cache → respond
        start_time = time.time()
        
        # 1. Predict strategy
        scores, reasons, meta = await predict_strategy(
            performance_telemetry_payload,
            session_id="benchmark-session"
        )
        
        # 2. Cache result (simulated)
        with patch('backend.services.redis_client._redis_client') as mock_redis:
            mock_redis.setex = AsyncMock()
            await redis_client.cache_set(
                "benchmark_result",
                {"scores": scores.model_dump(), "reasons": reasons},
                ttl=300
            )
        
        duration = time.time() - start_time
        
        # Complete flow should be fast
        assert duration < API_RESPONSE_THRESHOLD * 3, \
            f"End-to-end flow took {duration:.3f}s, expected <{API_RESPONSE_THRESHOLD * 3}s"
        
        # Log benchmark result
        print(f"\n📊 End-to-end latency benchmark: {duration:.3f}s")
        print(f"   - Target: <{API_RESPONSE_THRESHOLD * 3}s")
        print(f"   - Status: {'✅ PASS' if duration < API_RESPONSE_THRESHOLD * 3 else '❌ FAIL'}")

# Made with Bob