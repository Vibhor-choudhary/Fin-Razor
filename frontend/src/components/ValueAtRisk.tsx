
import type { Metrics, Session } from '../lib/api';

interface ValueAtRiskProps {
  metrics: Metrics;
  sessions: Session[];
}

export function ValueAtRisk({ metrics, sessions }: ValueAtRiskProps) {
  // Try to compute at-risk and unresolved cart value from available session sample
  let sampleAtRiskCartValue = 0;
  let sampleUnresolvedValue = 0;
  
  if (sessions.length > 0) {
    sessions.forEach(s => {
      sampleAtRiskCartValue += s.cart_value;
      if (s.final_status === 'failed' || s.final_status === 'requires_action') {
        sampleUnresolvedValue += s.cart_value;
      }
    });
  }

  const atRiskDisplay = sessions.length > 0 ? `₹${sampleAtRiskCartValue.toLocaleString()}` : '—';
  const unresolvedDisplay = sessions.length > 0 ? `₹${sampleUnresolvedValue.toLocaleString()}` : '—';

  return (
    <div className="admin-panel var-panel">
      <div className="panel-header">
        <h3 className="panel-title">Value at Risk Breakdown</h3>
        <span className="panel-subtitle mono">Based on safe API response fields</span>
      </div>

      <div className="var-grid">
        <div className="var-item">
          <div className="var-label text-muted">At-risk cart value</div>
          <div className="var-value mono">{atRiskDisplay}</div>
          <div className="var-provenance mono text-xs">PROVENANCE: {sessions.length > 0 ? 'Sampled session cohort' : 'Evidence unavailable'}</div>
        </div>

        <div className="var-item">
          <div className="var-label text-muted">Verified retry recovery amount</div>
          <div className="var-value mono text-green">₹{metrics.verified_sandbox_recovered_amount.toLocaleString()}</div>
          <div className="var-provenance mono text-xs">PROVENANCE: {metrics.metric_provenance?.verified_sandbox_recovered_amount || 'Actual successful Hyperswitch sandbox retry'}</div>
        </div>

        <div className="var-item">
          <div className="var-label text-muted">Simulated nudge amount</div>
          <div className="var-value mono text-cyan">₹{metrics.simulated_nudge_recovered_amount.toLocaleString()}</div>
          <div className="var-provenance mono text-xs">PROVENANCE: {metrics.metric_provenance?.simulated_nudge_recovered_amount || 'Deterministic simulated customer behavior'}</div>
        </div>

        <div className="var-item">
          <div className="var-label text-muted">Unresolved at-risk value</div>
          <div className="var-value mono text-gold">{unresolvedDisplay}</div>
          <div className="var-provenance mono text-xs">PROVENANCE: {sessions.length > 0 ? 'Sampled unresolvable sessions' : 'Evidence unavailable'}</div>
        </div>
      </div>
    </div>
  );
}
