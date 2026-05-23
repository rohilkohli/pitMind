import logging
import os
import pandas as pd
try:
    from ..models.race_state import TelemetryPayload, LapPoint  # noqa: F401
except ImportError:
    from models.race_state import TelemetryPayload, LapPoint

logger = logging.getLogger(__name__)

def is_fastf1_available() -> bool:
    """Check if the FastF1 library is installed and available."""
    try:
        import fastf1  # noqa: F401
        return True
    except ImportError:
        return False

async def fetch_session_telemetry(year: int, event: str, session_type: str, driver_code: str) -> TelemetryPayload:
    """
    Fetch session data from FastF1 and convert it to PitMind TelemetryPayload.
    Requires 'fastf1' to be installed.
    """
    if not is_fastf1_available():
        raise RuntimeError("FastF1 is not installed. Please uncomment it in requirements.txt and install it.")

    import fastf1  # noqa: F401
    
    # Enable caching to speed up repeated requests
    cache_dir = os.path.join(os.getcwd(), "data", "fastf1_cache")
    os.makedirs(cache_dir, exist_ok=True)
    try:
        fastf1.Cache.enable_cache(cache_dir)
    except Exception as e:
        logger.warning(f"Could not enable FastF1 cache at {cache_dir}: {e}")

    logger.info(f"Fetching FastF1 data for {year} {event} {session_type} - {driver_code}")
    
    try:
        # Load the session
        session = fastf1.get_session(year, event, session_type)
        session.load(laps=True, telemetry=False, weather=False)
        
        # Pick the driver
        laps = session.laps.pick_driver(driver_code)
        if laps.empty:
            raise ValueError(f"No laps found for driver '{driver_code}' in session {year} {event} {session_type}")

        lap_points = []
        for _, lap in laps.iterrows():
            # Heuristic for tyre wear since FastF1 doesn't provide it directly
            compound = str(lap.get("Compound", "MEDIUM")).upper()
            lap_number = int(lap.get("LapNumber", 0))
            
            # Simple wear simulation: 2.0% per lap for Soft, 1.2% for Medium, 0.8% for Hard
            wear_rate = 2.0 if "SOFT" in compound else (1.2 if "MEDIUM" in compound else 0.8)
            simulated_wear = min(100.0, lap_number * wear_rate)

            # Convert Timedelta to seconds
            def to_seconds(td):
                if pd.notnull(td) and hasattr(td, 'total_seconds'):
                    return td.total_seconds()
                return None

            lap_points.append(LapPoint(
                lap=lap_number,
                lap_time_s=to_seconds(lap.get("LapTime")),
                sector1_s=to_seconds(lap.get("Sector1Time")),
                sector2_s=to_seconds(lap.get("Sector2Time")),
                sector3_s=to_seconds(lap.get("Sector3Time")),
                tyre_wear_pct=round(simulated_wear, 2),
                tyre_compound=compound,
                fuel_kg=None,
                gap_ahead_s=None,
                gap_behind_s=None
            ))

        return TelemetryPayload(
            circuit=event,
            session_label=f"{year} {event} {session_type}",
            driver=driver_code,
            laps=lap_points
        )
    except Exception as e:
        logger.error(f"FastF1 error: {e}")
        raise RuntimeError(f"Failed to fetch FastF1 data: {str(e)}")
