"""Orchestrates preprocessing → strategy → optional Langflow → Granite explanation."""

from __future__ import annotations

import json
from typing import Any

try:
    from ..models.strategy import StrategyRecommendation
    from ..models.race_state import TelemetryPayload
    from . import granite, langflow_client
    from .strategy_engine import build_recommendation
except ImportError:
    from models.strategy import StrategyRecommendation
    from models.race_state import TelemetryPayload
    from services import granite, langflow_client
    from services.strategy_engine import build_recommendation


def _extract_granite_json(raw: str) -> dict[str, Any] | None:
    """Extract the first complete JSON object from raw text.
    
    Handles cases where the response contains multiple JSON objects
    by using brace-depth tracking to find the first complete one.
    """
    if not raw:
        return None
    
    # Find the first opening brace
    start = raw.find("{")
    if start < 0:
        return None
    
    # Track brace depth to find the matching closing brace for the first object
    depth = 0
    for i in range(start, len(raw)):
        if raw[i] == "{":
            depth += 1
        elif raw[i] == "}":
            depth -= 1
            if depth == 0:
                # Found the closing brace of the first object
                try:
                    return json.loads(raw[start : i + 1])
                except json.JSONDecodeError:
                    return None
    
    # No matching closing brace found
    return None


def _coerce_list(value: Any, fallback: list[str]) -> list[str]:
    if isinstance(value, list):
        items = [str(item).strip() for item in value if str(item).strip()]
        if items:
            return items
    return fallback


def _coerce_text(value: Any, fallback: str) -> str:
    if isinstance(value, str) and value.strip():
        return value.strip()
    return fallback


def _coerce_confidence(value: Any, fallback: float) -> float:
    try:
        num = float(value)
    except (TypeError, ValueError):
        return fallback
    if num <= 1.0:
        num *= 100.0
    return max(0.0, min(100.0, num))


def _merge_granite_explainability(raw: str, base: StrategyRecommendation) -> tuple[str, list[str], list[str], float, str]:
    fallback_explanation = raw.strip() if raw.strip() else base.explanation
    payload = _extract_granite_json(raw)
    if not payload:
        return (
            fallback_explanation,
            base.evidence,
            base.assumptions,
            base.confidence,
            base.alternative,
        )

    summary = (
        payload.get("summary")
        or payload.get("prose")
        or payload.get("recommendation")
        or payload.get("explanation")
    )
    explanation = _coerce_text(summary, fallback_explanation)
    evidence = _coerce_list(payload.get("evidence"), base.evidence)
    assumptions = _coerce_list(payload.get("assumptions"), base.assumptions)
    alternative = _coerce_text(payload.get("alternative"), base.alternative)
    confidence = _coerce_confidence(payload.get("confidence"), base.confidence)
    return explanation, evidence, assumptions, confidence, alternative


