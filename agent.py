import os
import json
from typing import List, Dict, Any
from pydantic import BaseModel, Field
from typing import Literal
from upsonic import Agent, Task
import sentry_sdk

class AgentDecision(BaseModel):
    classification: str = Field(description="The failure or risk classification, e.g. insufficient_funds, card_declined, technical_error, abandoned.")
    retryable: bool = Field(description="Whether the payment is retryable based on the logs.")
    intervention: Literal["retry", "nudge", "none"] = Field(description="The chosen intervention action.")
    confidence: float = Field(description="Confidence score between 0.0 and 1.0.")
    reasoning: str = Field(description="Brief reasoning for the classification and intervention decision.")

class RecoveryAgent:
    def __init__(self):
        self.model_name = os.environ.get("AGENT_MODEL", "google-gla/gemini-3.5-flash")
        try:
            self.agent = Agent(model=self.model_name)
        except Exception as e:
            sentry_sdk.capture_exception(e)
            raise e

    def decide(self, session_data: Dict[str, Any], events_data: List[Dict[str, Any]]) -> AgentDecision:
        context_str = json.dumps({
            "session": {
                "id": session_data.get("id"),
                "cart_value": session_data.get("cart_value"),
                "initial_status": session_data.get("initial_status"),
                "final_status": session_data.get("final_status"),
            },
            "events": [
                {
                    "type": evt.get("type"),
                    "timestamp": evt.get("timestamp"),
                    "metadata": evt.get("metadata_json")
                }
                for evt in events_data
            ]
        }, indent=2)

        prompt = f"""
You are the Checkout Recovery Agent for an AI Revenue Recovery system.
Given the following checkout session and its event log, classify the issue and decide on the recovery intervention.

Allowed interventions:
- "retry": Choose this ONLY for payment failures that are retryable (e.g. card declined with code DC_08).
- "nudge": Choose this for abandoned checkouts (where status is "requires_payment_method" and has been inactive).
- "none": Choose this if the failure is not recoverable (e.g. insufficient funds, fraud) or if confidence is low.

Input Session Context:
{context_str}

Please generate the decision strictly using the requested schema.
"""

        try:
            task = Task(description=prompt, response_format=AgentDecision)
            decision = self.agent.do(task)
            return decision
        except Exception as e:
            sentry_sdk.capture_message(
                "upsonic.error",
                level="error",
                extras={"session_id": session_data.get("id"), "error_message": str(e)}
            )
            # Return a fallback safe decision
            return AgentDecision(
                classification="error",
                retryable=False,
                intervention="none",
                confidence=0.0,
                reasoning=f"Upsonic agent execution failed: {str(e)}"
            )
