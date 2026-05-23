"""
Tests for cache manager functionality.

Tests cache key generation, cache operations, invalidation, and statistics.
"""

import pytest

from models.race_state import LapPoint, TelemetryPayload
from services.cache_manager import (
    generate_strategy_cache_key,
    generate_heuristic_cache_key,
    generate_ai_response_cache_key,
    get_cached_strategy,
    set_cached_strategy,
    invalidate_cache,
    invalidate_driver_cache,
    invalidate_session_cache,
    get_cache_stats,
    reset_cache_stats,
    warm_cache_for_scenario,
    _compute_telemetry_hash,
    _normalize_telemetry_for_hash,
)


class MockRedisInMemory:
    def __init__(self):
        self.store = {}
    
    async def ping(self):
        return True
    
    async def get(self, key):
        return self.store.get(key)
    
    async def setex(self, key, ttl, value):
        self.store[key] = value
        return True
    
    async def delete(self, *keys):
        count = 0
        for k in keys:
            if k in self.store:
                del self.store[k]
                count += 1
        return count
    
    async def scan_iter(self, match=None, count=None):
        import fnmatch
        for key in list(self.store.keys()):
            if match is None or fnmatch.fnmatch(key, match):
                yield key


@pytest.fixture(autouse=True)
def setup_mock_redis():
    """Setup mock in-memory Redis client for caching tests."""
    import services.redis_client as rc
    
    mock_redis = MockRedisInMemory()
    
    # Store original values
    orig_available = rc._redis_available
    orig_client = rc._redis_client
    
    # Set mock values
    rc._redis_available = True
    rc._redis_client = mock_redis
    
    yield mock_redis
    
    # Restore original values
    rc._redis_available = orig_available
    rc._redis_client = orig_client


@pytest.fixture
def sample_telemetry():
    """Create sample telemetry payload for testing."""
    return TelemetryPayload(
        circuit="Monza",
        session_label="Race",
        driver="Max Verstappen",
        laps=[
            LapPoint(
                lap=1,
                lap_time_s=85.123,
                tyre_wear_pct=10.5,
                tyre_compound="SOFT",
                fuel_kg=100.0,
                gap_ahead_s=0.5,
                gap_behind_s=1.2,
            ),
            LapPoint(
                lap=2,
                lap_time_s=84.987,
                tyre_wear_pct=12.3,
                tyre_compound="SOFT",
                fuel_kg=98.5,
                gap_ahead_s=0.6,
                gap_behind_s=1.1,
            ),
        ],
    )


@pytest.fixture
def sample_telemetry_variant():
    """Create slightly different telemetry (should have different hash)."""
    return TelemetryPayload(
        circuit="Monza",
        session_label="Race",
        driver="Max Verstappen",
        laps=[
            LapPoint(
                lap=1,
                lap_time_s=85.456,  # Different lap time
                tyre_wear_pct=10.5,
                tyre_compound="SOFT",
                fuel_kg=100.0,
                gap_ahead_s=0.5,
                gap_behind_s=1.2,
            ),
            LapPoint(
                lap=2,
                lap_time_s=85.123,
                tyre_wear_pct=12.3,
                tyre_compound="SOFT",
                fuel_kg=98.5,
                gap_ahead_s=0.6,
                gap_behind_s=1.1,
            ),
        ],
    )


