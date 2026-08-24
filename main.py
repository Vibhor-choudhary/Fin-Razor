import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import sentry_sdk
from dotenv import load_dotenv

load_dotenv()

sentry_dsn = os.environ.get("SENTRY_DSN")
if not sentry_dsn:
    print("sentry disabled")
else:
    sentry_sdk.init(
        dsn=sentry_dsn,
        environment=os.environ.get("APP_ENV", "development"),
        traces_sample_rate=1.0,
    )

agent_model = os.environ.get("AGENT_MODEL", "google-gla/gemini-2.5-flash")

app = FastAPI()

class InterventionRequest(BaseModel):
    type: str
    confidence_score: float
    agent_reasoning: Optional[str] = None

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/sessions")
def get_sessions(status: Optional[str] = None, at_risk: Optional[bool] = None, limit: int = 50, offset: int = 0):
    return {
        "total": 100,
        "limit": limit,
        "offset": offset,
        "sessions": [
            {
                "id": "sess_abc123",
                "user_id": "user_001",
                "cart_value": 1499.00,
                "initial_status": "initiated",
                "final_status": "succeeded",
                "at_risk": False,
                "created_at": "2026-08-24T10:00:00Z",
                "updated_at": "2026-08-24T10:05:00Z"
            }
        ]
    }

@app.get("/api/sessions/{session_id}")
def get_session(session_id: str):
    if session_id != "sess_abc123":
        raise HTTPException(status_code=404, detail={"code": "SESSION_NOT_FOUND", "message": f"No session found with id: {session_id}", "request_id": "req_abc123"})
    return {
        "session": {
            "id": "sess_abc123",
            "user_id": "user_001",
            "cart_value": 1499.00,
            "initial_status": "initiated",
            "final_status": "succeeded",
            "at_risk": True,
            "created_at": "2026-08-24T10:00:00Z"
        },
        "events": [
            {
                "id": "evt_001",
                "session_id": "sess_abc123",
                "type": "initiated",
                "timestamp": "2026-08-24T10:00:00Z",
                "metadata": {}
            },
            {
                "id": "evt_002",
                "session_id": "sess_abc123",
                "type": "failed",
                "timestamp": "2026-08-24T10:01:12Z",
                "metadata": { "error_code": "card_declined", "hs_payment_id": "pay_xyz" }
            }
        ],
        "intervention": {
            "id": "int_001",
            "session_id": "sess_abc123",
            "type": "simplify",
            "outcome": "succeeded",
            "confidence_score": 0.82,
            "agent_reasoning": "Two consecutive card declines with 4-minute idle gap; simplify option likely to convert.",
            "sentry_event_id": "a1b2c3d4e5f6",
            "applied_at": "2026-08-24T10:04:30Z"
        }
    }

@app.post("/api/sessions/{session_id}/intervention", status_code=201)
def record_intervention(session_id: str, payload: InterventionRequest):
    return {
        "intervention": {
            "id": "int_002",
            "session_id": session_id,
            "type": payload.type,
            "outcome": "pending",
            "confidence_score": payload.confidence_score,
            "agent_reasoning": payload.agent_reasoning,
            "sentry_event_id": None,
            "applied_at": "2026-08-24T10:05:00Z"
        }
    }

@app.get("/api/metrics")
def get_metrics(batch_id: Optional[str] = None):
    return {
        "batch_id": batch_id or "batch_20260824",
        "created_at": "2026-08-24T12:00:00Z",
        "control_sessions": 100,
        "control_successful": 48,
        "baseline_conversion": 0.48,
        "treatment_sessions": 100,
        "treatment_successful": 63,
        "agent_conversion": 0.63,
        "interventions_applied": 38,
        "false_positives": 6,
        "false_positive_cost_inr": 30.00,
        "abstentions": 12,
        "unresolvable": 2
    }

@app.get("/api/logs")
def get_logs(type: Optional[str] = None, outcome: Optional[str] = None, limit: int = 100, offset: int = 0):
    return {
        "total": 52,
        "logs": [
            {
                "id": "int_001",
                "session_id": "sess_abc123",
                "type": "simplify",
                "confidence_score": 0.82,
                "outcome": "succeeded",
                "agent_reasoning": "Two consecutive card declines; simplify presented.",
                "sentry_event_id": "a1b2c3d4e5f6",
                "applied_at": "2026-08-24T10:04:30Z"
            },
            {
                "id": "int_003",
                "session_id": "sess_def456",
                "type": "none",
                "confidence_score": 0.41,
                "outcome": "abstained",
                "agent_reasoning": "Confidence below threshold (0.60); agent abstained.",
                "sentry_event_id": "b2c3d4e5f6a1",
                "applied_at": "2026-08-24T10:06:00Z"
            }
        ]
    }
