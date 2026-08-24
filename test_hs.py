import asyncio
import os
from dotenv import load_dotenv
import httpx
import json

load_dotenv()
api_key = os.environ.get("HYPERSWITCH_API_KEY_TEST")
base_url = "https://sandbox.hyperswitch.io"

async def test():
    async with httpx.AsyncClient() as client:
        # Create payment intent
        res = await client.post(
            f"{base_url}/payments",
            headers={"api-key": api_key, "Content-Type": "application/json"},
            json={"amount": 15000, "currency": "INR"}
        )
        print("--- Create Payment Response ---")
        print(res.status_code)
        try:
            print(json.dumps(res.json(), indent=2))
        except:
            print(res.text)

asyncio.run(test())
