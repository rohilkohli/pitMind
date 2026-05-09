import pytest

from models.race_state import LapPoint, TelemetryPayload
from services.strategy_engine import predict_strategy


def _sample_payload(wear: float = 50.0, degradation_trend: float = 0.0) -> TelemetryPayload:
    laps: list[LapPoint] = []
    base_time = 82.0
    for i in range(1, 21):
        t = base_time + degradation_trend * max(0, i - 12)
        laps.append(
            LapPoint(
                lap=i,
                lap_time_s=t,
                sector1_s=t / 3,
                sector2_s=t / 3,
                sector3_s=t / 3,
                tyre_wear_pct=min(95.0, wear + i * 1.2),
                tyre_compound="SOFT",
                fuel_kg=100 - i * 1.5,
                gap_ahead_s=1.0 + (i % 4) * 0.05,
                gap_behind_s=1.5,
            )
        )
    return TelemetryPayload(circuit="Monza", session_label="R", driver="VER", laps=laps)


def test_predict_strategy_high_wear_triggers_urgency():
    payload = _sample_payload(wear=72.0, degradation_trend=0.25)
    scores, reasons, meta = predict_strategy(payload)
    assert scores.pit_urgency >= 70
    assert len(reasons) >= 1
    assert meta["circuit"] == "Monza"


def test_predict_strategy_stable_stint_lowers_urgency():
    payload = _sample_payload(wear=30.0, degradation_trend=0.01)
    scores, _, _ = predict_strategy(payload)
    assert scores.pit_urgency < 78
