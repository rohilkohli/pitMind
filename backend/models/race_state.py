
from pydantic import BaseModel, Field, field_validator

class LapPoint(BaseModel):
    lap: int = Field(..., ge=0, le=500)
    lap_time_s: float | None = Field(default=None, ge=0, le=600)
    sector1_s: float | None = Field(default=None, ge=0, le=200)
    sector2_s: float | None = Field(default=None, ge=0, le=200)
    sector3_s: float | None = Field(default=None, ge=0, le=200)
    tyre_wear_pct: float | None = Field(default=None, ge=0, le=100)
    tyre_compound: str | None = Field(default=None, max_length=32)
    fuel_kg: float | None = Field(default=None, ge=0, le=200)
    gap_ahead_s: float | None = None
    gap_behind_s: float | None = None

class TelemetryPayload(BaseModel):
    circuit: str = Field(default="Unknown", max_length=128)
    session_label: str = Field(default="Race", max_length=128)
    driver: str = Field(default="Driver", max_length=128)
    laps: list[LapPoint]

    @field_validator("laps")
    @classmethod
    def reasonable_lap_count(cls, v: list[LapPoint]) -> list[LapPoint]:
        if len(v) > 400:
            raise ValueError("Too many laps in payload (max 400)")
        if len(v) == 0:
            raise ValueError("At least one lap required")
        return v
