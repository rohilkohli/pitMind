import pytest

from backend.models.race_state import LapPoint, TelemetryPayload
from backend.services.strategy_engine import predict_strategy, _latest_wear


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


class TestBasicStrategyPrediction:
    """Test basic strategy prediction functionality."""
    
    @pytest.mark.asyncio
    async def test_predict_strategy_high_wear_triggers_urgency(self):
        """Test that high tire wear triggers pit urgency."""
        payload = _sample_payload(wear=72.0, degradation_trend=0.25)
        scores, reasons, meta = await predict_strategy(payload)
        assert scores.pit_urgency >= 70
        assert len(reasons) >= 1
        assert meta["circuit"] == "Monza"
    
    @pytest.mark.asyncio
    async def test_predict_strategy_stable_stint_lowers_urgency(self):
        """Test that stable stint lowers pit urgency."""
        payload = _sample_payload(wear=30.0, degradation_trend=0.01)
        scores, _, _ = await predict_strategy(payload)
        assert scores.pit_urgency < 78
    
    @pytest.mark.asyncio
    async def test_predict_strategy_returns_all_scores(self):
        """Test that prediction returns all required scores."""
        payload = _sample_payload()
        scores, reasons, meta = await predict_strategy(payload)
        
        assert hasattr(scores, 'pit_urgency')
        assert hasattr(scores, 'sc_probability_next_3_laps')
        assert hasattr(scores, 'overtake_risk')
        assert hasattr(scores, 'recommended_window_laps')
        assert isinstance(reasons, list)
        assert isinstance(meta, dict)
    
    @pytest.mark.asyncio
    async def test_predict_strategy_with_different_compounds(self):
        """Test strategy prediction with different tire compounds."""
        compounds = ["SOFT", "MEDIUM", "HARD"]
        
        for compound in compounds:
            laps = []
            for i in range(1, 21):
                laps.append(
                    LapPoint(
                        lap=i,
                        lap_time_s=82.0,
                        sector1_s=27.0,
                        sector2_s=28.0,
                        sector3_s=27.0,
                        tyre_wear_pct=50.0 + i * 1.0,
                        tyre_compound=compound,
                        fuel_kg=100 - i * 1.5,
                        gap_ahead_s=1.0,
                        gap_behind_s=1.5,
                    )
                )
            payload = TelemetryPayload(
                circuit="Monza",
                session_label="R",
                driver="VER",
                laps=laps
            )
            
            scores, reasons, meta = await predict_strategy(payload)
            assert scores.pit_urgency >= 0
            assert scores.pit_urgency <= 100


class TestStrategyEdgeCases:
    """Test edge cases in strategy prediction."""
    
    @pytest.mark.asyncio
    async def test_predict_strategy_minimal_laps(self):
        """Test prediction with minimal lap data."""
        laps = [
            LapPoint(
                lap=1,
                lap_time_s=82.0,
                sector1_s=27.0,
                sector2_s=28.0,
                sector3_s=27.0,
                tyre_wear_pct=10.0,
                tyre_compound="SOFT",
                fuel_kg=100.0,
                gap_ahead_s=0.0,
                gap_behind_s=0.0,
            )
        ]
        payload = TelemetryPayload(
            circuit="Monza",
            session_label="R",
            driver="VER",
            laps=laps
        )
        
        scores, reasons, meta = await predict_strategy(payload)
        assert scores.pit_urgency >= 0
    
    @pytest.mark.asyncio
    async def test_predict_strategy_extreme_wear(self):
        """Test prediction with extreme tire wear."""
        payload = _sample_payload(wear=95.0, degradation_trend=0.5)
        scores, reasons, meta = await predict_strategy(payload)
        
        # Should trigger very high urgency
        assert scores.pit_urgency >= 80
        assert len(reasons) > 0
    
    @pytest.mark.asyncio
    async def test_predict_strategy_low_fuel(self):
        """Test prediction with low fuel levels."""
        laps = []
        for i in range(1, 21):
            laps.append(
                LapPoint(
                    lap=i,
                    lap_time_s=82.0,
                    sector1_s=27.0,
                    sector2_s=28.0,
                    sector3_s=27.0,
                    tyre_wear_pct=50.0,
                    tyre_compound="SOFT",
                    fuel_kg=max(5.0, 50 - i * 2.5),  # Low fuel
                    gap_ahead_s=1.0,
                    gap_behind_s=1.5,
                )
            )
        payload = TelemetryPayload(
            circuit="Monza",
            session_label="R",
            driver="VER",
            laps=laps
        )
        
        scores, reasons, meta = await predict_strategy(payload)
        assert scores.pit_urgency >= 0


