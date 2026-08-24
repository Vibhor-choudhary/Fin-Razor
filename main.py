import os
import json
from fastapi import FastAPI, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
import sentry_sdk
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import create_engine, desc, func
from sqlalchemy.orm import sessionmaker
from migrate import Session as DbSession, Event, Intervention, MetricsSnapshot

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./dev.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

sentry_dsn = os.environ.get("SENTRY_DSN")
if not sentry_dsn:
    print("sentry disabled")
else:
    sentry_sdk.init(
        dsn=sentry_dsn,
        environment=os.environ.get("APP_ENV", "development"),
        traces_sample_rate=1.0,
    )

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class InterventionRequest(BaseModel):
    type: str
    confidence_score: float
    agent_reasoning: Optional[str] = None

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/sessions")
def get_sessions(
    status: Optional[str] = None, 
    at_risk: Optional[bool] = None, 
    intervention_type: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100), 
    offset: int = Query(0, ge=0), 
    db=Depends(get_db)
):
    query = db.query(DbSession, Intervention).select_from(DbSession).outerjoin(Intervention, DbSession.id == Intervention.session_id)
    
    if status:
        query = query.filter(DbSession.final_status == status)
    if at_risk is not None:
        query = query.filter(DbSession.at_risk == (1 if at_risk else 0))
    if intervention_type:
        query = query.filter(Intervention.type == intervention_type)
        
    query = query.order_by(desc(DbSession.created_at))
    
    total = query.count()
    results = query.offset(offset).limit(limit).all()
    
    sessions_out = []
    for s, i in results:
        # fetch latest event for error code
        latest_event = db.query(Event).filter(Event.session_id == s.id).order_by(desc(Event.timestamp)).first()
        latest_error_code = None
        if latest_event and latest_event.metadata_json:
            try:
                meta = json.loads(latest_event.metadata_json)
                latest_error_code = meta.get("error_code")
            except:
                pass
                
        sessions_out.append({
            "id": s.id,
            "user_id": s.user_id,
            "cart_value": s.cart_value,
            "initial_status": s.initial_status,
            "final_status": s.final_status,
            "at_risk": bool(s.at_risk),
            "created_at": s.created_at,
            "updated_at": s.updated_at,
            "intervention_type": i.type if i else None,
            "intervention_status": i.outcome if i else None,
            "confidence": i.confidence_score if i else None,
            "latest_error_code": latest_error_code
        })
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "data_mode": "sandbox_simulation",
        "sessions": sessions_out
    }

@app.get("/api/sessions/{session_id}")
def get_session(session_id: str, db=Depends(get_db)):
    db_session = db.query(DbSession).filter(DbSession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail={"code": "SESSION_NOT_FOUND", "message": f"No session found with id: {session_id}"})
    
    events = db.query(Event).filter(Event.session_id == session_id).order_by(Event.timestamp).all()
    intervention = db.query(Intervention).filter(Intervention.session_id == session_id).first()
    
    events_out = []
    for e in events:
        has_raw = bool(e.raw_payload_json and e.raw_payload_json != "null")
        meta = {}
        if e.metadata_json:
            try:
                meta = json.loads(e.metadata_json)
            except:
                pass
        events_out.append({
            "id": e.id,
            "session_id": e.session_id,
            "type": e.type,
            "timestamp": e.timestamp,
            "metadata": meta,
            "has_raw_payload": has_raw
        })
        
    # We parse agent reasoning to find guardrail checks if present
    agent_reasoning = intervention.agent_reasoning if intervention else None
    
    return {
        "data_mode": "sandbox_simulation",
        "session": {
            "id": db_session.id,
            "user_id": db_session.user_id,
            "cart_value": db_session.cart_value,
            "initial_status": db_session.initial_status,
            "final_status": db_session.final_status,
            "at_risk": bool(db_session.at_risk),
            "created_at": db_session.created_at
        },
        "events": events_out,
        "intervention": {
            "id": intervention.id,
            "session_id": intervention.session_id,
            "type": intervention.type,
            "outcome": intervention.outcome,
            "confidence_score": intervention.confidence_score,
            "agent_reasoning": agent_reasoning,
            "sentry_event_id": intervention.sentry_event_id,
            "applied_at": intervention.applied_at
        } if intervention else None
    }

