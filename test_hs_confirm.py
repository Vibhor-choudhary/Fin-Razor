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
        data = res.json()
        payment_id = data["payment_id"]
        client_secret = data["client_secret"]
        
        # Confirm payment - Success
        confirm_res = await client.post(
            f"{base_url}/payments/{payment_id}/confirm",
            headers={"api-key": api_key, "Content-Type": "application/json"},
            json={
                "client_secret": client_secret,
                "payment_method": "card",
                "payment_method_data": {
                    "card": {
                        "card_number": "4242424242424242",
                        "card_exp_month": "12",
                        "card_exp_year": "34",
                        "card_cvc": "123"
                    }
                }
            }
        )
        print("--- Confirm Payment Response (SUCCESS) ---")
        print(json.dumps(confirm_res.json(), indent=2))
        
        # Fail flow
        res2 = await client.post(
            f"{base_url}/payments",
            headers={"api-key": api_key, "Content-Type": "application/json"},
            json={"amount": 15000, "currency": "INR"}
        )
        data2 = res2.json()
        payment_id2 = data2["payment_id"]
        client_secret2 = data2["client_secret"]
        
        confirm_res2 = await client.post(
            f"{base_url}/payments/{payment_id2}/confirm",
            headers={"api-key": api_key, "Content-Type": "application/json"},
            json={
                "client_secret": client_secret2,
                "payment_method": "card",
                "payment_method_data": {
                    "card": {
                        "card_number": "4000000000000002",
                        "card_exp_month": "12",
                        "card_exp_year": "34",
                        "card_cvc": "123"
                    }
                }
            }
        )
        print("\n--- Confirm Payment Response (FAIL) ---")
        print(json.dumps(confirm_res2.json(), indent=2))

asyncio.run(test())
