import os
import json
from sqlalchemy.orm import sessionmaker
from migrate import Session as DbSession, Event, Intervention, MetricsSnapshot

DEMO_SESSIONS = [
    {
        "session": DbSession(
            id="demo_session_success",
            user_id="demo_user_success",
            cart_value=1499.0,
            initial_status="succeeded",
            final_status="succeeded",
            at_risk=0,
            ground_truth_self_convert=1,
            created_at="2026-08-25T10:00:00Z",
            updated_at="2026-08-25T10:00:05Z",
            scenario_label="SIMULATED DEMO DATA · demo_success"
        ),
        "events": [
            Event(
                id="demo_evt_success_1",
                session_id="demo_session_success",
                type="succeeded",
                timestamp="2026-08-25T10:00:02Z",
                metadata_json=json.dumps({"payment_id": "demo_payment_success", "source": "SIMULATED DEMO DATA"}),
                raw_payload_json=json.dumps({"status": "succeeded", "amount": 149900, "currency": "INR", "payment_id": "demo_payment_success", "notice": "SIMULATED DEMO DATA"})
            )
        ],
        "intervention": None
    },
    {
        "session": DbSession(
            id="demo_session_declined",
            user_id="demo_user_declined",
            cart_value=2499.0,
            initial_status="failed",
            final_status="succeeded",
            at_risk=1,
            ground_truth_self_convert=0,
            created_at="2026-08-25T10:05:00Z",
            updated_at="2026-08-25T10:07:30Z",
            scenario_label="SIMULATED DEMO DATA · demo_card_declined"
        ),
        "events": [
            Event(
                id="demo_evt_declined_1",
                session_id="demo_session_declined",
                type="failed",
                timestamp="2026-08-25T10:05:10Z",
                metadata_json=json.dumps({"error_code": "DC_08", "payment_id": "demo_payment_initial_declined", "error_message": "Payment declined: Card declined", "source": "SIMULATED DEMO DATA"}),
                raw_payload_json=json.dumps({"status": "failed", "error_code": "DC_08", "amount": 249900, "currency": "INR", "payment_id": "demo_payment_initial_declined", "notice": "SIMULATED DEMO DATA"})
            ),
            Event(
                id="demo_evt_declined_2",
                session_id="demo_session_declined",
                type="succeeded",
                timestamp="2026-08-25T10:07:20Z",
                metadata_json=json.dumps({"payment_id": "demo_payment_retry_recovered", "source": "SIMULATED DEMO DATA"}),
                raw_payload_json=json.dumps({"status": "succeeded", "amount": 249900, "currency": "INR", "payment_id": "demo_payment_retry_recovered", "notice": "SIMULATED DEMO DATA"})
            )
        ],
        "intervention": Intervention(
            id="demo_intervention_retry_recovered",
            session_id="demo_session_declined",
            type="retry",
            outcome="succeeded",
            confidence_score=0.95,
            agent_reasoning="Observed terminal decline DC_08. Error code allowlisted for automatic bounded retry. Confidence 0.95 >= 0.60. All guardrail checks passed. SIMULATED DEMO DATA.",
            sentry_event_id="demo_sentry_retry_1",
            applied_at="2026-08-25T10:07:15Z"
        )
    },
    {
        "session": DbSession(
            id="demo_session_insufficient_funds",
            user_id="demo_user_insufficient",
            cart_value=3999.0,
            initial_status="failed",
            final_status="failed",
            at_risk=1,
            ground_truth_self_convert=0,
            created_at="2026-08-25T10:10:00Z",
            updated_at="2026-08-25T10:12:00Z",
            scenario_label="SIMULATED DEMO DATA · demo_insufficient_funds"
        ),
        "events": [
            Event(
                id="demo_evt_insufficient_1",
                session_id="demo_session_insufficient_funds",
                type="failed",
                timestamp="2026-08-25T10:10:15Z",
                metadata_json=json.dumps({"error_code": "INSUFFICIENT_FUNDS", "payment_id": "demo_payment_insufficient", "error_message": "Not enough balance", "source": "SIMULATED DEMO DATA"}),
                raw_payload_json=json.dumps({"status": "failed", "error_code": "INSUFFICIENT_FUNDS", "amount": 399900, "currency": "INR", "payment_id": "demo_payment_insufficient", "notice": "SIMULATED DEMO DATA"})
            )
        ],
        "intervention": Intervention(
            id="demo_intervention_abstain_insufficient",
            session_id="demo_session_insufficient_funds",
            type="abstain",
            outcome="rejected",
            confidence_score=0.35,
            agent_reasoning="Guardrail rejected: error code INSUFFICIENT_FUNDS is not retryable. Policy requires customer balance top-up; automatic retry prohibited. SIMULATED DEMO DATA.",
            sentry_event_id="demo_sentry_abstain_1",
            applied_at="2026-08-25T10:11:30Z"
        )
    },
    {
        "session": DbSession(
            id="demo_session_lost_card",
            user_id="demo_user_lost_card",
            cart_value=4800.0,
            initial_status="failed",
            final_status="failed",
            at_risk=1,
            ground_truth_self_convert=0,
            created_at="2026-08-25T10:15:00Z",
            updated_at="2026-08-25T10:17:00Z",
            scenario_label="SIMULATED DEMO DATA · demo_lost_card"
        ),
        "events": [
            Event(
                id="demo_evt_lost_1",
                session_id="demo_session_lost_card",
                type="failed",
                timestamp="2026-08-25T10:15:10Z",
                metadata_json=json.dumps({"error_code": "LOST_CARD", "payment_id": "demo_payment_lost", "error_message": "Card reported lost/stolen", "source": "SIMULATED DEMO DATA"}),
                raw_payload_json=json.dumps({"status": "failed", "error_code": "LOST_CARD", "amount": 480000, "currency": "INR", "payment_id": "demo_payment_lost", "notice": "SIMULATED DEMO DATA"})
            )
        ],
        "intervention": Intervention(
            id="demo_intervention_abstain_lost",
            session_id="demo_session_lost_card",
            type="abstain",
            outcome="rejected",
            confidence_score=0.15,
            agent_reasoning="Guardrail rejected: default-deny on suspected fraud or lost instrument. Retrying lost cards is prohibited. SIMULATED DEMO DATA.",
            sentry_event_id="demo_sentry_abstain_2",
            applied_at="2026-08-25T10:16:30Z"
        )
    },
    {
        "session": DbSession(
            id="demo_session_3ds",
            user_id="demo_user_3ds",
            cart_value=1850.0,
            initial_status="requires_action",
            final_status="requires_action",
            at_risk=1,
            ground_truth_self_convert=0,
            created_at="2026-08-25T10:20:00Z",
            updated_at="2026-08-25T10:22:00Z",
            scenario_label="SIMULATED DEMO DATA · demo_3ds_required"
        ),
        "events": [
            Event(
                id="demo_evt_3ds_1",
                session_id="demo_session_3ds",
                type="requires_action",
                timestamp="2026-08-25T10:20:10Z",
                metadata_json=json.dumps({"action": "customer_authentication_required", "payment_id": "demo_payment_3ds", "source": "SIMULATED DEMO DATA"}),
                raw_payload_json=json.dumps({"status": "requires_action", "amount": 185000, "currency": "INR", "payment_id": "demo_payment_3ds", "notice": "SIMULATED DEMO DATA"})
            )
        ],
        "intervention": Intervention(
            id="demo_intervention_none_3ds",
            session_id="demo_session_3ds",
            type="none",
            outcome="approved",
            confidence_score=0.88,
            agent_reasoning="Customer authentication / 3DS challenge in progress. Autonomous server-side retry not permitted during interactive user authentication flow. SIMULATED DEMO DATA.",
            sentry_event_id="demo_sentry_3ds_1",
            applied_at="2026-08-25T10:21:30Z"
        )
    },
    {
        "session": DbSession(
            id="demo_session_retry_failed",
            user_id="demo_user_retry_failed",
            cart_value=950.0,
            initial_status="failed",
            final_status="failed",
            at_risk=1,
            ground_truth_self_convert=0,
            created_at="2026-08-25T10:25:00Z",
            updated_at="2026-08-25T10:27:00Z",
            scenario_label="SIMULATED DEMO DATA · demo_retry_failed"
        ),
        "events": [
            Event(
                id="demo_evt_fail_1",
                session_id="demo_session_retry_failed",
                type="failed",
                timestamp="2026-08-25T10:25:10Z",
                metadata_json=json.dumps({"error_code": "DC_08", "payment_id": "demo_payment_retry_fail_1", "error_message": "Card declined", "source": "SIMULATED DEMO DATA"}),
                raw_payload_json=json.dumps({"status": "failed", "error_code": "DC_08", "amount": 95000, "currency": "INR", "payment_id": "demo_payment_retry_fail_1", "notice": "SIMULATED DEMO DATA"})
            ),
            Event(
                id="demo_evt_fail_2",
                session_id="demo_session_retry_failed",
                type="failed",
                timestamp="2026-08-25T10:26:45Z",
                metadata_json=json.dumps({"error_code": "DC_08", "payment_id": "demo_payment_retry_fail_2", "error_message": "Card declined on retry attempt", "source": "SIMULATED DEMO DATA"}),
                raw_payload_json=json.dumps({"status": "failed", "error_code": "DC_08", "amount": 95000, "currency": "INR", "payment_id": "demo_payment_retry_fail_2", "notice": "SIMULATED DEMO DATA"})
            )
        ],
        "intervention": Intervention(
            id="demo_intervention_retry_fail",
            session_id="demo_session_retry_failed",
            type="retry",
            outcome="failed",
            confidence_score=0.78,
            agent_reasoning="Initial DC_08 eligible for retry. Single retry attempted; second attempt also returned DC_08. One-action limit reached; session marked terminal unresolved. SIMULATED DEMO DATA.",
            sentry_event_id="demo_sentry_retry_fail_1",
            applied_at="2026-08-25T10:26:30Z"
        )
    },
    {
        "session": DbSession(
            id="demo_session_nudge",
            user_id="demo_user_nudge",
            cart_value=3200.0,
            initial_status="requires_payment_method",
            final_status="succeeded",
            at_risk=1,
            ground_truth_self_convert=0,
            created_at="2026-08-25T10:30:00Z",
            updated_at="2026-08-25T10:33:00Z",
            scenario_label="SIMULATED DEMO DATA · demo_cart_nudge"
        ),
        "events": [
            Event(
                id="demo_evt_nudge_1",
                session_id="demo_session_nudge",
                type="requires_payment_method",
                timestamp="2026-08-25T10:30:10Z",
                metadata_json=json.dumps({"reason": "cart_inactive_60s", "source": "SIMULATED DEMO DATA"}),
                raw_payload_json=json.dumps({"status": "requires_payment_method", "amount": 320000, "currency": "INR", "notice": "SIMULATED DEMO DATA"})
            ),
            Event(
                id="demo_evt_nudge_2",
                session_id="demo_session_nudge",
                type="succeeded",
                timestamp="2026-08-25T10:32:45Z",
                metadata_json=json.dumps({"payment_id": "demo_payment_nudge_success", "source": "SIMULATED DEMO DATA"}),
                raw_payload_json=json.dumps({"status": "succeeded", "amount": 320000, "currency": "INR", "payment_id": "demo_payment_nudge_success", "notice": "SIMULATED DEMO DATA"})
            )
        ],
        "intervention": Intervention(
            id="demo_intervention_nudge",
            session_id="demo_session_nudge",
            type="nudge",
            outcome="succeeded",
            confidence_score=0.90,
            agent_reasoning="Session idle in requires_payment_method for >60s. Delivered customer retention nudge. Deterministically simulated customer conversion. SIMULATED DEMO DATA.",
            sentry_event_id="demo_sentry_nudge_1",
            applied_at="2026-08-25T10:31:30Z"
        )
    }
]

