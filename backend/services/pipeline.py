"""Orchestrates preprocessing → strategy → optional Langflow → Granite explanation."""

from __future__ import annotations

import json
from typing import Any

from models.strategy import StrategyRecommendation
from models.race_state import TelemetryPayload
from services import granite, langflow_client
from services.strategy_engine import build_recommendation


def _extract_granite_json(raw: str) -> dict[str, Any] | None:
    if not raw:
        return None
    start = raw.find("{")
    end = raw.rfind("}")
    if start < 0 or end <= start:
        return None
    try:
        return json.loads(raw[start : end + 1])
    except json.JSONDecodeError:
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

    base = build_recommendation(payload)
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
        "summary, evidence, confidence, assumptions, alternative. Summary must be 1-3 sentences, "
        "confidence is 0-100, evidence/assumptions are string arrays. Use plausible motorsport reasoning."
    )
    user = (
        f"Telemetry summary for {payload.driver} at {payload.circuit}: {context}. "
        f"Recommended action: {base.action}. Pit now: {base.pit_this_lap}. "
        f"Suggested compound: {base.suggested_compound}."
    )

    granite_raw = await granite.granite_generate(system, user)
    explanation, evidence, assumptions, confidence, alternative = _merge_granite_explainability(granite_raw, base)
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
    )


async def compare_narrative(summary_a: str, summary_b: str) -> str:
    system = "You are PitMind. Compare two drivers' stint narratives for engineers. Under 200 words."
    user = f"Driver A:\n{summary_a}\n\nDriver B:\n{summary_b}"
    return (await granite.granite_generate(system, user)).strip()


async def debrief_from_text(doc_text: str) -> str:
    system = (
        "You are PitMind post-race chief strategist. Produce a concise markdown debrief: bullets for pace, "
        "tyres, strategy calls, risks, and one 'next race' action. Under 250 words."
    )
    user = f"Parsed race document / CSV excerpt:\n{doc_text[:12000]}"
    return (await granite.granite_generate(system, user)).strip()
