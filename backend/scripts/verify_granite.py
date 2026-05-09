import asyncio
import sys
from pathlib import Path

# Add backend directory to sys.path so app module can be imported
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.granite import granite_generate

async def main():
    print("Testing IBM Granite Connection...")
    system_prompt = (
        "You are PitMind, an F1 race engineer copilot. "
        "Explain strategy succinctly for a stressed engineer. "
        "Use only plausible motorsport reasoning. "
        "You MUST output exactly in the following JSON schema:\n"
        "{\n"
        '  "recommendation": "string",\n'
        '  "prose": "string",\n'
        '  "evidence": ["string"],\n'
        '  "confidence": number,\n'
        '  "assumptions": ["string"],\n'
        '  "alternative": "string"\n'
        "}"
    )
    user_prompt = (
        "Driver VER on lap 34/57. Soft tyres are 24 laps old. "
        "Gap to car behind is 3.2s. VSC predicted in 1-3 laps. "
        "Recommend action: Pit this lap for Mediums."
    )
    
    print("\nSystem Prompt:", system_prompt)
    print("User Prompt:", user_prompt)
    
    print("\nGenerating response (this may take a moment if hitting a remote API)...")
    try:
        response = await granite_generate(system_prompt, user_prompt)
        print("\n=== RESPONSE ===")
        print(response)
        print("================")
    except Exception as e:
        print(f"\nError: {e}")

if __name__ == "__main__":
    asyncio.run(main())
