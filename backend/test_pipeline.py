import asyncio
import sys
sys.path.insert(0, '.')
from services.pipeline import run_strategy_pipeline
from models.race_state import TelemetryPayload, LapPoint

async def test():
    payload = TelemetryPayload(
        circuit="Monza",
        driver="VER",
        laps=[
            LapPoint(lap=i, lap_time_s=80.5 - i*0.1, tyre_wear_pct=30+i*2, gap_ahead_s=1.5)
            for i in range(1, 6)
        ]
    )
    result = await run_strategy_pipeline(payload)
    print("===RESULT===")
    print("Type:", type(result))
    print("Explanation:", result.explanation[:200] if hasattr(result, 'explanation') else result)
    if hasattr(result, 'evidence'):
        print("Evidence:", result.evidence)
    if hasattr(result, 'confidence'):
        print("Confidence:", result.confidence)

asyncio.run(test())