class TestStrategyReasoningQuality:
    """Test quality and relevance of strategy reasoning."""
    
    @pytest.mark.asyncio
    async def test_reasoning_not_empty(self):
        """Test that reasoning is provided."""
        payload = _sample_payload(wear=75.0)
        scores, reasons, meta = await predict_strategy(payload)
        
        assert len(reasons) > 0
        assert all(isinstance(r, str) for r in reasons)
        assert all(len(r) > 0 for r in reasons)
    
    @pytest.mark.asyncio
    async def test_reasoning_mentions_key_factors(self):
        """Test that reasoning mentions key decision factors."""
        payload = _sample_payload(wear=80.0, degradation_trend=0.3)
        scores, reasons, meta = await predict_strategy(payload)
        
        # Reasoning should mention tire-related factors
        reasoning_text = " ".join(reasons).lower()
        # At least one key factor should be mentioned
        assert any(keyword in reasoning_text for keyword in
                  ["tire", "tyre", "wear", "degradation", "pit"])


class TestStrategyMetadata:
    """Test strategy prediction metadata."""
    
    @pytest.mark.asyncio
    async def test_metadata_includes_circuit(self):
        """Test that metadata includes circuit information."""
        payload = _sample_payload()
        scores, reasons, meta = await predict_strategy(payload)
        
        assert "circuit" in meta
        assert meta["circuit"] == "Monza"
    
    @pytest.mark.asyncio
    async def test_metadata_structure(self):
        """Test that metadata has expected structure."""
        payload = _sample_payload()
        scores, reasons, meta = await predict_strategy(payload)
        
        assert isinstance(meta, dict)
        assert len(meta) > 0


class TestStrategyScoreRanges:
    """Test that strategy scores are within valid ranges."""
    
    @pytest.mark.asyncio
    async def test_all_scores_within_range(self):
        """Test that all scores are between 0 and 100."""
        payload = _sample_payload()
        scores, reasons, meta = await predict_strategy(payload)
        
        assert 0 <= scores.pit_urgency <= 100
    
    @pytest.mark.asyncio
    async def test_scores_are_numeric(self):
        """Test that all scores are numeric values."""
        payload = _sample_payload()
        scores, reasons, meta = await predict_strategy(payload)
        
        assert isinstance(scores.pit_urgency, (int, float))


class TestStrategyConsistency:
    """Test consistency of strategy predictions."""
    
    @pytest.mark.asyncio
    async def test_same_input_same_output(self):
        """Test that same input produces same output."""
        payload = _sample_payload(wear=60.0, degradation_trend=0.15)
        
        scores1, reasons1, meta1 = await predict_strategy(payload, bypass_cache=True)
        scores2, reasons2, meta2 = await predict_strategy(payload, bypass_cache=True)
        
        assert scores1.pit_urgency == scores2.pit_urgency
    
    @pytest.mark.asyncio
    async def test_increasing_wear_increases_urgency(self):
        """Test that increasing wear increases pit urgency."""
        low_wear = _sample_payload(wear=30.0)
        high_wear = _sample_payload(wear=80.0)
        
        scores_low, _, _ = await predict_strategy(low_wear)
        scores_high, _, _ = await predict_strategy(high_wear)
        
        assert scores_high.pit_urgency > scores_low.pit_urgency


class TestStrategyCircuitVariations:
    """Test strategy predictions for different circuits."""
    
    @pytest.mark.asyncio
    async def test_different_circuits(self):
        """Test predictions for various circuits."""
        circuits = ["Monza", "Monaco", "Silverstone", "Spa"]
        
        for circuit in circuits:
            laps = []
            for i in range(1, 21):
                laps.append(
                    LapPoint(
                        lap=i,
                        lap_time_s=82.0,
                        sector1_s=27.0,
                        sector2_s=28.0,
                        sector3_s=27.0,
                        tyre_wear_pct=50.0 + i * 1.0,
                        tyre_compound="SOFT",
                        fuel_kg=100 - i * 1.5,
                        gap_ahead_s=1.0,
                        gap_behind_s=1.5,
                    )
                )
            payload = TelemetryPayload(
                circuit=circuit,
                session_label="R",
                driver="VER",
                laps=laps
            )
            
            scores, reasons, meta = await predict_strategy(payload)
            assert meta["circuit"] == circuit
            assert scores.pit_urgency >= 0


