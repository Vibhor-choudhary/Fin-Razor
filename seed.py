import os
import uuid
import random
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from migrate import Session, Event

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./dev.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def seed_data():
    db = SessionLocal()
    random.seed(42) # deterministic random seed

    # Clear existing
    db.query(Event).delete()
    db.query(Session).delete()
    db.commit()

    now = datetime.now(timezone.utc)
    scenarios = ["retry_succeeds", "retry_fails", "nudge_converts", "nudge_ignored"]
    
    for i in range(100):
        session_id = f"sess_{uuid.uuid4().hex[:8]}"
        user_id = f"user_{random.randint(1, 1000)}"
        cart_value = round(random.uniform(100, 5000), 2)
        
        # Mix of succeeded / failed / requires_payment_method
        rand_val = random.random()
        if rand_val < 0.5:
            final_status = "succeeded"
        elif rand_val < 0.8:
            final_status = "failed"
        else:
            final_status = "requires_payment_method"
            
        at_risk = 1 if final_status in ["failed", "requires_payment_method"] else 0
        ground_truth = 1 if random.random() > 0.5 else 0
        
        # Hidden scenario label for at-risk sessions
        scenario_label = None
        if at_risk:
            scenario_label = random.choice(scenarios)

        created_at = (now - timedelta(days=random.randint(0, 10))).isoformat()
        
        session = Session(
            id=session_id,
            user_id=user_id,
            cart_value=cart_value,
            initial_status="requires_payment_method",
            final_status=final_status,
            at_risk=at_risk,
            ground_truth_self_convert=ground_truth,
            created_at=created_at,
            updated_at=created_at,
            scenario_label=scenario_label
        )
        db.add(session)
        
        event1 = Event(
            id=f"evt_{uuid.uuid4().hex[:8]}",
            session_id=session_id,
            type="requires_payment_method",
            timestamp=created_at,
            metadata_json="{}"
        )
        db.add(event1)
        
        if final_status != "requires_payment_method":
            updated_at = (datetime.fromisoformat(created_at) + timedelta(minutes=random.randint(1, 5))).isoformat()
            session.updated_at = updated_at
            
            meta_json = "{}"
            if final_status == "failed":
                meta_json = '{"error_code": "DC_08", "error_message": "Payment declined: Card declined", "unified_code": "UE_9000"}'
                
            event2 = Event(
                id=f"evt_{uuid.uuid4().hex[:8]}",
                session_id=session_id,
                type=final_status,
                timestamp=updated_at,
                metadata_json=meta_json
            )
            db.add(event2)

    # DETERMINISTIC GUARDRAIL TEST FIXTURE
    # This session is deliberately created with a future timestamp to simulate a "too fresh" event
    # and guarantee triggering the 60-second freshness guardrail abstention rule.
    # It is a test fixture, not a simulated customer event.
    import hashlib
    while True:
        fresh_session_id = f"sess_guardrail_test_{uuid.uuid4().hex[:8]}"
        h = hashlib.md5(fresh_session_id.encode('utf-8')).hexdigest()
        if int(h[-1], 16) % 2 == 0:
            break
    fresh_created_at = (now - timedelta(seconds=10)).isoformat()
    fresh_failed_at = (now + timedelta(minutes=5)).isoformat()
    fresh_session = Session(
        id=fresh_session_id,
        user_id="user_guardrail_test",
        cart_value=250.00,
        initial_status="requires_payment_method",
        final_status="failed",
        at_risk=1,
        ground_truth_self_convert=0,
        created_at=fresh_created_at,
        updated_at=fresh_failed_at,
        scenario_label="retry_fails"
    )
    db.add(fresh_session)
    
    fresh_evt1 = Event(
        id=f"evt_{uuid.uuid4().hex[:8]}",
        session_id=fresh_session_id,
        type="requires_payment_method",
        timestamp=fresh_created_at,
        metadata_json="{}"
    )
    db.add(fresh_evt1)
    
    fresh_evt2 = Event(
        id=f"evt_{uuid.uuid4().hex[:8]}",
        session_id=fresh_session_id,
        type="failed",
        timestamp=fresh_failed_at,
        metadata_json='{"error_code": "DC_08", "error_message": "Payment declined: Card declined"}'
    )
    db.add(fresh_evt2)

    db.commit()
    print("Seeded 100 sessions, events, and 1 special fresh session.")
    db.close()

if __name__ == "__main__":
    seed_data()
