import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Metrics, type Log } from '../lib/api';
import { RecoveryFlowDiagram } from '../components/RecoveryFlowDiagram';
import { ProvenanceChip } from '../components/ProvenanceChip';
import { useReveal } from '../hooks/useReveal';
import { useCountUp } from '../hooks/useCountUp';
import './Overview.css';

export function Overview() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recentLogs, setRecentLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [m, l] = await Promise.all([
          api.getMetrics(),
          api.getLogs({ limit: '5' })
        ]);
        setMetrics(m);
        setRecentLogs(l.logs || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const revealRef = useReveal({ selector: '.reveal-item' });
  const recoveredAmount = useCountUp({ value: metrics?.total_modeled_recovered_amount ?? 0 });
  const abstentionCount = useCountUp({ value: metrics?.abstentions ?? 0 });
  const liftValue = useCountUp({ value: metrics ? metrics.recovery_lift * 100 : 0, decimals: 1 });

  if (loading) return <div className="mono text-muted py-4 fade-in">Loading evidence data...</div>;
  if (error) return <div className="text-danger fade-in">Error: {error}</div>;
  if (!metrics) return null;

  const flowData = {
    totalFailed: metrics.control_sessions + metrics.treatment_sessions, // Proxy for total
    proposals: metrics.treatment_sessions, 
    guardrailEvaluated: metrics.treatment_sessions,
    actionsPermitted: metrics.interventions_applied,
    successfulOutcomes: metrics.treatment_successful + metrics.control_successful
  };

  return (
    <div className="fade-in" ref={revealRef}>
      <div className="hero-statement reveal-item">
        <h1 className="title-hero" style={{ maxWidth: '800px', marginBottom: 'var(--space-3)' }}>
          Recover failed checkouts. One guarded action at a time.
        </h1>
        <p className="text-secondary" style={{ fontSize: '18px', maxWidth: '700px', marginBottom: 'var(--space-5)' }}>
          The system proposes recovery steps, deterministic guardrails decide, and all outcomes preserve transparent evidence.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <Link to="/recovery-queue" className="btn btn-primary">Open recovery queue</Link>
          <Link to="/how-it-works" className="btn btn-secondary">See how it works</Link>
        </div>
      </div>

      <div style={{ marginTop: 'var(--space-7)' }}>
        <RecoveryFlowDiagram data={flowData} />
      </div>

      <div className="metric-blocks-grid">
        <div className="panel reveal-item">
          <div className="text-label" style={{ marginBottom: 'var(--space-1)' }}>Total Recovered</div>
          <div className="mono tabular-nums" style={{ fontSize: '32px', color: 'var(--success)' }}>
            ₹{recoveredAmount.toLocaleString()}
          </div>
          <div className="text-caption" style={{ marginTop: 'var(--space-1)' }}>
            Verified + simulated recovery
          </div>
        </div>

        <div className="panel reveal-item">
          <div className="text-label" style={{ marginBottom: 'var(--space-1)' }}>Guardrail Abstained</div>
          <div className="mono tabular-nums" style={{ fontSize: '32px', color: 'var(--warning)' }}>
            {abstentionCount}
          </div>
          <div className="text-caption" style={{ marginTop: 'var(--space-1)' }}>
            Proposals blocked by bounds
          </div>
        </div>

        <div className="panel reveal-item">
          <div className="text-label" style={{ marginBottom: 'var(--space-1)' }}>Agent Lift</div>
          <div className="mono tabular-nums" style={{ fontSize: '32px' }}>
            {liftValue > 0 ? '+' : ''}{liftValue.toFixed(1)} pp
          </div>
          <div className="text-caption" style={{ marginTop: 'var(--space-1)' }}>
            Compared to baseline conversion
          </div>
        </div>
      </div>

      <div style={{ marginTop: 'var(--space-7)' }} className="reveal-item">
        <h2 className="title-section" style={{ marginBottom: 'var(--space-4)' }}>Recent decisions</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Session ID</th>
                <th>Outcome</th>
                <th>Agent Proposal</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-muted mono" style={{ textAlign: 'center' }}>No evidence available</td>
                </tr>
              ) : (
                recentLogs.slice(0, 5).map(log => (
                  <tr key={log.id}>
                    <td className="mono">{log.session_id}</td>
                    <td>
                      {log.outcome === 'succeeded' ? (
                        <ProvenanceChip type="verified" label="Succeeded" />
                      ) : log.outcome === 'abstained' ? (
                        <ProvenanceChip type="abstained" label="Abstained" />
                      ) : (
                        <ProvenanceChip type="danger" label="Failed" />
                      )}
                    </td>
                    <td className="mono text-muted">{log.type}</td>
                    <td>
                      <Link to={`/replay/${log.session_id}`} className="btn btn-ghost" style={{ padding: '0 var(--space-2)' }}>
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
