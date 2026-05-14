from typing import Any

from pydantic import BaseModel, Field

try:
    from .race_state import TelemetryPayload
except ImportError:
    from models.race_state import TelemetryPayload


class StrategyScores(BaseModel):
    pit_urgency: float = Field(..., ge=0, le=100)
    sc_probability_next_3_laps: float = Field(..., ge=0, le=100)
    overtake_risk: float = Field(..., ge=0, le=100)
    recommended_window_laps: tuple[int, int]


class ConfidenceDecomposition(BaseModel):
    data_quality: float = Field(..., ge=0, le=100, description="% completeness and reliability of telemetry inputs")
    model_certainty: float = Field(..., ge=0, le=100, description="confidence in model predictions")
    stability: float = Field(..., ge=0, le=100, description="consistency across similar scenarios")
    regret_bound: float = Field(..., ge=0, le=1, description="max expected loss vs optimal")


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
    confidence_decomposition: ConfidenceDecomposition | None = None


class DriverCompareRequest(BaseModel):
    driver_a: TelemetryPayload
    driver_b: TelemetryPayload


class DriverCompareResponse(BaseModel):
    chart_series: dict[str, Any]
    narrative: str


class FastF1Request(BaseModel):
    year: int = Field(..., ge=2018, le=2025)
    event: str = Field(..., min_length=2)
    session_type: str = Field(default="R", pattern="^(R|Q|S|FP1|FP2|FP3)$")
    driver_code: str = Field(..., min_length=2, max_length=3)


class StrategyChecklist(BaseModel):
    pit_crew_ready: bool = False
    tyre_set_confirmed: bool = False
    radio_call_prepared: bool = False


class StrategyCommitRequest(BaseModel):
    recommendation: StrategyRecommendation
    checklist: StrategyChecklist
    execution_brief: str = Field(..., min_length=1)
    session_context: dict[str, Any] = Field(default_factory=dict)


class StrategyCommitResponse(BaseModel):
    audit_id: str
    status: str
    message: str
    committed_at: str
