"""Rule-based + heuristic scoring for pit windows and compounds."""

from __future__ import annotations

import logging
from statistics import mean
from typing import Optional

try:
    from ..config import get_settings  # noqa: F401
    from ..models.race_state import LapPoint, TelemetryPayload  # noqa: F401
    from ..models.strategy import StrategyRecommendation, StrategyScores  # noqa: F401
    from .cache_manager import (  # noqa: F401
        generate_heuristic_cache_key,
        get_cached_strategy,
        set_cached_strategy,
    )
except ImportError:
    from config import get_settings
    from models.race_state import LapPoint, TelemetryPayload
    from models.strategy import StrategyRecommendation, StrategyScores
    from services.cache_manager import (
        generate_heuristic_cache_key,
        get_cached_strategy,
        set_cached_strategy,
    )

logger = logging.getLogger(__name__)


def _latest_wear(laps: list[LapPoint]) -> float:
    wears = [lp.tyre_wear_pct for lp in laps if lp.tyre_wear_pct is not None]
    return wears[-1] if wears else 55.0


def _lap_time_trend(laps: list[LapPoint]) -> float:
    times = [lp.lap_time_s for lp in laps[-8:] if lp.lap_time_s is not None]
    if len(times) < 3:
        return 0.0
    early = mean(times[: len(times) // 2])
    late = mean(times[len(times) // 2 :])
    return max(0.0, late - early)


def _gap_volatility(laps: list[LapPoint]) -> float:
    gaps = [lp.gap_ahead_s for lp in laps[-10:] if lp.gap_ahead_s is not None]
    if len(gaps) < 3:
        return 0.3
    m = mean(gaps)
    var = mean((g - m) ** 2 for g in gaps)
    return min(1.0, var**0.5 / max(0.5, abs(m) + 0.5))


async def predict_strategy(
    payload: TelemetryPayload,
    session_id: Optional[str] = None,
    bypass_cache: bool = False,
) -> tuple[StrategyScores, list[str], dict]:
    """
    Predict strategy with caching support.
    
    Args:
        payload: Telemetry payload
        session_id: Optional session identifier for cache scoping
        bypass_cache: If True, skip cache and force fresh computation
        
    Returns:
        Tuple of (scores, reasons, metadata)
    """
    settings = get_settings()
    
    # Check cache first (unless bypassed or disabled)
    if settings.cache_enabled and not bypass_cache:
        cache_key = generate_heuristic_cache_key(payload, session_id)
        cached_result = await get_cached_strategy(cache_key)
        
        if cached_result is not None:
            logger.info(f"Cache HIT for heuristic scoring: {cache_key[:32]}...")
            # Extract cached data
            if isinstance(cached_result, dict) and "data" in cached_result:
                data = cached_result["data"]
                if isinstance(data, dict):
                    scores = StrategyScores(**data["scores"])
                    return scores, data["reasons"], data["meta"]
    
    # Cache miss or bypassed - compute fresh
    laps = sorted(payload.laps, key=lambda x: x.lap)
    wear = _latest_wear(laps)
    degradation = _lap_time_trend(laps)
    gap_vol = _gap_volatility(laps)

    pit_urgency = min(
        100.0,
        max(0.0, wear * 0.65 + degradation * 120 + (gap_vol * 25)),
    )

    sc_probability = min(100.0, max(5.0, gap_vol * 55 + degradation * 80))

    threat_behind = laps[-1].gap_behind_s if laps and laps[-1].gap_behind_s is not None else 1.2
    overtake_risk = min(100.0, max(10.0, 70 - threat_behind * 25 + degradation * 40))

    current_lap = laps[-1].lap if laps else 0
    window_start = current_lap + 1
    window_end = current_lap + 4

    if pit_urgency >= 78:
        reasons = [
            f"Tyre wear proxy at ~{wear:.0f}% with rising lap-time delta (~{degradation:.2f}s trend).",
            "Closing pit window aligns with minimizing time lost to compound drop-off.",
        ]
    elif pit_urgency >= 62:
        reasons = [
            "Wear approaching critical band but lap-time loss still manageable short-term.",
            f"Monitor gap volatility (~{gap_vol:.2f}); flexible stop across laps {window_start}-{window_end}.",
        ]
    else:
        reasons = [
            "Tyre life and pace stability favor extending stint.",
            "Re-evaluate after next telemetry batch or SC signal.",
        ]

    compound = laps[-1].tyre_compound if laps and laps[-1].tyre_compound else "MEDIUM"
    compound_upper = str(compound).upper()
    suggested = "HARD" if pit_urgency > 70 and "SOFT" in compound_upper else (
        "MEDIUM" if compound_upper in {"SOFT", "UNKNOWN"} else compound_upper
    )

    meta = {
        "wear": wear,
        "degradation": degradation,
        "gap_volatility": gap_vol,
        "current_lap": current_lap,
        "circuit": payload.circuit,
        "driver": payload.driver,
        "suggested_compound": suggested,
    }

    scores = StrategyScores(
        pit_urgency=round(pit_urgency, 2),
        sc_probability_next_3_laps=round(sc_probability, 2),
        overtake_risk=round(overtake_risk, 2),
        recommended_window_laps=(window_start, window_end),
    )
    
    # Cache the result
    if settings.cache_enabled and not bypass_cache:
        cache_key = generate_heuristic_cache_key(payload, session_id)
        cache_data = {
            "scores": scores.model_dump(),
            "reasons": reasons,
            "meta": meta,
        }
        await set_cached_strategy(cache_key, cache_data, ttl=settings.cache_ttl_strategy)
        logger.info(f"Cached heuristic scoring: {cache_key[:32]}...")
    
    return scores, reasons, meta


async def build_recommendation(
    payload: TelemetryPayload,
    session_id: Optional[str] = None,
    bypass_cache: bool = False,
) -> StrategyRecommendation:
    """
    Build strategy recommendation with caching support.
    
    Args:
        payload: Telemetry payload
        session_id: Optional session identifier for cache scoping
        bypass_cache: If True, skip cache and force fresh computation
        
    Returns:
        Complete strategy recommendation
    """
    scores, reasons, meta = await predict_strategy(payload, session_id, bypass_cache)

    pit_now = scores.pit_urgency >= 78
    action = "PIT THIS LAP" if pit_now else "STAY OUT — PREPARE WINDOW"

    explanation_stub = (
        f"Pitting {'now' if pit_now else 'in the next stop window'} is suggested because "
        f"tyre wear sits near {meta['wear']:.0f}% with ~{meta['degradation']:.2f}s lap-time trend; "
        f"gap volatility hints SC clustering probability ~{scores.sc_probability_next_3_laps:.0f}% "
        "over the next few laps (heuristic)."
    )
    window_start, window_end = scores.recommended_window_laps
    evidence = [
        f"Tyre wear proxy ~{meta['wear']:.0f}% with lap-time trend +{meta['degradation']:.2f}s.",
        f"Gap volatility index {meta['gap_volatility']:.2f} (SC probability {scores.sc_probability_next_3_laps:.0f}%).",
        f"Recommended pit window laps {window_start}-{window_end} (current lap {meta['current_lap']}).",
    ]
    assumptions = [
        "Telemetry snapshot reflects current pace without major traffic shifts.",
        "No unexpected safety car beyond volatility heuristic.",
        "Tyre wear estimate assumes steady push laps, not peak-attack bursts.",
    ]
    alternative = (
        f"Hold to laps {window_start}-{window_end} if degradation stabilizes; "
        "pit immediately if wear spikes above ~80% or lap-time loss grows >0.3s."
    )
    if pit_now:
        confidence = max(40.0, min(100.0, scores.pit_urgency))
    else:
        confidence = max(40.0, min(100.0, 100.0 - scores.pit_urgency))

    return StrategyRecommendation(
        action=action,
        pit_this_lap=pit_now,
        suggested_compound=str(meta.get("suggested_compound", "MEDIUM")),
        scores=scores,
        structured_reasons=reasons,
        explanation=explanation_stub,
        evidence=evidence,
        assumptions=assumptions,
        confidence=round(confidence, 1),
        alternative=alternative,
        pipeline_steps=[
            "preprocess.telemetry.normalize",
            "strategy.heuristic.pit_window",
            "llm.granite.explain",
        ],
    )
