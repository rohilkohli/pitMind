from typing import Any

from pydantic import BaseModel, Field

from models.race_state import TelemetryPayload


class StrategyScores(BaseModel):
    pit_urgency: float = Field(..., ge=0, le=100)
    sc_probability_next_3_laps: float = Field(..., ge=0, le=100)
    overtake_risk: float = Field(..., ge=0, le=100)
    recommended_window_laps: tuple[int, int]


class StrategyRecommendation(BaseModel):
    action: str
    pit_this_lap: bool
    suggested_compound: str
    scores: StrategyScores
    structured_reasons: list[str]
    explanation: str
    evidence: list[str]
    assumptions: list[str]
    confidence: float = Field(..., ge=0, le=100)
    alternative: str
    pipeline_steps: list[str]


class DriverCompareRequest(BaseModel):
    driver_a: TelemetryPayload
    driver_b: TelemetryPayload


class DriverCompareResponse(BaseModel):
    chart_series: dict[str, Any]
    narrative: str
