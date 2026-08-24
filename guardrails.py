import json
from datetime import datetime, timezone
import sentry_sdk
from migrate import Intervention, Event, Session
from agent import AgentDecision

def validate_decision(
    session: Session,
    events: list,
    decision: AgentDecision,
    db
) -> tuple[bool, str]:
    """
    Validates the agent decision against deterministic guardrails.
    Returns (is_valid, reject_reason). If is_valid is False, intervention must be rejected.
    """
    
    # 1. Check confidence threshold
    if decision.confidence < 0.6:
        reason = "confidence below threshold (0.60)"
        log_violation(session.id, decision, reason)
        return False, reason

    # If the decision is to do nothing, it's always valid
    if decision.intervention == "none":
        return True, ""

    # 2. Check latest event age (no intervention if latest event < 60s old)
    if events:
        latest_evt = max(events, key=lambda e: e.timestamp)
        try:
            latest_time = datetime.fromisoformat(latest_evt.timestamp.replace('Z', '+00:00'))
            now_time = datetime.now(timezone.utc)
            age_sec = (now_time - latest_time).total_seconds()
            if age_sec < 60:
                reason = f"latest event too fresh ({age_sec:.1f}s < 60s)"
                log_violation(session.id, decision, reason)
                return False, reason
        except Exception as e:
            # If parsing fails, fail-safe: reject
            reason = f"failed to parse latest event timestamp: {e}"
            log_violation(session.id, decision, reason)
            return False, reason

    # 3. Check prior interventions (max 1 ever)
    prior_int = db.query(Intervention).filter(Intervention.session_id == session.id).first()
    if prior_int:
        reason = "session has prior intervention"
        log_violation(session.id, decision, reason)
        return False, reason

    # 4. Check "retry" specific rules
    if decision.intervention == "retry":
        # Check error code is in the retryable set {"DC_08"}
        # Find latest failed event to check its error code
        failed_evts = [e for e in events if e.type == "failed"]
        if not failed_evts:
            reason = "no failed event found for retry intervention"
            log_violation(session.id, decision, reason)
            return False, reason
            
        latest_fail = max(failed_evts, key=lambda e: e.timestamp)
        meta = {}
        if latest_fail.metadata_json:
            try:
                meta = json.loads(latest_fail.metadata_json)
            except Exception:
                pass
                
        error_code = meta.get("error_code")
        if error_code != "DC_08":
            reason = f"unsupported retry error code: {error_code}"
            log_violation(session.id, decision, reason)
            return False, reason

        # Note: the executor will enforce retry amount = original cart value.
        # But we also validate here that the agent did not propose a modification (e.g. if the decision reasoning proposes changing value)
        # Since the AgentDecision schema does not have a value field, the agent cannot propose a change, which satisfies this rule.

    return True, ""

def log_violation(session_id: str, decision: AgentDecision, reason: str):
    """Logs guardrail violations to stdout and Sentry."""
    print(f"Guardrail REJECTED decision for session {session_id}. Reason: {reason}")
    sentry_sdk.capture_message(
        "guardrail.violation",
        level="warning",
        extras={
            "session_id": session_id,
            "rejected_type": decision.intervention,
            "reason": reason,
            "agent_raw_output": decision.model_dump()
        }
    )