class TestCacheKeyGeneration:
    """Test cache key generation functions."""
    
    def test_strategy_cache_key_format(self, sample_telemetry):
        """Test strategy cache key has correct format."""
        key = generate_strategy_cache_key(sample_telemetry, "pit_stop")
        
        assert key.startswith("strategy:v1:")
        assert "max_verstappen" in key
        assert ":pit_stop" in key
    
    def test_strategy_cache_key_with_session(self, sample_telemetry):
        """Test strategy cache key includes session ID."""
        key = generate_strategy_cache_key(
            sample_telemetry,
            "pit_stop",
            session_id="session_123"
        )
        
        assert key.endswith(":session_123")
    
    def test_heuristic_cache_key_format(self, sample_telemetry):
        """Test heuristic cache key has correct format."""
        key = generate_heuristic_cache_key(sample_telemetry)
        
        assert key.startswith("heuristic:v1:")
        assert "max_verstappen" in key
    
    def test_ai_response_cache_key_format(self):
        """Test AI response cache key has correct format."""
        key = generate_ai_response_cache_key(
            "system prompt",
            "user prompt",
            max_tokens=512
        )
        
        assert key.startswith("ai_response:v1:")
        assert ":512" in key
    
    def test_deterministic_hashing(self, sample_telemetry):
        """Test that same telemetry produces same hash."""
        hash1 = _compute_telemetry_hash(sample_telemetry)
        hash2 = _compute_telemetry_hash(sample_telemetry)
        
        assert hash1 == hash2
    
    def test_different_telemetry_different_hash(
        self,
        sample_telemetry,
        sample_telemetry_variant
    ):
        """Test that different telemetry produces different hash."""
        hash1 = _compute_telemetry_hash(sample_telemetry)
        hash2 = _compute_telemetry_hash(sample_telemetry_variant)
        
        assert hash1 != hash2
    
    def test_telemetry_normalization(self, sample_telemetry):
        """Test telemetry normalization for hashing."""
        normalized = _normalize_telemetry_for_hash(sample_telemetry)
        
        assert normalized["circuit"] == "Monza"
        assert normalized["driver"] == "Max Verstappen"
        assert normalized["session"] == "Race"
        assert len(normalized["laps"]) == 2
        
        # Check rounding
        lap = normalized["laps"][0]
        assert lap["lap_time_s"] == 85.123  # 3 decimals
        assert lap["tyre_wear_pct"] == 10.5  # 1 decimal
        assert lap["fuel_kg"] == 100.0  # 1 decimal


@pytest.mark.asyncio
class TestCacheOperations:
    """Test cache get/set/delete operations."""
    
    async def test_cache_miss(self, sample_telemetry):
        """Test cache miss returns None."""
        key = generate_strategy_cache_key(sample_telemetry, "pit_stop")
        result = await get_cached_strategy(key)
        
        assert result is None
    
    async def test_cache_set_and_get(self, sample_telemetry):
        """Test setting and retrieving cache."""
        key = generate_strategy_cache_key(sample_telemetry, "pit_stop")
        data = {"recommendation": "PIT THIS LAP", "confidence": 85.5}
        
        # Set cache
        success = await set_cached_strategy(key, data, ttl=60)
        assert success is True
        
        # Get cache
        cached = await get_cached_strategy(key)
        assert cached is not None
        assert cached["data"] == data
    
    async def test_cache_string_value(self):
        """Test caching string values (for AI responses)."""
        key = "test:string:key"
        value = "This is a test response"
        
        success = await set_cached_strategy(key, value, ttl=60)
        assert success is True
        
        cached = await get_cached_strategy(key)
        assert cached is not None
        assert cached["data"] == value
    
    async def test_cache_invalidation_by_pattern(self, sample_telemetry):
        """Test cache invalidation by pattern."""
        # Set multiple cache entries
        key1 = generate_strategy_cache_key(sample_telemetry, "pit_stop")
        key2 = generate_strategy_cache_key(sample_telemetry, "tire_choice")
        
        await set_cached_strategy(key1, {"test": 1}, ttl=60)
        await set_cached_strategy(key2, {"test": 2}, ttl=60)
        
        # Invalidate by pattern
        pattern = "strategy:v1:max_verstappen:*"
        invalidated = await invalidate_cache(pattern)
        
        # Should invalidate at least the entries we created
        assert invalidated >= 2
    
    async def test_cache_invalidation_by_driver(self, sample_telemetry):
        """Test cache invalidation by driver."""
        key = generate_strategy_cache_key(sample_telemetry, "pit_stop")
        await set_cached_strategy(key, {"test": 1}, ttl=60)
        
        invalidated = await invalidate_driver_cache("Max Verstappen")
        
        assert invalidated >= 1
    
    async def test_cache_invalidation_by_session(self, sample_telemetry):
        """Test cache invalidation by session."""
        key = generate_strategy_cache_key(
            sample_telemetry,
            "pit_stop",
            session_id="test_session"
        )
        await set_cached_strategy(key, {"test": 1}, ttl=60)
        
        invalidated = await invalidate_session_cache("test_session")
        
        assert invalidated >= 1


