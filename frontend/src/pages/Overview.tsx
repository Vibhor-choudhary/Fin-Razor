import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Metrics, type Session, type Log } from '../lib/api';
import { Funnel } from '../components/Funnel';
import { EvidenceMetric } from '../components/EvidenceMetric';
import { CohortComparison } from '../components/CohortComparison';
import { OutcomeMix } from '../components/OutcomeMix';
import { ValueAtRisk } from '../components/ValueAtRisk';
import { RecentActivity } from '../components/RecentActivity';
import './Overview.css';

export function Overview() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [recentLogs, setRecentLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [m, s, l] = await Promise.all([
          api.getMetrics(),
          api.getSessions({ at_risk: 'true', limit: '5' }),
          api.getLogs({ limit: '5' })
        ]);
        setMetrics(m);
        setSessions(s.sessions);
        setRecentLogs(l.logs || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="loader mono">Loading evidence data...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;
  if (!metrics) return null;

  return (
    <div>
      <div className="header">
        <div>
          <span className="doc-tree-eyebrow mono" style={{ marginBottom: '0.25rem', display: 'block' }}>CURRENT SANDBOX EVALUATION · HISTORICAL BATCH</span>
          <h1 className="title" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.75rem', margin: '0 0 0.5rem 0' }}>Recovery Command Center</h1>
          <div className="methodology text-muted">
            <strong>Historical evaluation evidence for bounded checkout recovery.</strong><br/>
            Real sandbox payment rails. Simulated customer outcomes.
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
          <div className="chip sandbox">SANDBOX SIMULATION</div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/policy" className="btn-outline">Inspect policy</Link>
            <Link to="/lab" className="btn-primary">Run controlled test</Link>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="metric-strip">
          <EvidenceMetric 
            label="Verified sandbox retry recovery" 
            value={`₹${metrics.verified_sandbox_recovered_amount.toLocaleString()}`} 
            highlight
          />
          <EvidenceMetric 
            label="Simulated nudge recovery" 
            value={`₹${metrics.simulated_nudge_recovered_amount.toLocaleString()}`} 
          />
          <EvidenceMetric 
            label="Total modeled recovery" 
            value={`₹${metrics.total_modeled_recovered_amount.toLocaleString()}`} 
          />
          <EvidenceMetric 
            label="Conversion Lift" 
            value={`${metrics.recovery_lift > 0 ? '+' : ''}${(metrics.recovery_lift * 100).toFixed(1)} pp`}
            subtitle={`Baseline: ${(metrics.baseline_conversion * 100).toFixed(1)}% → Agent: ${(metrics.agent_conversion * 100).toFixed(1)}%`}
          />
          <EvidenceMetric 
            label="False-Positive Cost" 
            value={`₹${metrics.false_positive_cost_inr.toFixed(2)}`}
            subtitle={`${metrics.false_positives} interventions on self-converts`}
            alert={metrics.false_positive_cost_inr > 0}
          />
          <EvidenceMetric 
            label="Guardrail Abstentions" 
            value={`${metrics.abstentions}`}
            subtitle={`${(metrics.abstain_rate * 100).toFixed(1)}% of evaluated sessions`}
          />
        </div>

        <div className="two-col-row">
          <CohortComparison 
            controlConversion={metrics.baseline_conversion} 
            agentConversion={metrics.agent_conversion} 
            lift={metrics.recovery_lift} 
          />
          <div className="admin-panel lifecycle-panel" style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
            <div className="panel-header" style={{ paddingTop: '1.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <h3 className="panel-title">Recovery Lifecycle</h3>
              <span className="panel-subtitle mono">HISTORICAL BATCH</span>
            </div>
            <Funnel />
          </div>
        </div>

        <div className="two-col-row">
          <OutcomeMix sessions={sessions} metrics={metrics} />
          <ValueAtRisk metrics={metrics} sessions={sessions} />
        </div>

        <div className="two-col-row">
          <RecentActivity logs={recentLogs} />
          
          <div className="admin-panel sessions-panel">
            <div className="panel-header">
              <h3 className="panel-title">Existing recent at-risk sessions</h3>
              <span className="panel-subtitle mono">Sandbox simulation data</span>
            </div>
            
            <div className="table-responsive" style={{ overflowX: 'auto', margin: '0 -1.5rem' }}>
              {sessions.length === 0 ? (
                <div style={{ padding: '2rem' }} className="mono text-muted">No recent sessions.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 1.5rem' }}>Session ID</th>
                      <th style={{ padding: '0.75rem 1.5rem' }}>Cart Value</th>
                      <th style={{ padding: '0.75rem 1.5rem' }}>Final Status</th>
                      <th style={{ padding: '0.75rem 1.5rem' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td className="mono" style={{ padding: '0.75rem 1.5rem' }}>{s.id}</td>
                        <td style={{ padding: '0.75rem 1.5rem' }}>₹{s.cart_value}</td>
                        <td style={{ padding: '0.75rem 1.5rem' }}>
                          <span className={`chip mono text-xs ${s.final_status === 'succeeded' ? 'chip-green' : 'chip-neutral'}`}>
                            {s.final_status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1.5rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Link to={`/sessions/${s.id}`} className="btn-outline text-xs">View</Link>
                            {s.intervention_type && (
                              <Link to={`/replay/${s.id}`} className="btn-primary text-xs">Replay</Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="panel-footer" style={{ padding: '1rem 0 0 0', margin: 'auto 0 0 0' }}>
              <Link to="/recovery-queue" className="btn-ghost text-xs">View all sessions</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