async def run_strategy_pipeline(payload: TelemetryPayload) -> StrategyRecommendation:
    lf_payload: dict[str, Any] = {
        "circuit": payload.circuit,
        "driver": payload.driver,
        "lap_count": len(payload.laps),
        "last_lap": payload.laps[-1].model_dump() if payload.laps else {},
    }

    lf_result = await langflow_client.run_strategy_flow(lf_payload)
    steps = [
        "Step 1: Preprocess telemetry (normalize compounds, caps, sector splits)",
        "Step 2: Heuristic pit window + compound scoring",
    ]
    if lf_result:
        steps.append("Step 2b: Langflow graph merged external signals (if configured)")
    steps.append("Step 3: IBM Granite natural-language explanation")

    base = await build_recommendation(payload)
    base = StrategyRecommendation(
        action=base.action,
        pit_this_lap=base.pit_this_lap,
        suggested_compound=base.suggested_compound,
        scores=base.scores,
        structured_reasons=base.structured_reasons,
        explanation=base.explanation,
        evidence=base.evidence,
        assumptions=base.assumptions,
        confidence=base.confidence,
        alternative=base.alternative,
        pipeline_steps=steps,
    )

    context = {
        "scores": base.scores.model_dump(),
        "reasons": base.structured_reasons,
        "telemetry": {"circuit": payload.circuit, "driver": payload.driver, "laps": len(payload.laps)},
        "langflow": lf_result,
    }

    system = (
        "You are PitMind, an F1 race engineer copilot. Return ONLY JSON with keys "
        "summary, evidence, confidence, assumptions, alternative. Keep the summary extremely concise, clean, and informative (1-2 short sentences max). "
        "confidence is 0-100, evidence/assumptions are short string arrays (max 2 items each, bullet-point style). Use precise motorsport reasoning."
    )
    user = (
        f"Telemetry summary for {payload.driver} at {payload.circuit}: {context}. "
        f"Recommended action: {base.action}. Pit now: {base.pit_this_lap}. "
        f"Suggested compound: {base.suggested_compound}."
    )

    granite_raw = await granite.granite_generate(system, user)
    explanation, evidence, assumptions, confidence, alternative = _merge_granite_explainability(granite_raw, base)
    
    # Build confidence decomposition based on data quality and model certainty
    try:
        from ..models.strategy import ConfidenceDecomposition
    except ImportError:
        from models.strategy import ConfidenceDecomposition
    confidence_decomposition = ConfidenceDecomposition(
        data_quality=min(100.0, max(20.0, 50 + len([lap for lap in payload.laps if lap.lap_time_s]) / len(payload.laps) * 40)) if payload.laps else 20,
        model_certainty=confidence,
        stability=min(100.0, max(40.0, 60 if base.scores.pit_urgency >= 62 else 40)),
        regret_bound=max(0.0, min(1.0, (100 - confidence) / 100)),
    )
    
    return StrategyRecommendation(
        action=base.action,
        pit_this_lap=base.pit_this_lap,
        suggested_compound=base.suggested_compound,
        scores=base.scores,
        structured_reasons=base.structured_reasons,
        explanation=explanation,
        evidence=evidence,
        assumptions=assumptions,
        confidence=confidence,
        alternative=alternative,
        pipeline_steps=base.pipeline_steps,
        confidence_decomposition=confidence_decomposition,
    )


async def compare_narrative(summary_a: str, summary_b: str) -> str:
    system = "You are PitMind. Compare two drivers' stint narratives for engineers. Be extremely concise, clean, and informative. Use short bullet points. Maximum 50 words."
    user = f"Driver A:\n{summary_a}\n\nDriver B:\n{summary_b}"
    return (await granite.granite_generate(system, user)).strip()


async def debrief_from_text(doc_text: str) -> str:
    system = (
        "You are PitMind, a Senior Chief Race Strategist for a Formula 1 team. "
        "Your task is to analyze raw race data, telemetry excerpts, or session reports and produce a high-stakes, "
        "technical post-race debrief. Focus on precise metrics (pace deltas, tyre degradation % per lap, "
        "pit window efficiency, and undercut/overcut success). "
        "Use Formula 1 terminology (e.g., 'dirty air', 'box-to-box', 'out-lap', 'ERS deployment').\n\n"
        "Format the report in Markdown with the following sections:\n"
        "# POST-RACE STRATEGIC DEBRIEF\n"
        "## 1. PERFORMANCE & PACE ANALYSIS\n"
        "## 2. TYRE MANAGEMENT & DEGRADATION\n"
        "## 3. CRITICAL STRATEGY CALLS\n"
        "## 4. RISK & INCIDENT ASSESSMENT\n"
        "## 5. FORWARD-LOOKING ACTIONS (NEXT RACE)\n\n"
        "Keep the tone professional, objective, and data-driven. Be extremely concise and informative. Use brief bullet points instead of long paragraphs. Limit to 150 words total."
    )
    user = f"SESSION DATA EXCERPT:\n{doc_text[:15000]}"
    return (await granite.granite_generate(system, user)).strip()