@app.get("/api/metrics")
def get_metrics(batch_id: Optional[str] = None, db=Depends(get_db)):
    query = db.query(MetricsSnapshot)
    if batch_id:
        query = query.filter(MetricsSnapshot.batch_id == batch_id)
    snapshot = query.order_by(desc(MetricsSnapshot.created_at)).first()
    
    if not snapshot:
        # Default zeroed state for UI when db is fresh
        return {
            "data_mode": "sandbox_simulation",
            "control_sessions": 0,
            "control_successful": 0,
            "baseline_conversion": 0.0,
            "treatment_sessions": 0,
            "treatment_successful": 0,
            "agent_conversion": 0.0,
            "recovery_lift": 0.0,
            "interventions_applied": 0,
            "false_positives": 0,
            "false_positive_cost_inr": 0.0,
            "abstentions": 0,
            "unresolvable": 0,
            "created_at": None,
            "batch_id": None,
            "verified_sandbox_recovered_amount": 0.0,
            "simulated_nudge_recovered_amount": 0.0,
            "total_modeled_recovered_amount": 0.0,
            "metric_provenance": {
                "verified_sandbox_recovered_amount": "Revenue recovered via actual successful Hyperswitch sandbox retry payments.",
                "simulated_nudge_recovered_amount": "Revenue recovered via deterministic simulated customer behavior (nudge converts).",
                "total_modeled_recovered_amount": "Combined sum of verified sandbox payments and simulated modeled nudges."
            }
        }

    lift = snapshot.agent_conversion - snapshot.baseline_conversion
    # Calculate abstain_rate and unresolvable_rate based on total sessions? 
    # Abstain rate = abstentions / at_risk, but we don't store at_risk count directly in snapshot.
    # The requirement: return recovery_lift at request time.
    
    
    metrics_res = {
        "data_mode": "sandbox_simulation",
        "batch_id": snapshot.batch_id,
        "control_sessions": snapshot.control_sessions,
        "control_successful": snapshot.control_successful,
        "baseline_conversion": snapshot.baseline_conversion,
        "treatment_sessions": snapshot.treatment_sessions,
        "treatment_successful": snapshot.treatment_successful,
        "agent_conversion": snapshot.agent_conversion,
        "recovery_lift": round(lift, 4),
        "interventions_applied": snapshot.interventions_applied,
        "false_positives": snapshot.false_positives,
        "false_positive_cost_inr": snapshot.false_positive_cost_inr,
        "abstentions": snapshot.abstentions,
        "unresolvable": snapshot.unresolvable,
        "created_at": snapshot.created_at,
        
        # added rates to make it easy for frontend
        "abstain_rate": round(snapshot.abstentions / max(1, snapshot.treatment_sessions), 4),
        "unresolvable_rate": round(snapshot.unresolvable / max(1, snapshot.control_sessions + snapshot.treatment_sessions), 4)
    }

    verified_sessions = db.query(DbSession.id).select_from(DbSession).join(Intervention, DbSession.id == Intervention.session_id).join(Event, DbSession.id == Event.session_id).filter(
        Intervention.type == "retry",
        Intervention.outcome == "succeeded",
        Event.type == "succeeded",
        Event.raw_payload_json != None
    ).distinct().subquery()

    verified_sandbox_recovered_amount = db.query(func.sum(DbSession.cart_value)).filter(DbSession.id.in_(verified_sessions)).scalar() or 0.0
    simulated_nudge_recovered_amount = db.query(func.sum(DbSession.cart_value)).select_from(DbSession).join(Intervention, DbSession.id == Intervention.session_id).filter(Intervention.type == "nudge", Intervention.outcome == "succeeded").scalar() or 0.0
    total_modeled_recovered_amount = verified_sandbox_recovered_amount + simulated_nudge_recovered_amount

    metrics_res["verified_sandbox_recovered_amount"] = verified_sandbox_recovered_amount
    metrics_res["simulated_nudge_recovered_amount"] = simulated_nudge_recovered_amount
    metrics_res["total_modeled_recovered_amount"] = total_modeled_recovered_amount
    metrics_res["metric_provenance"] = {
        "verified_sandbox_recovered_amount": "Revenue recovered via actual successful Hyperswitch sandbox retry payments.",
        "simulated_nudge_recovered_amount": "Revenue recovered via deterministic simulated customer behavior (nudge converts).",
        "total_modeled_recovered_amount": "Combined sum of verified sandbox payments and simulated modeled nudges."
    }

    return metrics_res

@app.get("/api/logs")
def get_logs(type: Optional[str] = None, outcome: Optional[str] = None, limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0), db=Depends(get_db)):
    query = db.query(Intervention)
    if type:
        query = query.filter(Intervention.type == type)
    if outcome:
        query = query.filter(Intervention.outcome == outcome)
        
    query = query.order_by(desc(Intervention.applied_at))
    total = query.count()
    results = query.offset(offset).limit(limit).all()
    
    logs_out = []
    for i in results:
        logs_out.append({
            "id": i.id,
            "session_id": i.session_id,
            "type": i.type,
            "confidence_score": i.confidence_score,
            "outcome": i.outcome,
            "agent_reasoning": i.agent_reasoning,
            "sentry_event_id": i.sentry_event_id,
            "applied_at": i.applied_at,
            "details": f"Agent {i.type} resulted in {i.outcome}"
        })
        
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "data_mode": "sandbox_simulation",
        "logs": logs_out
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
