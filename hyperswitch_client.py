import os
import httpx
from typing import Dict, Any, Optional
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()

class PaymentResponse(BaseModel):
    payment_id: str
    status: str
    amount: int
    net_amount: int
    amount_received: Optional[int] = None
    currency: str
    description: Optional[str] = None
    
    connector: Optional[str] = None
    merchant_connector_id: Optional[str] = None
    connector_transaction_id: Optional[str] = None
    profile_id: Optional[str] = None
    merchant_id: Optional[str] = None
    
    payment_method: Optional[str] = None
    payment_method_type: Optional[str] = None
    
    last4: Optional[str] = None
    card_network: Optional[str] = None
    card_issuer: Optional[str] = None
    
    attempt_count: Optional[int] = None
    created: Optional[str] = None
    updated: Optional[str] = None
    expires_on: Optional[str] = None
    
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    unified_code: Optional[str] = None
    unified_message: Optional[str] = None
    connector_error_code: Optional[str] = None
    connector_error_message: Optional[str] = None
    unified_error_category: Optional[str] = None
    
    raw_response: Dict[str, Any]

def parse_payment_response(data: Dict[str, Any]) -> PaymentResponse:
    pm_data = data.get("payment_method_data") or {}
    card_data = pm_data.get("card") or {}
    
    error_details = data.get("error_details") or {}
    conn_details = error_details.get("connector_details") or {}
    uni_details = error_details.get("unified_details") or {}

    return PaymentResponse(
        payment_id=data.get("payment_id", ""),
        status=data.get("status", "unknown"),
        amount=data.get("amount", 0),
        net_amount=data.get("net_amount", 0),
        amount_received=data.get("amount_received"),
        currency=data.get("currency", "INR"),
        description=data.get("description"),
        connector=data.get("connector"),
        merchant_connector_id=data.get("merchant_connector_id"),
        connector_transaction_id=data.get("connector_transaction_id"),
        profile_id=data.get("profile_id"),
        merchant_id=data.get("merchant_id"),
        payment_method=data.get("payment_method"),
        payment_method_type=data.get("payment_method_type"),
        last4=card_data.get("last4"),
        card_network=card_data.get("card_network"),
        card_issuer=card_data.get("card_issuer"),
        attempt_count=data.get("attempt_count"),
        created=data.get("created"),
        updated=data.get("updated"),
        expires_on=data.get("expires_on"),
        error_code=data.get("error_code"),
        error_message=data.get("error_message"),
        unified_code=data.get("unified_code"),
        unified_message=data.get("unified_message"),
        connector_error_code=conn_details.get("code"),
        connector_error_message=conn_details.get("message"),
        unified_error_category=uni_details.get("category"),
        raw_response=data
    )

class HyperswitchClient:
    def __init__(self):
        self.api_key = os.environ.get("HYPERSWITCH_API_KEY_TEST", "")
        self.base_url = "https://sandbox.hyperswitch.io"
        
    def _get_headers(self) -> Dict[str, str]:
        return {
            "api-key": self.api_key,
            "Content-Type": "application/json"
        }

    async def create_and_confirm_payment(self, amount_paise: int, card_number: str, description: str) -> PaymentResponse:
        async with httpx.AsyncClient() as client:
            payload = {
                "amount": amount_paise,
                "currency": "INR",
                "confirm": True,
                "authentication_type": "no_three_ds",
                "capture_method": "automatic",
                "payment_method": "card",
                "payment_method_data": {
                    "card": {
                        "card_number": card_number,
                        "card_exp_month": "12",
                        "card_exp_year": "29",
                        "card_holder_name": "Test User",
                        "card_cvc": "123"
                    }
                },
                "description": description
            }
            response = await client.post(
                f"{self.base_url}/payments",
                headers=self._get_headers(),
                json=payload
            )
            data = response.json()
            return parse_payment_response(data)

    async def get_payment(self, payment_id: str) -> PaymentResponse:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/payments/{payment_id}",
                headers=self._get_headers()
            )
            data = response.json()
            return parse_payment_response(data)
