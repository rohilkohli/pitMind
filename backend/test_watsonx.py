#!/usr/bin/env python3
import asyncio
import sys
import logging

logging.basicConfig(level=logging.WARNING)
sys.path.insert(0, '.')

from services.granite import granite_generate
from config import get_settings

async def test():
    settings = get_settings()
    print(f"Watsonx configured: {bool(settings.watsonx_api_key and settings.watsonx_project_id)}")
    print(f"URL: {settings.watsonx_url}")
    print(f"Project ID: {settings.watsonx_project_id}")
    
    system = "You are a helpful assistant. Return a short response."
    user = "Test message for Watsonx."
    
    print("\nCalling granite_generate...")
    result = await granite_generate(system, user)
    print("\n===RESULT===")
    print(result[:500])

if __name__ == "__main__":
    asyncio.run(test())
