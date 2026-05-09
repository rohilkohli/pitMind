"""Orchestrates preprocessing → strategy → optional Langflow → Granite explanation."""

from __future__ import annotations

from typing import Any

from models.strategy import StrategyRecommendation
from models.race_state import TelemetryPayload
from services import granite, langflow_client
from services.strategy_engine import build_recommendation


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
        pipeline_steps=steps,
    )

    context = {
        "scores": base.scores.model_dump(),
        "reasons": base.structured_reasons,
        "telemetry": {"circuit": payload.circuit, "driver": payload.driver, "laps": len(payload.laps)},
        "langflow": lf_result,
    }

    system = (
        "You are PitMind, an F1 race engineer copilot. Explain strategy succinctly for a stressed engineer. "
        "Use only plausible motorsport reasoning; if uncertainty remains, say so. Under 180 words."
    )
    user = (
        f"Telemetry summary for {payload.driver} at {payload.circuit}: {context}. "
        f"Recommended action: {base.action}. Pit now: {base.pit_this_lap}. "
        f"Suggested compound: {base.suggested_compound}."
    )

    explanation = await granite.granite_generate(system, user)
    return StrategyRecommendation(
        action=base.action,
        pit_this_lap=base.pit_this_lap,
        suggested_compound=base.suggested_compound,
        scores=base.scores,
        structured_reasons=base.structured_reasons,
        explanation=explanation.strip(),
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
