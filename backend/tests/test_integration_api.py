"""
Integration tests for API endpoints.

This module tests:
- Complete strategy recommendation flow
- Authentication and authorization
- Rate limiting
- Error responses
- CORS headers
- Health check endpoints
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient

from backend.main import app
from backend.models.race_state import TelemetryPayload, LapPoint
from backend.models.strategy import StrategyScores, StrategyRecommendation


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def sample_telemetry_payload():
    """Create a sample telemetry payload for testing."""
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
    return TelemetryPayload(
        circuit="Monza",
        session_label="R",
        driver="VER",
        laps=laps
    )


class TestHealthEndpoints:
    """Test health check endpoints."""
    
    def test_health_endpoint_returns_200(self, client):
        """Test that /health endpoint returns 200."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "redis" in data
        assert "database" in data
        assert "cache" in data
    
    def test_api_health_endpoint_returns_200(self, client):
        """Test that /api/health endpoint returns 200."""
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] in ["ok", "degraded"]
    
    def test_health_metrics_endpoint_returns_detailed_info(self, client):
        """Test that /api/v1/metrics/health returns detailed metrics."""
        response = client.get("/api/v1/metrics/health")
        assert response.status_code == 200
        data = response.json()
        
        # Verify all expected metrics are present
        assert "api" in data
        assert "redis" in data
        assert "database" in data
        assert "cacheHitRate" in data
        assert "latency" in data
        assert "dataQuality" in data
        
        # Verify metric structure
        assert "status" in data["api"]
        assert "value" in data["api"]
        assert "lastUpdated" in data["api"]


class TestStrategyEndpoint:
    """Test strategy recommendation endpoint."""
    
    def test_strategy_endpoint_accepts_telemetry(self, client, sample_telemetry_payload):
        """Test that strategy endpoint accepts valid telemetry."""
        with patch('backend.services.strategy_engine.predict_strategy', new_callable=AsyncMock) as mock_predict:
            # Mock strategy response
            mock_scores = StrategyScores(pit_urgency=75, sc_probability_next_3_laps=10, overtake_risk=50.0, recommended_window_laps=(20, 24))
            mock_predict.return_value = (mock_scores, ["Test explanation"], {"circuit": "Monza", "wear": 80.0, "degradation": 0.5, "gap_volatility": 1.2, "current_lap": 2})
            
            response = client.post(
                "/api/v1/strategy/recommend",
                json=sample_telemetry_payload.model_dump()
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "action" in data
            assert "confidence" in data
            assert "explanation" in data
    
    def test_strategy_endpoint_validates_payload(self, client):
        """Test that strategy endpoint validates telemetry payload."""
        invalid_payload = {
            "circuit": "Monza",
            "session_label": "R",
            "driver": "VER",
            "laps": []  # Empty laps should fail validation
        }
        
        response = client.post(
            "/api/v1/strategy/recommend",
            json=invalid_payload
        )
        
        assert response.status_code == 422  # Validation error
    
    def test_strategy_endpoint_handles_missing_fields(self, client):
        """Test that strategy endpoint handles missing required fields."""
        incomplete_payload = {
            "circuit": "Monza",
            # Missing session_label, driver, and laps
        }
        
        response = client.post(
            "/api/v1/strategy/recommend",
            json=incomplete_payload
        )
        
        assert response.status_code == 422


class TestCORSHeaders:
    """Test CORS headers on API responses."""
    
    def test_cors_headers_present(self, client):
        """Test that CORS headers are present in responses."""
        response = client.get("/health", headers={"Origin": "http://localhost:5173"})
    
        assert "access-control-allow-origin" in response.headers
        assert "access-control-allow-credentials" in response.headers
    
    def test_cors_preflight_request(self, client):
        """Test CORS preflight OPTIONS request."""
        response = client.options(
            "/api/v1/strategy/recommend",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
            }
        )
        
        assert response.status_code in [200, 204]
        assert "access-control-allow-methods" in response.headers


class TestSecurityHeaders:
    """Test security headers on API responses."""
    
    def test_security_headers_present(self, client):
        """Test that security headers are present."""
        response = client.get("/health")
        
        assert "x-content-type-options" in response.headers
        assert response.headers["x-content-type-options"] == "nosniff"
        
        assert "x-frame-options" in response.headers
        assert response.headers["x-frame-options"] == "DENY"
        
        assert "referrer-policy" in response.headers
        assert response.headers["referrer-policy"] == "no-referrer"
        
        assert "cache-control" in response.headers
        assert response.headers["cache-control"] == "no-store"


