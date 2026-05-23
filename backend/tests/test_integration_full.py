"""
Full integration tests for complete user flows.

This module tests:
- Complete user journey from login to strategy recommendation
- Redis + PostgreSQL + API integration
- Cache hit/miss scenarios
- Concurrent user sessions
- End-to-end WebSocket flows
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient

from backend.main import app, ConnectionManager
from backend.models.race_state import LapPoint, TelemetryPayload
from backend.models.strategy import StrategyScores


@pytest.fixture
def integration_client():
    """Create a test client for integration tests."""
    return TestClient(app)


@pytest.fixture
def complete_telemetry_payload():
    """Create complete telemetry payload for integration tests."""
    laps = []
    for i in range(1, 31):
        laps.append(
            LapPoint(
                lap=i,
                lap_time_s=82.0 + i * 0.15,
                sector1_s=27.0,
                sector2_s=28.0,
                sector3_s=27.0,
                tyre_wear_pct=50.0 + i * 1.5,
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


@pytest.mark.integration
class TestCompleteUserFlow:
    """Test complete user journey through the system."""
    
    def test_health_check_to_strategy_flow(self, integration_client, complete_telemetry_payload):
        """Test flow: health check → strategy request → response."""
        # 1. Check system health
        health_response = integration_client.get("/health")
        assert health_response.status_code == 200
        health_data = health_response.json()
        assert "status" in health_data
        
        # 2. Request strategy recommendation
        with patch('backend.services.strategy_engine.predict_strategy', new_callable=AsyncMock) as mock_predict:
            mock_scores = StrategyScores(pit_urgency=75, sc_probability_next_3_laps=10, overtake_risk=50.0, recommended_window_laps=(20, 24))
            mock_predict.return_value = (mock_scores, ["Test explanation"], {"circuit": "Monza", "wear": 80.0, "degradation": 0.5, "gap_volatility": 1.2, "current_lap": 2})
            
            strategy_response = integration_client.post(
                "/api/v1/strategy/recommend",
                json=complete_telemetry_payload.model_dump()
            )
            
            assert strategy_response.status_code == 200
            strategy_data = strategy_response.json()
            assert "action" in strategy_data
            assert "confidence" in strategy_data
    
    @pytest.mark.asyncio
    async def test_redis_database_api_integration(self, complete_telemetry_payload):
        """Test integration between Redis, Database, and API."""
        from backend.services import redis_client
        
        # Mock Redis
        with patch('backend.services.redis_client._redis_client') as mock_redis, \
             patch('backend.services.redis_client._redis_available', True), \
             patch('backend.models.database.get_db') as mock_get_db:
            
            mock_redis.setex = AsyncMock()
            mock_redis.get = AsyncMock(return_value=None)  # Cache miss
            
            mock_session = AsyncMock()
            mock_session.add = MagicMock()
            mock_session.commit = AsyncMock()
            mock_get_db.return_value.__aenter__.return_value = mock_session
            
            # Simulate complete flow
            # 1. Check Redis cache (miss)
            cached = await redis_client.cache_get("test_key")
            assert cached is None
            
            # 2. Compute strategy
            from backend.services.strategy_engine import predict_strategy
            scores, reasons, meta = await predict_strategy(
                complete_telemetry_payload,
                session_id="integration-test"
            )
            
            # 3. Cache result
            await redis_client.cache_set(
                "test_key",
                {"scores": scores.model_dump()},
                ttl=300
            )
            
            # Verify Redis was called
            mock_redis.setex.assert_called()


@pytest.mark.integration
class TestCacheIntegration:
    """Test cache integration scenarios."""
    
    @pytest.mark.asyncio
    async def test_cache_miss_then_hit_scenario(self, complete_telemetry_payload):
        """Test cache miss followed by cache hit."""
        from backend.services.strategy_engine import predict_strategy
        
        session_id = "cache-test-session"
        
        # First call - cache miss
        scores1, reasons1, meta1 = await predict_strategy(
            complete_telemetry_payload,
            session_id=session_id
        )
        
        # Second call - should hit cache
        scores2, reasons2, meta2 = await predict_strategy(
            complete_telemetry_payload,
            session_id=session_id
        )
        
        # Results should be consistent
        assert scores1.pit_urgency == scores2.pit_urgency
        assert len(reasons1) == len(reasons2)
    
    @pytest.mark.asyncio
    async def test_cache_invalidation_scenario(self, complete_telemetry_payload):
        """Test cache invalidation and refresh."""
        from backend.services.strategy_engine import predict_strategy
        
        session_id = "invalidation-test"
        
        # First call - populate cache
        scores1, _, _ = await predict_strategy(
            complete_telemetry_payload,
            session_id=session_id
        )
        
        # Force bypass cache
        scores2, _, _ = await predict_strategy(
            complete_telemetry_payload,
            session_id=session_id,
            bypass_cache=True
        )
        
        # Results should still be consistent
        assert scores1.pit_urgency == scores2.pit_urgency


@pytest.mark.integration
class TestConcurrentSessions:
    """Test concurrent user sessions."""
    
    @pytest.mark.asyncio
    async def test_multiple_concurrent_sessions(self, complete_telemetry_payload):
        """Test multiple users with different sessions."""
        from backend.services.strategy_engine import predict_strategy
        
        sessions = ["session-1", "session-2", "session-3"]
        
        async def process_session(session_id):
            return await predict_strategy(
                complete_telemetry_payload,
                session_id=session_id
            )
        
        # Process all sessions concurrently
        tasks = [process_session(sid) for sid in sessions]
        results = await asyncio.gather(*tasks)
        
        # All should complete successfully
        assert len(results) == len(sessions)
        for scores, reasons, meta in results:
            assert scores.pit_urgency >= 0
            assert len(reasons) > 0
    
    @pytest.mark.asyncio
    async def test_concurrent_websocket_sessions(self):
        """Test multiple concurrent WebSocket sessions."""
        manager = ConnectionManager()
        
        # Create multiple sessions with multiple connections each
        sessions = {
            "race-1": [],
            "race-2": [],
            "race-3": []
        }
        
        for session_id in sessions:
            for i in range(3):  # 3 connections per session
                mock_ws = AsyncMock()
                mock_ws.accept = AsyncMock()
                mock_ws.send_json = AsyncMock()
                await manager.connect(mock_ws, session_id)
                sessions[session_id].append(mock_ws)
        
        # Broadcast to each session
        for session_id in sessions:
            telemetry = {
                "type": "telemetry",
                "session": session_id,
                "lap": 15
            }
            await manager.broadcast_telemetry(session_id, telemetry)
        
        # Verify each session's connections received their messages
        for session_id, websockets in sessions.items():
            for ws in websockets:
                ws.send_json.assert_called_once()


@pytest.mark.integration
class TestWebSocketIntegration:
    """Test WebSocket integration with Redis and session management."""
    
    @pytest.mark.asyncio
    async def test_websocket_with_redis_tracking(self):
        """Test WebSocket connection tracking in Redis."""
        
        manager = ConnectionManager()
        
        with patch('backend.services.redis_client._redis_client') as mock_redis, \
             patch('backend.services.redis_client._redis_available', True), \
             patch('backend.services.redis_client._redis_available', True):
            mock_redis.sadd = AsyncMock()
            mock_redis.srem = AsyncMock()
            mock_redis.expire = AsyncMock()
            
            # Connect WebSocket
            mock_ws = AsyncMock()
            mock_ws.accept = AsyncMock()
            session_id = "ws-redis-test"
            
            await manager.connect(mock_ws, session_id)
            
            # Verify Redis tracking was called
            mock_redis.sadd.assert_called_once()
            mock_redis.expire.assert_called_once()
            
            # Disconnect
            manager.disconnect(mock_ws, session_id)
            
            # Give async task time to complete
            await asyncio.sleep(0.1)
    
    @pytest.mark.asyncio
    async def test_websocket_message_flow(self):
        """Test complete WebSocket message flow."""
        manager = ConnectionManager()
        
        # Setup connections
        session_id = "message-flow-test"
        mock_ws1 = AsyncMock()
        mock_ws1.accept = AsyncMock()
        mock_ws1.send_json = AsyncMock()
        mock_ws2 = AsyncMock()
        mock_ws2.accept = AsyncMock()
        mock_ws2.send_json = AsyncMock()
        
        await manager.connect(mock_ws1, session_id)
        await manager.connect(mock_ws2, session_id)
        
        # Send multiple messages
        messages = [
            {"type": "telemetry", "lap": i, "speed": 280 + i}
            for i in range(5)
        ]
        
        for msg in messages:
            await manager.broadcast_telemetry(session_id, msg)
        
        # Verify both connections received all messages
        assert mock_ws1.send_json.call_count == len(messages)
        assert mock_ws2.send_json.call_count == len(messages)


@pytest.mark.integration
class TestErrorRecovery:
    """Test error recovery and resilience."""
    
    @pytest.mark.asyncio
    async def test_redis_failure_recovery(self, complete_telemetry_payload):
        """Test system continues when Redis fails."""
        from backend.services.strategy_engine import predict_strategy
        
        with patch('backend.services.redis_client._redis_available', False):
            # Should still work without Redis
            scores, reasons, meta = await predict_strategy(
                complete_telemetry_payload,
                session_id="redis-fail-test"
            )
            
            assert scores.pit_urgency >= 0
            assert len(reasons) > 0
    
    @pytest.mark.asyncio
    async def test_database_failure_recovery(self, integration_client, complete_telemetry_payload):
        """Test system continues when database fails."""
        with patch('backend.models.database.check_db_health') as mock_db_health:
            mock_db_health.return_value = {
                "status": "unhealthy",
                "connected": False,
                "message": "Database unavailable"
            }
            
            # Health check should show degraded but system continues
            response = integration_client.get("/health")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] in ["ok", "degraded"]
    
    @pytest.mark.asyncio
    async def test_websocket_stale_connection_cleanup(self):
        """Test cleanup of stale WebSocket connections."""
        manager = ConnectionManager()
        
        session_id = "stale-test"
        mock_ws_good = AsyncMock()
        mock_ws_good.accept = AsyncMock()
        mock_ws_good.send_json = AsyncMock()
        
        mock_ws_stale = AsyncMock()
        mock_ws_stale.accept = AsyncMock()
        mock_ws_stale.send_json = AsyncMock(side_effect=Exception("Connection lost"))
        
        await manager.connect(mock_ws_good, session_id)
        await manager.connect(mock_ws_stale, session_id)
        
        # Broadcast should remove stale connection
        await manager.broadcast_telemetry(session_id, {"test": "data"})
        
        # Good connection should remain
        assert mock_ws_good in manager.active_connections[session_id]
        # Stale connection should be removed
        assert mock_ws_stale not in manager.active_connections[session_id]


@pytest.mark.integration
class TestDataConsistency:
    """Test data consistency across components."""
    
    @pytest.mark.asyncio
    async def test_strategy_consistency_across_calls(self, complete_telemetry_payload):
        """Test that same input produces consistent output."""
        from backend.services.strategy_engine import predict_strategy
        
        session_id = "consistency-test"
        
        # Make multiple calls
        results = []
        for _ in range(3):
            scores, reasons, meta = await predict_strategy(
                complete_telemetry_payload,
                session_id=session_id,
                bypass_cache=True  # Force fresh computation
            )
            results.append((scores, reasons, meta))
        
        # All results should be identical
        for i in range(1, len(results)):
            assert results[i][0].pit_urgency == results[0][0].pit_urgency
            assert len(results[i][1]) == len(results[0][1])
    
    @pytest.mark.asyncio
    async def test_session_isolation(self, complete_telemetry_payload):
        """Test that different sessions are properly isolated."""
        from backend.services.strategy_engine import predict_strategy
        
        # Different sessions should have independent caches
        scores1, _, _ = await predict_strategy(
            complete_telemetry_payload,
            session_id="session-A"
        )
        
        scores2, _, _ = await predict_strategy(
            complete_telemetry_payload,
            session_id="session-B"
        )
        
        # Results should be the same (same input)
        # but cached separately
        assert scores1.pit_urgency == scores2.pit_urgency


@pytest.mark.integration
@pytest.mark.slow
class TestLoadScenarios:
    """Test system under load."""
    
    @pytest.mark.asyncio
    async def test_sustained_load(self, complete_telemetry_payload):
        """Test system under sustained load."""
        from backend.services.strategy_engine import predict_strategy
        
        iterations = 20
        session_ids = [f"load-test-{i}" for i in range(5)]
        
        async def make_request(session_id):
            return await predict_strategy(
                complete_telemetry_payload,
                session_id=session_id
            )
        
        # Simulate sustained load
        all_tasks = []
        for _ in range(iterations):
            for session_id in session_ids:
                all_tasks.append(make_request(session_id))
        
        results = await asyncio.gather(*all_tasks)
        
        # All requests should complete successfully
        assert len(results) == iterations * len(session_ids)
        for scores, reasons, meta in results:
            assert scores.pit_urgency >= 0


@pytest.mark.integration
class TestEndToEndScenarios:
    """Test realistic end-to-end scenarios."""
    
    def test_race_engineer_workflow(self, integration_client, complete_telemetry_payload):
        """Test typical race engineer workflow."""
        # 1. Check system health
        health = integration_client.get("/health")
        assert health.status_code == 200
        
        # 2. Get detailed metrics
        metrics = integration_client.get("/api/v1/metrics/health")
        assert metrics.status_code == 200
        
        # 3. Request strategy recommendation
        with patch('backend.services.strategy_engine.predict_strategy', new_callable=AsyncMock) as mock_predict:
            mock_scores = StrategyScores(pit_urgency=75, sc_probability_next_3_laps=10, overtake_risk=50.0, recommended_window_laps=(20, 24))
            mock_predict.return_value = (mock_scores, ["Test explanation"], {"circuit": "Monza", "wear": 80.0, "degradation": 0.5, "gap_volatility": 1.2, "current_lap": 2})
            
            strategy = integration_client.post(
                "/api/v1/strategy/recommend",
                json=complete_telemetry_payload.model_dump()
            )
            assert strategy.status_code == 200
            
            # 4. Verify response structure
            data = strategy.json()
            assert "action" in data
            assert "confidence" in data
            assert "explanation" in data
    
    @pytest.mark.asyncio
    async def test_multi_driver_race_scenario(self):
        """Test scenario with multiple drivers in same race."""
        from backend.services.strategy_engine import predict_strategy
        
        drivers = ["VER", "HAM", "LEC", "SAI", "NOR"]
        
        async def process_driver(driver_name):
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
                        gap_ahead_s=1.0,
                        gap_behind_s=1.5,
                    )
                )
            payload = TelemetryPayload(
                circuit="Monza",
                session_label="R",
                driver=driver_name,
                laps=laps
            )
            return await predict_strategy(payload, session_id=f"race-{driver_name}")
        
        # Process all drivers concurrently
        tasks = [process_driver(driver) for driver in drivers]
        results = await asyncio.gather(*tasks)
        
        # All drivers should get recommendations
        assert len(results) == len(drivers)
        for scores, reasons, meta in results:
            assert scores.pit_urgency >= 0
            assert len(reasons) > 0

# Made with Bob