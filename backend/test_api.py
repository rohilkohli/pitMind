import asyncio
import httpx
import json

async def test_api():
    payload = {
        "circuit": "Monza",
        "driver": "VER",
        "laps": [
            {"lap": 1, "lap_time_s": 80.5, "tyre_wear_pct": 30, "gap_ahead_s": 1.5},
            {"lap": 2, "lap_time_s": 80.4, "tyre_wear_pct": 35, "gap_ahead_s": 1.4}
        ]
    }
    
    async with httpx.AsyncClient(timeout=120.0) as client:  # Increased timeout to 120 seconds
        try:
            response = await client.post(
                "http://127.0.0.1:8001/api/v1/strategy/recommend",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"Status: {response.status_code}")
            print(f"Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                result = response.json()
                print("\n===STRATEGY RESPONSE===")
                print(f"Action: {result.get('action')}")
                print(f"Pit this lap: {result.get('pit_this_lap')}")
                print(f"Suggested compound: {result.get('suggested_compound')}")
                print(f"Explanation: {result.get('explanation')[:150]}...")
                print(f"Confidence: {result.get('confidence')}")
                print(f"Evidence: {result.get('evidence')}")
            else:
                print(f"Error response:\n{response.text}")
        except Exception as e:
            print(f"Request error: {e}")

asyncio.run(test_api())
