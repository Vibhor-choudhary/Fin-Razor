import sys
import os
import asyncio
import uuid
import json
from datetime import datetime, timezone
import sentry_sdk

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from hyperswitch_client import HyperswitchClient, PaymentResponse
from migrate import Session, Event
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

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

async def poll_payment(payment_id: str, client: HyperswitchClient, db, initial_status: str):
    backoffs = [2, 4, 8, 16, 30]
    current_status = initial_status
    terminal_statuses = ["succeeded", "failed", "cancelled"]

    for delay in backoffs:
        if current_status in terminal_statuses:
            break
            
        await asyncio.sleep(delay)
        print(f"Polling {payment_id} after {delay}s...")
        
        res = await client.get_payment(payment_id)
        if res.status != current_status:
            print(f"Status changed from {current_status} to {res.status}")
            evt = Event(
                id=f"evt_{uuid.uuid4().hex[:8]}",
                session_id=payment_id,
                type=res.status,
                timestamp=datetime.now(timezone.utc).isoformat(),
                metadata_json=json.dumps({"error_code": res.error_code}) if res.error_code else "{}",
                raw_payload_json=json.dumps(res.raw_response)
            )
            db.add(evt)
            db.commit()
            
            sess = db.query(Session).filter(Session.id == payment_id).first()
            if sess:
                sess.final_status = res.status
                sess.updated_at = datetime.now(timezone.utc).isoformat()
                sess.at_risk = 1 if res.status in ["failed", "requires_payment_method"] else 0
                db.commit()
                
            current_status = res.status
            
            # Emit Sentry event for payment failure
            if res.status == "failed":
                sentry_sdk.capture_message("hyperswitch.error", level="error", extras={"endpoint": "/payments/confirm", "hs_error_code": res.error_code})

async def process_payment(res: PaymentResponse, user_id: str, client: HyperswitchClient, db):
    payment_id = res.payment_id
    if not payment_id:
        print("No payment_id returned!")
        return

    sess = Session(
        id=payment_id,
        user_id=user_id,
        cart_value=res.amount / 100.0,
        initial_status=res.status,
        final_status=res.status,
        at_risk=1 if res.status in ["failed", "requires_payment_method"] else 0,
        ground_truth_self_convert=1 if user_id == "demo_user_success" else 0,
        created_at=datetime.now(timezone.utc).isoformat(),
        updated_at=datetime.now(timezone.utc).isoformat()
    )
    db.add(sess)
    
    evt = Event(
        id=f"evt_{uuid.uuid4().hex[:8]}",
        session_id=payment_id,
        type=res.status,
        timestamp=datetime.now(timezone.utc).isoformat(),
        metadata_json=json.dumps({"error_code": res.error_code}) if res.error_code else "{}",
        raw_payload_json=json.dumps(res.raw_response)
    )
    db.add(evt)
    db.commit()
    
    print(f"Recorded payment_id: {payment_id}, status: {res.status}, error_code: {res.error_code}")
    
    # Emit Sentry event immediately if failed (if it didn't need polling)
    if res.status == "failed":
        sentry_sdk.capture_message("hyperswitch.error", level="error", extras={"endpoint": "/payments", "hs_error_code": res.error_code})
    
    await poll_payment(payment_id, client, db, res.status)

async def run():
    client = HyperswitchClient()
    db = SessionLocal()
    
    print("Executing one real sandbox payment success...")
    try:
        res_success = await client.create_and_confirm_payment(
            amount_paise=15000, 
            card_number="4111111111111111", 
            description="capture run - success"
        )
        await process_payment(res_success, "demo_user_success", client, db)
    except Exception as e:
        print(f"Failed to execute success payment: {e}")
        sentry_sdk.capture_exception(e)

    print("\nExecuting one real sandbox payment failure...")
    try:
        res_fail = await client.create_and_confirm_payment(
            amount_paise=15000, 
            card_number="4000000000000002", 
            description="capture run - decline"
        )
        await process_payment(res_fail, "demo_user_fail", client, db)
    except Exception as e:
        print(f"Failed to execute failure payment: {e}")
        sentry_sdk.capture_exception(e)

    db.close()
    print("\nDone storing real payments to DB.")

if __name__ == "__main__":
    asyncio.run(run())