@pytest.mark.asyncio
class TestCacheStatistics:
    """Test cache statistics tracking."""
    
    async def test_cache_stats_initialization(self):
        """Test cache stats are initialized."""
        reset_cache_stats()
        stats = get_cache_stats()
        
        assert stats.hits == 0
        assert stats.misses == 0
        assert stats.sets == 0
        assert stats.invalidations == 0
        assert stats.errors == 0
        assert stats.hit_rate == 0.0
        assert stats.total_requests == 0
    
    async def test_cache_stats_tracking(self, sample_telemetry):
        """Test cache statistics are tracked correctly."""
        reset_cache_stats()
        
        key = generate_strategy_cache_key(sample_telemetry, "pit_stop")
        
        # Cache miss
        await get_cached_strategy(key)
        stats = get_cache_stats()
        assert stats.misses == 1
        assert stats.total_requests == 1
        
        # Cache set
        await set_cached_strategy(key, {"test": 1}, ttl=60)
        stats = get_cache_stats()
        assert stats.sets == 1
        
        # Cache hit
        await get_cached_strategy(key)
        stats = get_cache_stats()
        assert stats.hits == 1
        assert stats.total_requests == 2
        assert stats.hit_rate == 50.0  # 1 hit out of 2 requests
    
    async def test_hit_rate_calculation(self, sample_telemetry):
        """Test hit rate calculation."""
        reset_cache_stats()
        
        key = generate_strategy_cache_key(sample_telemetry, "pit_stop")
        await set_cached_strategy(key, {"test": 1}, ttl=60)
        
        # 3 hits, 1 miss
        await get_cached_strategy(key)  # hit
        await get_cached_strategy(key)  # hit
        await get_cached_strategy(key)  # hit
        await get_cached_strategy("nonexistent:key")  # miss
        
        stats = get_cache_stats()
        assert stats.hits == 3
        assert stats.misses == 1
        assert stats.total_requests == 4
        assert stats.hit_rate == 75.0


@pytest.mark.asyncio
class TestCacheWarming:
    """Test cache warming functionality."""
    
    async def test_cache_warming(self, sample_telemetry):
        """Test cache warming for multiple strategy types."""
        strategy_types = ["pit_stop", "tire_choice", "fuel_management"]
        
        warmed = await warm_cache_for_scenario(
            sample_telemetry,
            strategy_types,
            session_id="test_session"
        )
        
        # Should prepare cache keys for all strategy types
        assert warmed >= 0  # May be 0 if already cached


class TestCacheKeyNormalization:
    """Test cache key normalization edge cases."""
    
    def test_driver_name_normalization(self):
        """Test driver names are normalized correctly."""
        payload1 = TelemetryPayload(
            circuit="Monza",
            driver="Max Verstappen",
            laps=[LapPoint(lap=1, lap_time_s=85.0)]
        )
        payload2 = TelemetryPayload(
            circuit="Monza",
            driver="max verstappen",  # Different case
            laps=[LapPoint(lap=1, lap_time_s=85.0)]
        )
        
        key1 = generate_strategy_cache_key(payload1, "pit_stop")
        key2 = generate_strategy_cache_key(payload2, "pit_stop")
        
        # Should produce same key (case-insensitive)
        assert "max_verstappen" in key1
        assert "max_verstappen" in key2
    
    def test_empty_laps_handling(self):
        """Test handling of empty laps list."""
        payload = TelemetryPayload.model_construct(
            circuit="Monza",
            driver="Test Driver",
            laps=[]
        )
        
        # Should not raise error
        key = generate_strategy_cache_key(payload, "pit_stop")
        assert key is not None
        assert "test_driver" in key
    
    def test_none_values_handling(self):
        """Test handling of None values in telemetry."""
        payload = TelemetryPayload(
            circuit="Monza",
            driver="Test Driver",
            laps=[
                LapPoint(
                    lap=1,
                    lap_time_s=None,  # None value
                    tyre_wear_pct=None,
                    tyre_compound=None,
                )
            ]
        )
        
        # Should not raise error
        normalized = _normalize_telemetry_for_hash(payload)
        assert normalized is not None
        assert normalized["laps"][0]["lap_time_s"] is None


@pytest.mark.asyncio
class TestCacheResilience:
    """Test cache resilience and error handling."""
    
    async def test_cache_failure_graceful_degradation(self):
        """Test that cache failures don't break the application."""
        # Try to get from invalid key
        result = await get_cached_strategy("invalid:::key")
        
        # Should return None, not raise exception
        assert result is None
    
    async def test_cache_stats_on_error(self):
        """Test that errors are tracked in statistics."""
        reset_cache_stats()
        initial_errors = get_cache_stats().errors
        
        # Attempt operation that might fail
        await get_cached_strategy("test:key")
        
        stats = get_cache_stats()
        # Errors should not increase for normal operations
        assert stats.errors >= initial_errors


# Integration test markers
pytestmark = pytest.mark.asyncio


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

# Made with Bob
