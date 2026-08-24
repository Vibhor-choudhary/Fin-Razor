import os
import uuid
import json
from datetime import datetime, timezone
import sentry_sdk
from sqlalchemy.orm import Session as DBSession
from migrate import Session, Event, Intervention
from hyperswitch_client import HyperswitchClient
from agent import AgentDecision

async def execute_intervention(
    session: Session,
    decision: AgentDecision,
    db: DBSession,
    rejected_reason: str = None
) -> tuple[str, str]:
    """
    Executes the chosen recovery intervention.
    Returns (outcome, details).
    """
    now_str = datetime.now(timezone.utc).isoformat()
    intervention_id = f"int_{uuid.uuid4().hex[:8]}"
    
    # 1. Handle Guardrail Rejection (Abstention)
    if rejected_reason:
        abstain_evt_id = sentry_sdk.capture_message(
            "agent.abstain",
            level="info",
            extras={
                "session_id": session.id,
                "confidence_score": decision.confidence,
                "reason": rejected_reason
            }
        )
        
        intervention = Intervention(
            id=intervention_id,
            session_id=session.id,
            type="abstain",
            outcome="rejected",
            confidence_score=decision.confidence,
            agent_reasoning=f"Guardrail rejected: {rejected_reason}. Agent proposed: {decision.intervention}. Reasoning: {decision.reasoning}",
            sentry_event_id=abstain_evt_id,
            applied_at=now_str
        )
        db.add(intervention)
        db.commit()
        return "rejected", rejected_reason

    # 2. Handle Agent proposed "none"
    if decision.intervention == "none":
        abstain_evt_id = sentry_sdk.capture_message(
            "agent.abstain",
            level="info",
            extras={
                "session_id": session.id,
                "confidence_score": decision.confidence,
                "reason": decision.reasoning
            }
        )
        
        intervention = Intervention(
            id=intervention_id,
            session_id=session.id,
            type="none",
            outcome="abstained",
            confidence_score=decision.confidence,
            agent_reasoning=decision.reasoning,
            sentry_event_id=abstain_evt_id,
            applied_at=now_str
        )
        db.add(intervention)
        db.commit()
        return "abstained", "Agent chose none"

    # 3. Handle "nudge"
    if decision.intervention == "nudge":
        outcome = "failed"
        if session.scenario_label == "nudge_converts":
            outcome = "succeeded"
            session.final_status = "succeeded"
            session.updated_at = now_str
            
            # Record success event
            evt = Event(
                id=f"evt_{uuid.uuid4().hex[:8]}",
                session_id=session.id,
                type="succeeded",
                timestamp=now_str,
                metadata_json=json.dumps({"source": "nudge_conversion"}),
                raw_payload_json=json.dumps({"nudge": "converted"})
            )
            db.add(evt)
        else:
            # nudge ignored
            outcome = "failed"
            # Keep final_status as is, but nudge itself failed

        decision_evt_id = sentry_sdk.capture_message(
            "agent.decision",
            level="info",
            extras={
                "session_id": session.id,
                "intervention_type": "nudge",
                "confidence_score": decision.confidence,
                "outcome": outcome
            }
        )

        intervention = Intervention(
            id=intervention_id,
            session_id=session.id,
            type="nudge",
            outcome=outcome,
            confidence_score=decision.confidence,
            agent_reasoning=decision.reasoning,
            sentry_event_id=decision_evt_id,
            applied_at=now_str
        )
        db.add(intervention)
        db.commit()
        return outcome, "Nudge applied"

    # 4. Handle "retry"
    if decision.intervention == "retry":
        # Select card details based on scenario simulation
        card_number = "4000000000000002" # Default fails
        if session.scenario_label == "retry_succeeds":
            card_number = "4111111111111111"
        elif session.scenario_label == "retry_fails":
            card_number = "4000000000000002"

        client = HyperswitchClient()
        amount_paise = int(session.cart_value * 100)
        
        try:
            res = await client.create_and_confirm_payment(
                amount_paise=amount_paise,
                card_number=card_number,
                description=f"Automated retry for session {session.id}"
            )
            
            payment_status = res.status # succeeded or failed
            outcome = "succeeded" if payment_status == "succeeded" else "failed"
            
            # Write Event row with raw payload
            evt = Event(
                id=f"evt_{uuid.uuid4().hex[:8]}",
                session_id=session.id,
                type=payment_status,
                timestamp=now_str,
                metadata_json=json.dumps({"error_code": res.error_code}) if res.error_code else "{}",
                raw_payload_json=json.dumps(res.raw_response)
            )
            db.add(evt)
            
            # Update session status
            session.final_status = payment_status
            session.updated_at = now_str
            session.at_risk = 1 if payment_status in ["failed", "requires_payment_method"] else 0
            
            # Sentry decision logging
            decision_evt_id = sentry_sdk.capture_message(
                "agent.decision",
                level="info",
                extras={
                    "session_id": session.id,
                    "intervention_type": "retry",
                    "confidence_score": decision.confidence,
                    "outcome": outcome
                }
            )
            
            if payment_status == "failed":
                sentry_sdk.capture_message(
                    "hyperswitch.error",
                    level="error",
                    extras={
                        "endpoint": "POST /payments",
                        "status_code": 200, # confirmed payload returned successfully but was declined
                        "hs_error_code": res.error_code,
                        "session_id": session.id
                    }
                )

            intervention = Intervention(
                id=intervention_id,
                session_id=session.id,
                type="retry",
                outcome=outcome,
                confidence_score=decision.confidence,
                agent_reasoning=decision.reasoning,
                sentry_event_id=decision_evt_id,
                applied_at=now_str
            )
            db.add(intervention)
            db.commit()
            return outcome, f"Retry executed with status: {payment_status}"

        except Exception as e:
            sentry_sdk.capture_message(
                "hyperswitch.error",
                level="error",
                extras={
                    "endpoint": "POST /payments",
                    "status_code": 500,
                    "hs_error_code": "API_CONNECTION_ERROR",
                    "session_id": session.id
                }
            )
            sentry_sdk.capture_message(
                "session.unresolvable",
                level="warning",
                extras={
                    "session_id": session.id,
                    "reason": f"Retry connection failed: {str(e)}"
                }
            )
            
            # Mark intervention as failed due to error
            intervention = Intervention(
                id=intervention_id,
                session_id=session.id,
                type="retry",
                outcome="failed",
                confidence_score=decision.confidence,
                agent_reasoning=f"Intervention failed execution: {str(e)}",
                applied_at=now_str
            )
            db.add(intervention)
            db.commit()
            return "failed", f"Retry error: {str(e)}"
            
    return "failed", "Unknown intervention type"
