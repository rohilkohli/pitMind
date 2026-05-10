import asyncio
import sys
import json
sys.path.insert(0, '.')
from services import granite

async def test():
    system = "Return ONLY JSON with keys: summary, evidence, confidence."
    user = "Respond with test data."
    
    granite_raw = await granite.granite_generate(system, user)
    
    # Manual extraction
    start = granite_raw.find("{")
    end = granite_raw.rfind("}")
    extracted = granite_raw[start:end+1]
    
    print("===RAW (char 0-400)===")
    print(repr(granite_raw[:400]))
    print()
    
    print(f"===EXTRACTED (start={start}, end={end})===")
    print(repr(extracted[:400]))
    print()
    print(f"Last 100 chars of extracted:")
    print(repr(extracted[-100:]))
    print()
    
    # Try parsing
    try:
        parsed = json.loads(extracted)
        print("✓ Parsed successfully")
        print(f"Keys: {list(parsed.keys())}")
    except json.JSONDecodeError as e:
        print(f"✗ Parse failed: {e}")
        
        # Try more aggressive extraction - find first complete JSON object
        print("\n===TRYING SMART EXTRACTION===")
        depth = 0
        first_brace = -1
        for i, char in enumerate(extracted):
            if char == '{':
                if first_brace == -1:
                    first_brace = i
                depth += 1
            elif char == '}':
                depth -= 1
                if first_brace != -1 and depth == 0:
                    smart_json = extracted[first_brace:i+1]
                    print(f"Found complete JSON from {first_brace} to {i}")
                    try:
                        parsed = json.loads(smart_json)
                        print(f"✓ Smart parse succeeded!")
                        print(f"Keys: {list(parsed.keys())}")
                    except json.JSONDecodeError as e2:
                        print(f"✗ Still failed: {e2}")
                    break

asyncio.run(test())