DEMO_METRICS = MetricsSnapshot(
    id="demo_metrics_snapshot_1",
    batch_id="demo_batch_readonly",
    control_sessions=50,
    control_successful=28,
    baseline_conversion=0.56,
    treatment_sessions=50,
    treatment_successful=32,
    agent_conversion=0.64,
    interventions_applied=6,
    false_positives=1,
    false_positive_cost_inr=350.0,
    abstentions=2,
    unresolvable=1,
    created_at="2026-08-25T10:35:00Z"
)

def init_demo_dataset(db_engine):
    """
    Seeds synthetic read-only demo records ONLY when APP_ENV=demo_readonly.
    Idempotent: skips if demo records already exist. Never runs in development.
    """
    app_env = os.environ.get("APP_ENV", "development")
    if app_env != "demo_readonly":
        return
    
    SessionLocal = sessionmaker(bind=db_engine)
    db = SessionLocal()
    try:
        existing = db.query(DbSession).filter(DbSession.id == "demo_session_success").first()
        if existing:
            return
        
        for item in DEMO_SESSIONS:
            # Check if this specific session exists before adding
            sess_exists = db.query(DbSession).filter(DbSession.id == item["session"].id).first()
            if not sess_exists:
                db.add(item["session"])
            for evt in item["events"]:
                evt_exists = db.query(Event).filter(Event.id == evt.id).first()
                if not evt_exists:
                    db.add(evt)
            if item["intervention"]:
                int_exists = db.query(Intervention).filter(Intervention.id == item["intervention"].id).first()
                if not int_exists:
                    db.add(item["intervention"])
        
        # Add demo metrics snapshot if none exists
        existing_metrics = db.query(MetricsSnapshot).first()
        if not existing_metrics:
            db.add(DEMO_METRICS)
            
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error seeding demo dataset: {e}")
    finally:
        db.close()
