import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Metrics, type Session, type Log } from '../lib/api';
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
    <div className="overview-container">
      {/* ABOVE THE FOLD */}
      <div className="hero-section">
        <span className="eyebrow mono">CHECKOUT RECOVERY CONTROL</span>
        <h1 className="hero-title">Recover failed checkouts with confidence.</h1>
        <p className="hero-subtitle">
          Review at-risk sessions, apply only permitted actions, and keep every decision inspectable.
        </p>
        
        <div className="hero-actions">
          <Link to="/recovery-queue" className="btn-primary-large">Review recovery queue</Link>
          <Link to="/lab" className="link-secondary">Run a controlled test →</Link>
        </div>

        <div className="business-value-block">
          <div className="value-label">Recovery opportunity</div>
          <div className="value-metric">₹{metrics.total_modeled_recovered_amount.toLocaleString()}</div>
          <div className="value-provenance mono">Total modeled recovery (verified + simulated)</div>
        </div>
      </div>

      {/* BELOW THE FOLD */}
      <div className="editorial-sections">
        
        {/* Section 1: What recovery changes */}
        <section className="editorial-section">
          <h2>What recovery changes</h2>
          <div className="cohort-inline-comparison">
            <div className="cohort-row">
              <span className="cohort-label mono">Control</span>
              <span className="cohort-pct">{(metrics.baseline_conversion * 100).toFixed(1)}%</span>
            </div>
            <div className="cohort-row">
              <span className="cohort-label mono">Agent</span>
              <span className="cohort-pct text-green">{(metrics.agent_conversion * 100).toFixed(1)}%</span>
            </div>
            <div className="cohort-diff mono">
              Difference: {metrics.recovery_lift > 0 ? '+' : ''}{(metrics.recovery_lift * 100).toFixed(1)} pp
            </div>
          </div>
          <p className="section-note">Recorded sandbox evaluation—not a production forecast.</p>
        </section>

        {/* Section 2: How every action stays controlled */}
        <section className="editorial-section">
          <h2>How every action stays controlled</h2>
          <div className="lifecycle-statements">
            <span className="statement">Detect</span>
            <span className="arrow">→</span>
            <span className="statement">Evaluate</span>
            <span className="arrow">→</span>
            <span className="statement">Permit or abstain</span>
            <span className="arrow">→</span>
            <span className="statement">Record outcome</span>
          </div>
          <Link to="/policy" className="link-secondary">Read the policy →</Link>
        </section>

        {/* Section 3: Recent decisions */}
        <section className="editorial-section">
          <h2>Recent decisions</h2>
          <div className="recent-decisions-list">
            {recentLogs.length === 0 ? (
              <div className="mono text-muted py-4">Evidence unavailable</div>
            ) : (
              recentLogs.slice(0, 5).map((log, i) => (
                <div key={i} className="decision-row">
                  <div className="decision-info">
                    <span className="mono decision-id">{log.session_id}</span>
                    <span className="decision-outcome">
                      {log.outcome === 'succeeded' ? (
                         <span className="text-green">Succeeded</span>
                      ) : log.outcome === 'abstained' ? (
                         <span className="text-muted">Abstained</span>
                      ) : (
                         <span className="text-red">Failed</span>
                      )}
                    </span>
                    <span className="decision-provenance mono text-muted">{log.type}</span>
                  </div>
                  <Link to={`/replay/${log.session_id}`} className="link-secondary">View evidence</Link>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Existing At-Risk Sessions Table */}
        <section className="editorial-section subdued-section">
          <h3 className="subdued-heading">Sessions needing review</h3>
          <div className="table-responsive">
            {sessions.length === 0 ? (
              <div className="mono text-muted py-4">No recent sessions.</div>
            ) : (
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>Session ID</th>
                    <th>Cart Value</th>
                    <th>Final Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id}>
                      <td className="mono">{s.id}</td>
                      <td>₹{s.cart_value}</td>
                      <td>
                        <span className={`status-text ${s.final_status === 'succeeded' ? 'text-green' : 'text-red'}`}>
                          {s.final_status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <Link to={`/sessions/${s.id}`} className="link-secondary">View</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
