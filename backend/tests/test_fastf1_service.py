import pytest
import pandas as pd
from unittest.mock import patch, MagicMock
from backend.services.fastf1_service import fetch_session_telemetry, is_fastf1_available
import sys
import builtins
import importlib
import logging
import backend.services.fastf1_service

def test_fastf1_available():
    with patch("builtins.__import__") as mock_import:
        mock_import.return_value = MagicMock()
        assert is_fastf1_available() is True

def test_fastf1_not_available():
    with patch("builtins.__import__", side_effect=ImportError):
        assert is_fastf1_available() is False

def test_import_fallback_direct():
    import builtins

    original_import = builtins.__import__
    def mock_import(name, globals=None, locals=None, fromlist=(), level=0):
        # The line is `from ..models.race_state import TelemetryPayload, LapPoint`
        if fromlist and 'TelemetryPayload' in fromlist and level > 0:
            raise ImportError("Simulated import error")
        return original_import(name, globals, locals, fromlist, level)

    with patch("builtins.__import__", side_effect=mock_import):
        if "backend.services.fastf1_service" in sys.modules:
            del sys.modules["backend.services.fastf1_service"]
        import backend.services.fastf1_service
        assert hasattr(backend.services.fastf1_service, 'LapPoint')

@pytest.mark.asyncio
async def test_fetch_session_telemetry_no_fastf1():
    import backend.services.fastf1_service
    with patch("backend.services.fastf1_service.is_fastf1_available", return_value=False):
        with pytest.raises(RuntimeError, match="FastF1 is not installed"):
            await backend.services.fastf1_service.fetch_session_telemetry(2023, "Monza", "R", "VER")

@pytest.mark.asyncio
@patch("backend.services.fastf1_service.is_fastf1_available", return_value=True)
async def test_fetch_session_telemetry_success(mock_avail):
    # Setup mock data
    mock_session = MagicMock()
    mock_laps = MagicMock()
    mock_driver_laps = MagicMock()

    # Empty DataFrame check
    mock_driver_laps.empty = False

    # Mock lap data
    lap_data = [
        {"Compound": "SOFT", "LapNumber": 1, "LapTime": pd.Timedelta(seconds=82.5),
         "Sector1Time": pd.Timedelta(seconds=27.1), "Sector2Time": pd.Timedelta(seconds=28.2),
         "Sector3Time": pd.Timedelta(seconds=27.2)},
        {"Compound": "MEDIUM", "LapNumber": 2, "LapTime": pd.Timedelta(seconds=83.1),
         "Sector1Time": pd.Timedelta(seconds=27.3), "Sector2Time": pd.Timedelta(seconds=28.4),
         "Sector3Time": pd.Timedelta(seconds=27.4)},
        {"Compound": "HARD", "LapNumber": 3, "LapTime": pd.Timedelta(seconds=84.1),
         "Sector1Time": pd.Timedelta(seconds=27.5), "Sector2Time": pd.Timedelta(seconds=28.6),
         "Sector3Time": pd.Timedelta(seconds=28.0)},
        {"Compound": "HARD", "LapNumber": 4, "LapTime": None,
         "Sector1Time": None, "Sector2Time": None,
         "Sector3Time": None},
        {"Compound": "HARD", "LapNumber": 5, "LapTime": float('nan'),
         "Sector1Time": float('nan'), "Sector2Time": float('nan'),
         "Sector3Time": float('nan')}, # testing pd.notnull
    ]

    # We will simulate object without total_seconds callable
    class NoTotalSeconds:
        pass
    lap_data.append({"Compound": "HARD", "LapNumber": 6, "LapTime": NoTotalSeconds(),
         "Sector1Time": float('nan'), "Sector2Time": float('nan'),
         "Sector3Time": float('nan')})

    # Mock iterrows for DataFrame
    def mock_iterrows():
        for i, row in enumerate(lap_data):
            yield i, pd.Series(row)

    mock_driver_laps.iterrows = mock_iterrows
    mock_laps.pick_driver.return_value = mock_driver_laps
    mock_session.laps = mock_laps

    mock_fastf1 = MagicMock()
    mock_fastf1.get_session.return_value = mock_session

    with patch.dict('sys.modules', {'fastf1': mock_fastf1}):
        # In order for local import `import fastf1` inside `fetch_session_telemetry` to hit our mock,
        # we added it to `sys.modules`. Python will use our mock!

        result = await backend.services.fastf1_service.fetch_session_telemetry(2023, "Monza", "R", "VER")

        mock_fastf1.get_session.assert_called_once_with(2023, "Monza", "R")
        mock_session.load.assert_called_once_with(laps=True, telemetry=False, weather=False)
        mock_laps.pick_driver.assert_called_once_with("VER")

        assert result.circuit == "Monza"
        assert result.session_label == "2023 Monza R"
        assert result.driver == "VER"
        assert len(result.laps) == 6

@pytest.mark.asyncio
@patch("backend.services.fastf1_service.is_fastf1_available", return_value=True)
async def test_fetch_session_telemetry_no_laps_found(mock_avail):
    import backend.services.fastf1_service
    mock_session = MagicMock()
    mock_laps = MagicMock()
    mock_driver_laps = MagicMock()
    mock_driver_laps.empty = True

    mock_laps.pick_driver.return_value = mock_driver_laps
    mock_session.laps = mock_laps

    mock_fastf1 = MagicMock()
    mock_fastf1.get_session.return_value = mock_session

    with patch.dict('sys.modules', {'fastf1': mock_fastf1}):
        with pytest.raises(RuntimeError, match="No laps found for driver 'VER' in session 2023 Monza R"):
            await backend.services.fastf1_service.fetch_session_telemetry(2023, "Monza", "R", "VER")

@pytest.mark.asyncio
@patch("backend.services.fastf1_service.is_fastf1_available", return_value=True)
async def test_fetch_session_telemetry_api_error(mock_avail):
    import backend.services.fastf1_service
    mock_fastf1 = MagicMock()
    mock_fastf1.get_session.side_effect = Exception("API Error")

    with patch.dict('sys.modules', {'fastf1': mock_fastf1}):
        with pytest.raises(RuntimeError, match="Failed to fetch FastF1 data: API Error"):
            await backend.services.fastf1_service.fetch_session_telemetry(2023, "Monza", "R", "VER")

@pytest.mark.asyncio
@patch("backend.services.fastf1_service.is_fastf1_available", return_value=True)
async def test_fetch_session_telemetry_cache_error(mock_avail):
    import backend.services.fastf1_service
    mock_fastf1 = MagicMock()
    mock_fastf1.Cache.enable_cache.side_effect = Exception("Cache error")
    mock_fastf1.get_session.side_effect = Exception("API Error")

    with patch.dict('sys.modules', {'fastf1': mock_fastf1}), \
         patch("backend.services.fastf1_service.logger.warning") as mock_warning:
        with pytest.raises(RuntimeError, match="Failed to fetch FastF1 data: API Error"):
            await backend.services.fastf1_service.fetch_session_telemetry(2023, "Monza", "R", "VER")
        mock_warning.assert_called()
