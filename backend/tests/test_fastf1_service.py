import pytest
import pandas as pd
from unittest.mock import patch, MagicMock

from backend.services.fastf1_service import is_fastf1_available, fetch_session_telemetry
from backend.models.race_state import TelemetryPayload

@pytest.fixture
def mock_fastf1_module():
    """Provides a mocked fastf1 module."""
    mock_fastf1 = MagicMock()

    # Mocking Cache
    mock_fastf1.Cache.enable_cache = MagicMock()

    # Mocking get_session
    mock_session = MagicMock()
    mock_session.load = MagicMock()

    mock_fastf1.get_session = MagicMock(return_value=mock_session)

    with patch.dict("sys.modules", {"fastf1": mock_fastf1}):
        yield mock_fastf1, mock_session


def test_is_fastf1_available_true(mock_fastf1_module):
    """Test that is_fastf1_available returns True when fastf1 is importable."""
    assert is_fastf1_available() is True


def test_is_fastf1_available_false():
    """Test that is_fastf1_available returns False when fastf1 raises ImportError."""
    with patch.dict("sys.modules", {"fastf1": None}):
        assert is_fastf1_available() is False


@pytest.mark.asyncio
async def test_fetch_session_telemetry_fastf1_unavailable():
    """Test fetch_session_telemetry raises RuntimeError when fastf1 is unavailable."""
    with patch.dict("sys.modules", {"fastf1": None}):
        with patch("backend.services.fastf1_service.is_fastf1_available", return_value=False):
            with pytest.raises(RuntimeError, match="FastF1 is not installed"):
                await fetch_session_telemetry(2023, "Monza", "Race", "VER")


@pytest.mark.asyncio
async def test_fetch_session_telemetry_happy_path(mock_fastf1_module):
    """Test fetch_session_telemetry with valid fastf1 data."""
    mock_fastf1, mock_session = mock_fastf1_module

    # Mocking driver laps dataframe
    df_data = {
        "Compound": ["SOFT", "MEDIUM", "HARD"],
        "LapNumber": [1, 2, 3],
        "LapTime": [pd.Timedelta(seconds=80), pd.Timedelta(seconds=82), pd.Timedelta(seconds=84)],
        "Sector1Time": [pd.Timedelta(seconds=25), pd.Timedelta(seconds=26), pd.Timedelta(seconds=27)],
        "Sector2Time": [pd.Timedelta(seconds=30), pd.Timedelta(seconds=31), pd.Timedelta(seconds=32)],
        "Sector3Time": [pd.Timedelta(seconds=25), pd.Timedelta(seconds=25), pd.Timedelta(seconds=25)],
    }
    mock_df = pd.DataFrame(df_data)

    mock_session.laps.pick_driver = MagicMock(return_value=mock_df)

    with patch("backend.services.fastf1_service.is_fastf1_available", return_value=True):
        payload = await fetch_session_telemetry(2023, "Monza", "Race", "VER")

        assert isinstance(payload, TelemetryPayload)
        assert payload.circuit == "Monza"
        assert payload.session_label == "2023 Monza Race"
        assert payload.driver == "VER"
        assert len(payload.laps) == 3

        # Verify first lap (SOFT compound)
        lap1 = payload.laps[0]
        assert lap1.lap == 1
        assert lap1.tyre_compound == "SOFT"
        assert lap1.lap_time_s == 80.0
        assert lap1.sector1_s == 25.0
        assert lap1.sector2_s == 30.0
        assert lap1.sector3_s == 25.0
        # SOFT wear is 2.0% per lap, so 1 * 2.0 = 2.0
        assert lap1.tyre_wear_pct == 2.0

        # Verify second lap (MEDIUM compound)
        lap2 = payload.laps[1]
        assert lap2.lap == 2
        assert lap2.tyre_compound == "MEDIUM"
        assert lap2.lap_time_s == 82.0
        # MEDIUM wear is 1.2% per lap, so 2 * 1.2 = 2.4
        assert lap2.tyre_wear_pct == 2.4

        # Verify third lap (HARD compound)
        lap3 = payload.laps[2]
        assert lap3.lap == 3
        assert lap3.tyre_compound == "HARD"
        assert lap3.lap_time_s == 84.0
        # HARD wear is 0.8% per lap, so 3 * 0.8 = 2.4
        assert lap3.tyre_wear_pct == 2.4

        # Check mock calls
        mock_fastf1.get_session.assert_called_once_with(2023, "Monza", "Race")
        mock_session.load.assert_called_once_with(laps=True, telemetry=False, weather=False)
        mock_session.laps.pick_driver.assert_called_once_with("VER")


@pytest.mark.asyncio
async def test_fetch_session_telemetry_empty_laps(mock_fastf1_module):
    """Test fetch_session_telemetry handles empty laps dataframe."""
    mock_fastf1, mock_session = mock_fastf1_module

    # Mock empty dataframe
    mock_df = pd.DataFrame()
    mock_session.laps.pick_driver = MagicMock(return_value=mock_df)

    with patch("backend.services.fastf1_service.is_fastf1_available", return_value=True):
        with pytest.raises(RuntimeError, match="Failed to fetch FastF1 data: No laps found for driver 'VER'"):
            await fetch_session_telemetry(2023, "Monza", "Race", "VER")


@pytest.mark.asyncio
async def test_fetch_session_telemetry_cache_failure(mock_fastf1_module, caplog):
    """Test fetch_session_telemetry warns if cache enable fails but continues."""
    mock_fastf1, mock_session = mock_fastf1_module

    mock_fastf1.Cache.enable_cache.side_effect = Exception("Cache error")

    # Mocking driver laps dataframe with just one lap
    df_data = {
        "Compound": ["SOFT"],
        "LapNumber": [1],
        "LapTime": [pd.Timedelta(seconds=80)],
        "Sector1Time": [pd.Timedelta(seconds=25)],
        "Sector2Time": [pd.Timedelta(seconds=30)],
        "Sector3Time": [pd.Timedelta(seconds=25)],
    }
    mock_df = pd.DataFrame(df_data)
    mock_session.laps.pick_driver = MagicMock(return_value=mock_df)

    with patch("backend.services.fastf1_service.is_fastf1_available", return_value=True):
        payload = await fetch_session_telemetry(2023, "Monza", "Race", "VER")

        # Ensures it still returns a valid payload
        assert len(payload.laps) == 1

        # Check logs for the warning
        assert "Could not enable FastF1 cache" in caplog.text


@pytest.mark.asyncio
async def test_fetch_session_telemetry_handles_missing_timedelta(mock_fastf1_module):
    """Test fetch_session_telemetry handles missing/NaN timedelta values."""
    mock_fastf1, mock_session = mock_fastf1_module

    # Mocking dataframe with missing times (NaT or None)
    df_data = {
        "Compound": ["SOFT"],
        "LapNumber": [1],
        "LapTime": [pd.NaT],
        "Sector1Time": [None],
        "Sector2Time": [float('nan')],
        "Sector3Time": [pd.Timedelta(seconds=25)],
    }
    mock_df = pd.DataFrame(df_data)
    mock_session.laps.pick_driver = MagicMock(return_value=mock_df)

    with patch("backend.services.fastf1_service.is_fastf1_available", return_value=True):
        payload = await fetch_session_telemetry(2023, "Monza", "Race", "VER")

        assert len(payload.laps) == 1
        lap1 = payload.laps[0]
        assert lap1.lap_time_s is None
        assert lap1.sector1_s is None
        assert lap1.sector2_s is None
        assert lap1.sector3_s == 25.0
