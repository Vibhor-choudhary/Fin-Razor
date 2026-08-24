import sys
import os
import asyncio
import hashlib
import time
import uuid
import sentry_sdk
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from migrate import Session, Event, Intervention, MetricsSnapshot
from agent import RecoveryAgent, AgentDecision
from guardrails import validate_decision
from interventions import execute_intervention

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./dev.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

sentry_dsn = os.environ.get("SENTRY_DSN")
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        environment=os.environ.get("APP_ENV", "development"),
        traces_sample_rate=1.0,
    )

def is_treatment(session_id: str) -> bool:
    h = hashlib.md5(session_id.encode('utf-8')).hexdigest()
    return int(h[-1], 16) % 2 == 0

async def run_batch():
    db = SessionLocal()
    agent = RecoveryAgent()
    
    # 1. Detection query: identify at-risk sessions
    sessions = db.query(Session).all()
    now_time = datetime.now(timezone.utc)
    
    at_risk_treatment = []
    
    for s in sessions:
        # Check if treatment
        if not is_treatment(s.id):
            continue
            
        # Get events sorted by timestamp
        evts = db.query(Event).filter(Event.session_id == s.id).all()
        if not evts:
            continue
            
        latest_evt = max(evts, key=lambda e: e.timestamp)
        
        # Check risk status
        is_at_risk = False
        if latest_evt.type == "failed":
            is_at_risk = True
        elif latest_evt.type == "requires_payment_method":
            try:
                evt_time = datetime.fromisoformat(latest_evt.timestamp.replace('Z', '+00:00'))
                if now_time - evt_time > timedelta(minutes=10):
                    is_at_risk = True
            except Exception:
                pass
                
        # "succeeded" sessions are never touched
        if latest_evt.type == "succeeded":
            is_at_risk = False
            
        if is_at_risk:
            at_risk_treatment.append((s, evts))
            
    print(f"Found {len(at_risk_treatment)} at-risk treatment sessions.")
    
    processed = 0
    interventions_count = {"retry": 0, "nudge": 0, "none": 0, "abstain": 0}
    recoveries = 0
    quota_exhausted = False
    
    for s, evts in at_risk_treatment:
        if quota_exhausted:
            print(f"Skipping session {s.id} due to prior quota exhaustion.")
            continue
            
        print(f"\nProcessing session: {s.id} (user: {s.user_id}, cart: {s.cart_value}, scenario: {s.scenario_label})")
        
        # 1-2s sleep between LLM calls
        await asyncio.sleep(1.5)
        
        # Run agent with backoff on 429
        decision = None
        backoff_delay = 5.0
        max_retries = 3
        
        for attempt in range(max_retries):
            try:
                decision = agent.decide(
                    session_data={"id": s.id, "cart_value": s.cart_value, "initial_status": s.initial_status, "final_status": s.final_status},
                    events_data=[{"type": e.type, "timestamp": e.timestamp, "metadata_json": e.metadata_json} for e in evts]
                )
                # If we got a fallback decision indicating an error, check if it was quota limit
                if decision.classification == "error" and "429" in decision.reasoning:
                    raise Exception("Rate limit hit (429)")
                break
            except Exception as e:
                print(f"LLM attempt {attempt+1} failed: {e}")
                if "429" in str(e) or "limit" in str(e).lower():
                    print(f"Rate limit hit. Sleeping {backoff_delay}s...")
                    await asyncio.sleep(backoff_delay)
                    backoff_delay *= 2
                else:
                    # Other error (auth fail, etc.) - STOP
                    print("Critical LLM error. Stopping batch.")
                    quota_exhausted = True
                    break
        
        if not decision or quota_exhausted:
            print(f"Could not get decision for {s.id}. Marking unprocessed.")
            continue
            
        print(f"Agent Proposed: {decision.intervention} (confidence: {decision.confidence})")
        print(f"Reasoning: {decision.reasoning}")
        
        # 2. Deterministic Guardrails
        is_valid, reject_reason = validate_decision(s, evts, decision, db)
        
        # 3. Execute
        if not is_valid:
            outcome, msg = await execute_intervention(s, decision, db, rejected_reason=reject_reason)
            interventions_count["abstain"] += 1
        else:
            outcome, msg = await execute_intervention(s, decision, db)
            interventions_count[decision.intervention] += 1
            if outcome == "succeeded":
                recoveries += 1
                
        processed += 1
        db.commit()

    # 4. Metrics Snapshot Calculation
    control_sessions = 0
    control_successful = 0
    treatment_sessions = 0
    treatment_successful = 0
    
    for s in sessions:
        if is_treatment(s.id):
            treatment_sessions += 1
            if s.final_status == "succeeded":
                treatment_successful += 1
        else:
            control_sessions += 1
            if s.final_status == "succeeded":
                control_successful += 1
                
    baseline_conversion = control_successful / max(control_sessions, 1)
    agent_conversion = treatment_successful / max(treatment_sessions, 1)
    
    # Calculate false positives (interventions on sessions that would self convert)
    false_positives = db.query(Intervention).join(
        Session, Intervention.session_id == Session.id
    ).filter(
        Session.ground_truth_self_convert == 1,
        Intervention.type.in_(["retry", "nudge"]),
        Intervention.outcome == "succeeded"
    ).count()
    
    false_positive_cost = false_positives * 5.0
    
    # Unresolvable sessions
    unresolvable = db.query(Session).filter(
        Session.id.in_(
            db.query(Intervention.session_id).filter(Intervention.outcome == "failed")
        )
    ).count()

    # Total abstentions (rejected + agent proposed none)
    abstentions = db.query(Intervention).filter(Intervention.type.in_(["abstain", "none"])).count()
    
    snapshot = MetricsSnapshot(
        id=f"snap_{uuid.uuid4().hex[:8]}",
        batch_id=f"batch_{uuid.uuid4().hex[:8]}",
        control_sessions=control_sessions,
        control_successful=control_successful,
        baseline_conversion=baseline_conversion,
        treatment_sessions=treatment_sessions,
        treatment_successful=treatment_successful,
        agent_conversion=agent_conversion,
        interventions_applied=interventions_count["retry"] + interventions_count["nudge"],
        false_positives=false_positives,
        false_positive_cost_inr=false_positive_cost,
        abstentions=abstentions,
        unresolvable=unresolvable,
        created_at=datetime.now(timezone.utc).isoformat()
    )
    db.add(snapshot)
    db.commit()

    # Print summary
    print("\n" + "="*40)
    print(" BATCH RUN SUMMARY")
    print("="*40)
    print(f"Total Treatment Sessions: {treatment_sessions}")
    print(f"Processed At-Risk: {processed}")
    print(f"Interventions by Type:")
    print(f"  - Retry: {interventions_count['retry']}")
    print(f"  - Nudge: {interventions_count['nudge']}")
    print(f"  - None: {interventions_count['none']}")
    print(f"  - Guardrail Rejections (Abstains): {interventions_count['abstain']}")
    print(f"Recovered Sessions (converted to success): {recoveries}")
    print(f"Baseline Conversion: {baseline_conversion*100:.1f}% ({control_successful}/{control_sessions})")
    print(f"Agent Conversion: {agent_conversion*100:.1f}% ({treatment_successful}/{treatment_sessions})")
    print(f"False Positives: {false_positives} (Cost: INR {false_positive_cost})")
    print(f"Unresolvable: {unresolvable}")
    print("="*40)

    db.close()

if __name__ == "__main__":
    asyncio.run(run_batch())
