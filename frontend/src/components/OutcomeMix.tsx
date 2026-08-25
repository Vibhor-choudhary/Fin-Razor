
import type { Session, Metrics } from '../lib/api';

interface OutcomeMixProps {
  sessions: Session[];
  metrics: Metrics;
}

export function OutcomeMix({ sessions, metrics }: OutcomeMixProps) {
  // We compute counts from the local loaded sessions if available,
  // or fall back to Evidence unavailable for specific breakdowns if not.
  
  let verifiedRetry = 0;
  let simulatedNudge = 0;
  let retryFailed = 0;
  let noAction = 0;

  sessions.forEach(s => {
    if (s.intervention_type === 'retry' && s.final_status === 'succeeded') verifiedRetry++;
    else if (s.intervention_type === 'nudge' && s.final_status === 'succeeded') simulatedNudge++;
    else if (s.intervention_type === 'retry' && s.final_status === 'failed') retryFailed++;
    else if (!s.intervention_type || s.intervention_type === 'none') noAction++;
  });

  const totalAnalyzed = sessions.length;

  return (
    <div className="admin-panel outcome-panel">
      <div className="panel-header">
        <h3 className="panel-title">Intervention Outcome Mix</h3>
        <span className="panel-subtitle mono">Based on {totalAnalyzed > 0 ? `${totalAnalyzed} recent sessions` : 'available evidence'}</span>
      </div>

      <div className="outcome-list">
        <div className="outcome-row">
          <div className="outcome-label">
            <span className="dot bg-green"></span>
            Sandbox-verified retry outcome
          </div>
          <div className="outcome-value mono">{totalAnalyzed > 0 ? verifiedRetry : 'Evidence unavailable'}</div>
        </div>
        
        <div className="outcome-row">
          <div className="outcome-label">
            <span className="dot bg-cyan"></span>
            Simulated nudge outcome
          </div>
          <div className="outcome-value mono">{totalAnalyzed > 0 ? simulatedNudge : 'Evidence unavailable'}</div>
        </div>

        <div className="outcome-row">
          <div className="outcome-label">
            <span className="dot bg-red"></span>
            Retry failed
          </div>
          <div className="outcome-value mono">{totalAnalyzed > 0 ? retryFailed : 'Evidence unavailable'}</div>
        </div>

        <div className="outcome-row">
          <div className="outcome-label">
            <span className="dot bg-gold"></span>
            Guardrail abstained
          </div>
          {/* We have exact global abstentions from metrics */}
          <div className="outcome-value mono">{metrics.abstentions}</div>
        </div>

        <div className="outcome-row">
          <div className="outcome-label">
            <span className="dot bg-muted"></span>
            No action / Unresolved
          </div>
          <div className="outcome-value mono">{metrics.unresolvable}</div>
        </div>
      </div>
    </div>
  );
}