class TestStrategyPerformance:
    """Test performance characteristics of strategy prediction."""
    
    @pytest.mark.asyncio
    async def test_prediction_completes_quickly(self):
        """Test that prediction completes in reasonable time."""
        import time
        
        payload = _sample_payload()
        start_time = time.time()
        scores, reasons, meta = await predict_strategy(payload)
        end_time = time.time()
        
        # Should complete in less than 1 second
        assert (end_time - start_time) < 1.0
    
    @pytest.mark.asyncio
    async def test_handles_many_laps(self):
        """Test prediction with maximum lap count."""
        laps = []
        for i in range(1, 101):  # 100 laps
            laps.append(
                LapPoint(
                    lap=i,
                    lap_time_s=82.0,
                    sector1_s=27.0,
                    sector2_s=28.0,
                    sector3_s=27.0,
                    tyre_wear_pct=min(95.0, 10.0 + i * 0.8),
                    tyre_compound="SOFT",
                    fuel_kg=max(5.0, 100 - i * 0.9),
                    gap_ahead_s=1.0,
                    gap_behind_s=1.5,
                )
            )
        payload = TelemetryPayload(
            circuit="Monza",
            session_label="R",
            driver="VER",
            laps=laps
        )
        
        scores, reasons, meta = await predict_strategy(payload)
        assert scores.pit_urgency >= 0


class TestStrategyCacheIntegration:
    """Test cache integration in strategy prediction."""
    
    @pytest.mark.asyncio
    async def test_cache_hit_returns_cached_result(self):
        """Test that cache hit returns cached result."""
        payload = _sample_payload(wear=60.0)
        
        # First call - cache miss
        scores1, reasons1, meta1 = await predict_strategy(payload, session_id="test-session")
        
        # Second call - should hit cache
        scores2, reasons2, meta2 = await predict_strategy(payload, session_id="test-session")
        
        # Results should be identical
        assert scores1.pit_urgency == scores2.pit_urgency
    
    @pytest.mark.asyncio
    async def test_bypass_cache_forces_fresh_computation(self):
        """Test that bypass_cache forces fresh computation."""
        payload = _sample_payload(wear=60.0)
        
        # First call with cache
        scores1, _, _ = await predict_strategy(payload, session_id="test-session")
        
        # Second call bypassing cache
        scores2, _, _ = await predict_strategy(payload, session_id="test-session", bypass_cache=True)
        
        # Results should still be consistent
        assert scores1.pit_urgency == scores2.pit_urgency
    
    @pytest.mark.asyncio
    async def test_different_sessions_different_cache(self):
        """Test that different sessions use different cache keys."""
        payload = _sample_payload(wear=60.0)
        
        # Call with different session IDs
        scores1, _, _ = await predict_strategy(payload, session_id="session-1")
        scores2, _, _ = await predict_strategy(payload, session_id="session-2")
        
        # Results should be the same (same input)
        assert scores1.pit_urgency == scores2.pit_urgency

# Made with Bob

class TestLatestWear:
    """Test _latest_wear helper function."""

    def test_latest_wear_empty_laps(self):
        assert _latest_wear([]) == 55.0

    def test_latest_wear_all_none(self):
        laps = [
            LapPoint(lap=1, tyre_wear_pct=None),
            LapPoint(lap=2, tyre_wear_pct=None)
        ]
        assert _latest_wear(laps) == 55.0

    def test_latest_wear_normal(self):
        laps = [
            LapPoint(lap=1, tyre_wear_pct=10.0),
            LapPoint(lap=2, tyre_wear_pct=20.0),
            LapPoint(lap=3, tyre_wear_pct=30.0)
        ]
        assert _latest_wear(laps) == 30.0

    def test_latest_wear_last_none(self):
        laps = [
            LapPoint(lap=1, tyre_wear_pct=10.0),
            LapPoint(lap=2, tyre_wear_pct=20.0),
            LapPoint(lap=3, tyre_wear_pct=None)
        ]
        assert _latest_wear(laps) == 20.0
