import asyncio
import sys
import json
sys.path.insert(0, '.')
from services import granite
from services.pipeline import _merge_granite_explainability
from models.strategy import StrategyRecommendation, StrategyScores

async def test():
    system = "Return ONLY JSON with keys: summary, evidence, confidence, assumptions, alternative."
    user = "Respond with test data."
    
    granite_raw = await granite.granite_generate(system, user)
    print("===GRANITE RAW (first 300 chars)===")
    print(granite_raw[:300])
    print()
    
    # Test extraction
    start = granite_raw.find("{")
    end = granite_raw.rfind("}")
    print(f"===EXTRACTION INDICES===\nstart={start}, end={end}")
    
    if start >= 0 and end > start:
        extracted = granite_raw[start:end+1]
        print(f"Extracted text (first 200 chars):\n{extracted[:200]}")
        try:
            parsed = json.loads(extracted)
            print(f"\n✓ JSON parsed successfully!")
            print(f"Keys: {list(parsed.keys())}")
        except json.JSONDecodeError as e:
            print(f"\n✗ JSON parse failed: {e}")
    
    # Create a dummy base
    base = StrategyRecommendation(
        action="STAY_OUT",
        pit_this_lap=False,
        suggested_compound="SOFT",
        scores=StrategyScores(
            pit_urgency=30,
            sc_probability_next_3_laps=5,
            overtake_risk=20,
            recommended_window_laps=(6, 9)
        ),
        structured_reasons=["test reason"],
        explanation="Dummy explanation",
        evidence=["dummy evidence"],
        assumptions=["dummy assumption"],
        confidence=50.0,
        alternative="dummy alternative",
        pipeline_steps=["step 1"]
    )
    
    # Test merge
    explanation, evidence, assumptions, confidence, alternative = _merge_granite_explainability(granite_raw, base)
    print(f"\n===MERGED RESULT===")
    print(f"Explanation (first 150 chars): {explanation[:150]}")
    print(f"Evidence: {evidence}")
    print(f"Confidence: {confidence}")
    print(f"Assumptions: {assumptions}")

asyncio.run(test())
