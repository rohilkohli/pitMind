import asyncio
import httpx

async def main():
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post('http://127.0.0.1:8001/api/v1/chat/explain', json={'messages':[{'role':'user','content':'Hello, test chat'}]})
        print('Status:', resp.status_code)
        print('Body:', resp.text[:2000])

if __name__ == '__main__':
    asyncio.run(main())