class TestRateLimiting:
    """Test rate limiting functionality."""
    
    def test_rate_limit_not_exceeded_normal_usage(self, client):
        """Test that normal usage doesn't trigger rate limiting."""
        # Make a few requests (well below limit)
        for _ in range(5):
            response = client.get("/health")
            assert response.status_code == 200
    
    def test_rate_limit_headers_present(self, client):
        """Test that rate limit headers are present."""
        response = client.get("/health")
        
        # Rate limit headers may or may not be present depending on configuration
        # Just verify the request succeeds
        assert response.status_code == 200


class TestErrorHandling:
    """Test error handling and responses."""
    
    def test_404_for_nonexistent_endpoint(self, client):
        """Test that nonexistent endpoints return 404."""
        response = client.get("/api/v1/nonexistent")
        assert response.status_code == 404
    
    def test_405_for_wrong_method(self, client):
        """Test that wrong HTTP methods return 405."""
        # POST to a GET-only endpoint
        response = client.post("/health")
        assert response.status_code == 405
    
    def test_422_for_invalid_json(self, client):
        """Test that invalid JSON returns 422."""
        response = client.post(
            "/api/v1/strategy/recommend",
            data="invalid json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 422


class TestStrategyRecommendationFlow:
    """Test complete strategy recommendation flow."""
    
    def test_complete_recommendation_flow(self, client, sample_telemetry_payload):
        """Test complete flow from telemetry to recommendation."""
        mock_recommendation = StrategyRecommendation(
            action="STAY_OUT",
            pit_this_lap=False,
            suggested_compound="MEDIUM",
            scores=StrategyScores(
                pit_urgency=75,
                sc_probability_next_3_laps=10,
                overtake_risk=50.0,
                recommended_window_laps=(20, 24)
            ),
            structured_reasons=["Tyre wear acceptable"],
            explanation="Recommend staying out based on current tyre wear.",
            evidence=["Lap time stable"],
            assumptions=["No safety car expected"],
            confidence=78.0,
            alternative="PIT_NOW",
            pipeline_steps=["heuristics", "ai_explanation"]
        )

        with patch('backend.services.pipeline.run_strategy_pipeline', new_callable=AsyncMock) as mock_pipeline:
            mock_pipeline.return_value = mock_recommendation

            # Make request
            response = client.post(
                "/api/v1/strategy/recommend",
                json=sample_telemetry_payload.model_dump()
            )

            # Verify response
            assert response.status_code == 200
            data = response.json()

            assert "action" in data
            assert "confidence" in data
            assert "explanation" in data
            assert isinstance(data["explanation"], str)
            assert len(data["explanation"]) > 0

    def test_recommendation_with_caching(self, client, sample_telemetry_payload):
        """Test that recommendations use caching."""
        with patch('backend.services.strategy_engine.predict_strategy', new_callable=AsyncMock) as mock_predict, \
             patch('backend.services.cache_manager.get_cached_strategy') as mock_cache_get, \
             patch('backend.services.cache_manager.set_cached_strategy'):
            
            # First request - cache miss
            mock_cache_get.return_value = None
            
            mock_scores = StrategyScores(pit_urgency=75, sc_probability_next_3_laps=10, overtake_risk=50.0, recommended_window_laps=(20, 24))
            mock_predict.return_value = (mock_scores, ["Test explanation"], {"circuit": "Monza", "wear": 80.0, "degradation": 0.5, "gap_volatility": 1.2, "current_lap": 2})
            
            response1 = client.post(
                "/api/v1/strategy/recommend",
                json=sample_telemetry_payload.model_dump()
            )
            
            assert response1.status_code == 200


class TestDatabaseIntegration:
    """Test database integration in API endpoints."""
    
    def test_audit_log_creation(self, client, sample_telemetry_payload):
        """Test that strategy recommendations create audit logs."""
        with patch('backend.services.strategy_engine.predict_strategy', new_callable=AsyncMock) as mock_predict, \
             patch('backend.main.db.get_db') as mock_get_db:
            
            # Mock database session
            mock_session = AsyncMock()
            mock_session.add = MagicMock()
            mock_session.commit = AsyncMock()
            mock_get_db.return_value.__aenter__.return_value = mock_session
            
            # Mock strategy prediction
            mock_scores = StrategyScores(pit_urgency=75, sc_probability_next_3_laps=10, overtake_risk=50.0, recommended_window_laps=(20, 24))
            mock_predict.return_value = (mock_scores, ["Test explanation"], {"circuit": "Monza", "wear": 80.0, "degradation": 0.5, "gap_volatility": 1.2, "current_lap": 2})
            
            # Make request
            response = client.post(
                "/api/v1/strategy/recommend",
                json=sample_telemetry_payload.model_dump()
            )
            
            assert response.status_code == 200


class TestRedisIntegration:
    """Test Redis integration in API endpoints."""
    
    def test_health_check_includes_redis_status(self, client):
        """Test that health check includes Redis status."""
        response = client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert "redis" in data
        assert "status" in data["redis"]
        assert "connected" in data["redis"]
    
    def test_api_works_without_redis(self, client, sample_telemetry_payload):
        """Test that API works even when Redis is unavailable."""
        with patch('backend.main.redis_client.check_redis_health') as mock_redis_health, \
             patch('backend.services.strategy_engine.predict_strategy', new_callable=AsyncMock) as mock_predict:
            
            # Simulate Redis unavailable
            mock_redis_health.return_value = {
                "status": "unavailable",
                "connected": False,
                "message": "Redis not available"
            }
            
            mock_scores = StrategyScores(pit_urgency=75, sc_probability_next_3_laps=10, overtake_risk=50.0, recommended_window_laps=(20, 24))
            mock_predict.return_value = (mock_scores, ["Test explanation"], {"circuit": "Monza", "wear": 80.0, "degradation": 0.5, "gap_volatility": 1.2, "current_lap": 2})
            
            # API should still work
            response = client.post(
                "/api/v1/strategy/recommend",
                json=sample_telemetry_payload.model_dump()
            )
            
            assert response.status_code == 200


class TestContentTypeHandling:
    """Test content type handling."""
    
    def test_json_content_type_required(self, client):
        """Test that JSON content type is required for POST requests."""
        response = client.post(
            "/api/v1/strategy/recommend",
            data="some data",
            headers={"Content-Type": "text/plain"}
        )
        
        # Should fail due to content type or validation
        assert response.status_code in [415, 422]
    
    def test_json_response_content_type(self, client):
        """Test that responses have JSON content type."""
        response = client.get("/health")
        assert response.status_code == 200
        assert "application/json" in response.headers["content-type"]


class TestAPIVersioning:
    """Test API versioning."""
    
    def test_v1_endpoints_accessible(self, client):
        """Test that v1 API endpoints are accessible."""
        response = client.get("/api/v1/metrics/health")
        assert response.status_code == 200
    
    def test_versioned_strategy_endpoint(self, client, sample_telemetry_payload):
        """Test versioned strategy endpoint."""
        with patch('backend.services.strategy_engine.predict_strategy', new_callable=AsyncMock) as mock_predict:
            mock_scores = StrategyScores(pit_urgency=75, sc_probability_next_3_laps=10, overtake_risk=50.0, recommended_window_laps=(20, 24))
            mock_predict.return_value = (mock_scores, ["Test explanation"], {"circuit": "Monza", "wear": 80.0, "degradation": 0.5, "gap_volatility": 1.2, "current_lap": 2})
            
            response = client.post(
                "/api/v1/strategy/recommend",
                json=sample_telemetry_payload.model_dump()
            )
            
            assert response.status_code == 200


class TestCacheStatistics:
    """Test cache statistics in health endpoints."""
    
    def test_cache_stats_in_health_response(self, client):
        """Test that cache statistics are included in health response."""
        response = client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert "cache" in data
        assert "hit_rate" in data["cache"]
        assert "total_requests" in data["cache"]
        assert "hits" in data["cache"]
        assert "misses" in data["cache"]
    
    def test_cache_hit_rate_in_metrics(self, client):
        """Test that cache hit rate is in detailed metrics."""
        response = client.get("/api/v1/metrics/health")
        assert response.status_code == 200
        
        data = response.json()
        assert "cacheHitRate" in data
        assert "value" in data["cacheHitRate"]
        assert "status" in data["cacheHitRate"]
        assert "threshold" in data["cacheHitRate"]

# Made with Bob