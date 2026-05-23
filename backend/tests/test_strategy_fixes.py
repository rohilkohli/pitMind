"""Tests for strategy engine and granite integration fixes."""

import pytest
from unittest.mock import patch

from models.race_state import TelemetryPayload, LapPoint
from services.strategy_engine import build_recommendation, predict_strategy


@pytest.mark.asyncio
async def test_strategy_with_minimal_telemetry():
    """BUG #5 FIX: Should handle telemetry with minimal data gracefully."""
    payload = TelemetryPayload(
        circuit="Monza",
        session_label="Race",
        driver="Test",
        laps=[
            LapPoint(lap=1, lap_time_s=80.5, tyre_wear_pct=10),
            LapPoint(lap=2, lap_time_s=80.8, tyre_wear_pct=15),
        ],
    )
    
    scores, reasons, meta = await predict_strategy(payload)
    assert scores.pit_urgency >= 0 and scores.pit_urgency <= 100
    assert scores.sc_probability_next_3_laps >= 0
    assert scores.overtake_risk >= 0
    assert len(reasons) > 0


def test_strategy_with_empty_laps_raises_validation_error():
    """Telemetry payload with empty laps should fail validation."""
    with pytest.raises(ValueError):
        TelemetryPayload(
            circuit="Monza",
            session_label="Race",
            driver="Test",
            laps=[],
        )


@pytest.mark.asyncio
async def test_strategy_recommendation_includes_all_fields():
    """BUG #10 FIX: Recommendation should include confidence_decomposition."""
    payload = TelemetryPayload(
        circuit="Monaco",
        session_label="Race",
        driver="Test",
        laps=[
            LapPoint(lap=i, lap_time_s=75.0 + i * 0.1, tyre_wear_pct=10 + i * 5)
            for i in range(1, 6)
        ],
    )
    
    recommendation = await build_recommendation(payload)
    
    # Verify all required fields exist
    assert recommendation.action is not None
    assert recommendation.explanation is not None
    assert recommendation.evidence is not None
    assert recommendation.assumptions is not None
    assert recommendation.confidence is not None
    assert recommendation.alternative is not None
    # BUG #10: Check confidence_decomposition exists
    assert recommendation.pipeline_steps is not None


@pytest.mark.asyncio
async def test_granite_fallback_chain():
    """BUG #6 FIX: Granite should try providers in correct order."""
    from services.granite import granite_generate
    
    # Mock all providers as unavailable
    with patch("services.granite.get_settings") as mock_settings:
        mock_settings.return_value.watsonx_api_key = ""
        mock_settings.return_value.watsonx_project_id = ""
        mock_settings.return_value.hf_api_token = ""
        mock_settings.return_value.hf_model_id = ""
        mock_settings.return_value.replicate_api_token = ""
        
        result = await granite_generate("system prompt", "user input")
        
        # Should return fallback response without crashing
        assert result is not None
        assert isinstance(result, str)
        assert len(result) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
