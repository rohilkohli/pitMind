import asyncio
import websockets
import json

async def test_ws():
    uri = "ws://127.0.0.1:8000/api/v1/stream/telemetry"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to WebSocket")
            # Wait for initial telemetry
            message = await websocket.recv()
            print(f"Received initial: {message}")
            
            # Send a ping
            ping = json.dumps({"type": "ping", "timestamp": 123456789})
            print(f"Sending ping: {ping}")
            await websocket.send(ping)
            
            # Wait for pong
            pong = await websocket.recv()
            print(f"Received pong: {pong}")
            
            # Wait for next telemetry (should happen after 1s due to loop structure)
            telemetry = await websocket.recv()
            print(f"Received telemetry: {telemetry}")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_ws())
