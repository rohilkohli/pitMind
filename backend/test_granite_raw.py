import asyncio
import sys
sys.path.insert(0, '.')
from services import granite

async def test():
    system = "You are a test. Return ONLY JSON with keys: summary, evidence, confidence."
    user = "Respond with a test JSON response."
    
    result = await granite.granite_generate(system, user)
    print("===RAW GRANITE OUTPUT===")
    print(repr(result[:500]))
    print("\n===FIRST 500 CHARS===")
    print(result[:500])

asyncio.run(test())
