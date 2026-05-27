"""CSV/JSON ingestion helpers with size limits and basic sanitization."""

from __future__ import annotations

import io
import json
import re
from typing import Any

import pandas as pd

try:
    from ..models.race_state import LapPoint, TelemetryPayload
except ImportError:
    from models.race_state import LapPoint, TelemetryPayload

MAX_UPLOAD_BYTES = 2 * 1024 * 1024
_ALLOWED_COMPOUNDS = frozenset({"SOFT", "MEDIUM", "HARD", "INTER", "WET", "UNKNOWN"})


def _clean_str(value: Any, max_len: int = 128) -> str:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return ""
    s = str(value).strip()
    s = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", s)
    return s[:max_len]


def telemetry_from_records(records: list[dict[str, Any]]) -> TelemetryPayload:
    if len(records) > 400:
        raise ValueError("Too many rows")

    laps: list[LapPoint] = []
    for row in records:
        compound_raw = _clean_str(row.get("tyre_compound") or row.get("Compound") or row.get("compound"), 32).upper()
        compound = compound_raw if compound_raw in _ALLOWED_COMPOUNDS else (
            compound_raw[:16] if compound_raw else None
        )

        def num(key: str, lo: float | None = None, hi: float | None = None) -> float | None:
            v = row.get(key)
            if v is None or (isinstance(v, float) and pd.isna(v)):
                return None
            try:
                x = float(v)
            except (TypeError, ValueError):
                return None
            if lo is not None and x < lo:
                return None
            if hi is not None and x > hi:
                return None
            return x

        lap = int(row.get("lap") or row.get("LapNumber") or 0)
        laps.append(
            LapPoint(
                lap=lap,
                lap_time_s=num("lap_time_s") or num("LapTime") or num("lap_time"),
                sector1_s=num("sector1_s") or num("Sector1Time") or num("sector1"),
                sector2_s=num("sector2_s") or num("Sector2Time") or num("sector2"),
                sector3_s=num("sector3_s") or num("Sector3Time") or num("sector3"),
                tyre_wear_pct=num("tyre_wear_pct", 0, 100) or num("tyre_wear", 0, 100) or num("tyre_wear_pct"),
                tyre_compound=compound,
                fuel_kg=num("fuel_kg", 0, 200) or num("fuel_load", 0, 200),
                gap_ahead_s=num("gap_ahead_s") or num("gap_to_leader"),
                gap_behind_s=num("gap_behind_s") or num("gap_to_car_behind"),
            )
        )

    circuit = _clean_str(records[0].get("circuit") or records[0].get("Circuit"), 128) or "Unknown"
    driver = _clean_str(records[0].get("driver") or records[0].get("Driver"), 128) or "Driver"
    session = _clean_str(records[0].get("session") or records[0].get("Session"), 128) or "Race"

    return TelemetryPayload(circuit=circuit, session_label=session, driver=driver, laps=laps)


def parse_upload_csv(content: bytes) -> TelemetryPayload:
    if len(content) > MAX_UPLOAD_BYTES:
        raise ValueError("File too large")

    text = content.decode("utf-8", errors="replace")
    buf = io.StringIO(text)
    df = pd.read_csv(buf)
    if df.shape[0] > 400 or df.shape[1] > 64:
        raise ValueError("CSV dimensions exceed limits")

    records = df.to_dict(orient="records")
    return telemetry_from_records(records)


def parse_upload_json(content: bytes) -> TelemetryPayload:
    if len(content) > MAX_UPLOAD_BYTES:
        raise ValueError("File too large")

    data = json.loads(content.decode("utf-8"))
    if isinstance(data, dict) and "laps" in data:
        inner = data["laps"]
        circuit = _clean_str(data.get("circuit"), 128)
        driver = _clean_str(data.get("driver"), 128)
        session = _clean_str(data.get("session_label") or data.get("session"), 128)
        records = inner if isinstance(inner, list) else []
        payload = telemetry_from_records(records)
        return TelemetryPayload(
            circuit=circuit or payload.circuit,
            session_label=session or payload.session_label,
            driver=driver or payload.driver,
            laps=payload.laps,
        )
    if isinstance(data, list):
        return telemetry_from_records(data)
    raise ValueError("Unsupported JSON shape")
