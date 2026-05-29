import pytest
from unittest.mock import patch, AsyncMock
from backend.services.cache_invalidator import get_cache_invalidator, CacheInvalidator, RaceCondition

@pytest.fixture
def invalidator():
    """Returns a fresh instance of CacheInvalidator for each test."""
    return CacheInvalidator()

def test_get_cache_invalidator_singleton():
    """Test that get_cache_invalidator returns a singleton instance."""
    instance1 = get_cache_invalidator()
    instance2 = get_cache_invalidator()

    assert instance1 is instance2
    assert isinstance(instance1, CacheInvalidator)

@pytest.mark.asyncio
async def test_on_safety_car_deployed(invalidator):
    with patch("backend.services.cache_invalidator.invalidate_session_cache", new_callable=AsyncMock) as mock_invalidate:
        mock_invalidate.return_value = 5
        result = await invalidator.on_safety_car_deployed("session_123")
        assert result == 5
        mock_invalidate.assert_called_once_with("session_123")

@pytest.mark.asyncio
async def test_on_virtual_safety_car(invalidator):
    with patch("backend.services.cache_invalidator.invalidate_cache", new_callable=AsyncMock) as mock_invalidate:
        mock_invalidate.return_value = 3
        result = await invalidator.on_virtual_safety_car("session_123")
        assert result == 3
        mock_invalidate.assert_called_once_with("strategy:*:session_123")

@pytest.mark.asyncio
async def test_on_red_flag(invalidator):
    with patch("backend.services.cache_invalidator.invalidate_session_cache", new_callable=AsyncMock) as mock_invalidate:
        mock_invalidate.return_value = 10
        result = await invalidator.on_red_flag("session_123")
        assert result == 10
        mock_invalidate.assert_called_once_with("session_123")

@pytest.mark.asyncio
async def test_on_weather_change(invalidator):
    with patch("backend.services.cache_invalidator.invalidate_session_cache", new_callable=AsyncMock) as mock_invalidate:
        mock_invalidate.return_value = 15
        result = await invalidator.on_weather_change("session_123", "DRY", "WET")
        assert result == 15
        mock_invalidate.assert_called_once_with("session_123")

@pytest.mark.asyncio
async def test_on_pit_stop_completed(invalidator):
    with patch("backend.services.cache_invalidator.invalidate_driver_cache", new_callable=AsyncMock) as mock_invalidate:
        mock_invalidate.return_value = 2
        result = await invalidator.on_pit_stop_completed("session_123", "VER", "MEDIUM")
        assert result == 2
        mock_invalidate.assert_called_once_with("VER", "session_123")

@pytest.mark.asyncio
async def test_on_race_start(invalidator):
    with patch("backend.services.cache_invalidator.invalidate_session_cache", new_callable=AsyncMock) as mock_invalidate:
        mock_invalidate.return_value = 20
        result = await invalidator.on_race_start("session_123")
        assert result == 20
        mock_invalidate.assert_called_once_with("session_123")

@pytest.mark.asyncio
async def test_on_race_end(invalidator):
    with patch("backend.services.cache_invalidator.invalidate_cache", new_callable=AsyncMock) as mock_invalidate:
        mock_invalidate.return_value = 4
        result = await invalidator.on_race_end("session_123")
        assert result == 4
        mock_invalidate.assert_called_once_with("strategy:*:session_123")

@pytest.mark.asyncio
async def test_on_session_change(invalidator):
    with patch("backend.services.cache_invalidator.invalidate_session_cache", new_callable=AsyncMock) as mock_invalidate:
        mock_invalidate.side_effect = [5, 3]
        result = await invalidator.on_session_change("old_session_id", "new_session_id")
        assert result == 8
        assert mock_invalidate.call_count == 2

def test_invalidation_log_limit(invalidator):
    for i in range(105):
        invalidator._log_invalidation(
            RaceCondition.SAFETY_CAR,
            f"session_{i}",
            None,
            1,
            None
        )
    assert len(invalidator.invalidation_log) == 100

@pytest.mark.asyncio
async def test_invalidate_selective_with_driver(invalidator):
    with patch("backend.services.cache_invalidator.invalidate_driver_cache", new_callable=AsyncMock) as mock_invalidate:
        mock_invalidate.return_value = 2
        result = await invalidator.on_race_condition(
            RaceCondition.PIT_STOP_COMPLETED,
            "session_123",
            driver="VER",
            metadata={}
        )
        assert result == 2

@pytest.mark.asyncio
async def test_cache_invalidator_integration():
    """Integration test without deep Redis mocks."""
    invalidator = get_cache_invalidator()

    with patch("backend.services.cache_invalidator.invalidate_session_cache", new_callable=AsyncMock) as mock_invalidate:
        mock_invalidate.return_value = 5
        result = await invalidator.on_safety_car_deployed("session_123")
        assert result == 5
        mock_invalidate.assert_called_once_with("session_123")

        log = invalidator.get_invalidation_log()
        assert log[-1]["condition"] == RaceCondition.SAFETY_CAR.value
        assert log[-1]["session_id"] == "session_123"


@pytest.mark.asyncio
async def test_invalidate_selective_vsc(invalidator):
    """Test the VSC branch in _invalidate_selective (line 144-149 coverage)."""
    with patch("backend.services.cache_invalidator.invalidate_cache", new_callable=AsyncMock) as mock_invalidate:
        mock_invalidate.return_value = 1
        result = await invalidator._invalidate_selective(RaceCondition.VIRTUAL_SAFETY_CAR, "session_123")
        assert result == 1
        mock_invalidate.assert_called_once_with("strategy:*:session_123")

@pytest.mark.asyncio
async def test_invalidate_selective_full_session_fallback(invalidator):
    """Test the else branch in _invalidate_selective when driver is not provided and condition isn't VSC."""
    with patch("backend.services.cache_invalidator.invalidate_session_cache", new_callable=AsyncMock) as mock_invalidate:
        mock_invalidate.return_value = 1
        result = await invalidator._invalidate_selective(RaceCondition.RACE_START, "session_123")
        assert result == 1
        mock_invalidate.assert_called_once_with("session_123")
