import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Metrics, type Session } from '../lib/api';
import { Funnel } from '../components/Funnel';

export function Overview() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [m, s] = await Promise.all([
          api.getMetrics(),
          api.getSessions({ at_risk: 'true', limit: '5' })
        ]);
        setMetrics(m);
        setSessions(s.sessions);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="loader">Loading metrics...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;
  if (!metrics) return null;

  return (
    <div>
      <div className="header">
        <div>
          <h1 className="title">Checkout Recovery Agent</h1>
          <div className="methodology">
            <strong>Sandbox simulation — real Hyperswitch payment rails; simulated customer outcomes.</strong><br/>
            The 100-session dataset and customer responses are programmatically simulated to evaluate the bounded agent.
            Recovery metrics strictly distinguish between verified live sandbox payments and deterministic modeled nudges.
          </div>
        </div>
        <div className="chip sandbox">SANDBOX / SIMULATED</div>
      </div>

      <div className="metrics-grid">
        <div className="metric">
          <div className="metric-label">Total Modeled Recovery</div>
          <div className="metric-value accent">₹{metrics.total_modeled_recovered_amount.toLocaleString()}</div>
          <div className="metric-sub" style={{ marginTop: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: 'var(--fg)' }}>
              <span>Verified sandbox retry recovery:</span>
              <span className="mono">₹{metrics.verified_sandbox_recovered_amount.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Simulated nudge recovery:</span>
              <span className="mono">₹{metrics.simulated_nudge_recovered_amount.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">Conversion Lift</div>
          <div className="metric-value">
            {metrics.recovery_lift > 0 ? '+' : ''}{(metrics.recovery_lift * 100).toFixed(1)} pp
          </div>
          <div className="metric-sub">
            Baseline: {(metrics.baseline_conversion * 100).toFixed(1)}% → Agent: {(metrics.agent_conversion * 100).toFixed(1)}%
          </div>
          <div className="metric-bar-container">
            <div className="metric-bar-fill" style={{ width: `${metrics.agent_conversion * 100}%` }}></div>
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">False-Positive Cost</div>
          <div className="metric-value" style={{ color: 'var(--warning)' }}>
            ₹{metrics.false_positive_cost_inr.toFixed(2)}
          </div>
          <div className="metric-sub">{metrics.false_positives} interventions on self-converts</div>
        </div>
        <div className="metric">
          <div className="metric-label">Abstain & Unresolved</div>
          <div className="metric-value" style={{ fontSize: '2rem', marginTop: '1rem' }}>
            {(metrics.abstain_rate * 100).toFixed(1)}% / {(metrics.unresolvable_rate * 100).toFixed(1)}%
          </div>
          <div className="metric-sub">Agent chose 'none' or system error</div>
        </div>
      </div>

      <Funnel />

      <h3>Recent At-Risk Sessions</h3>
      <div className="panel" style={{ padding: 0 }}>
        {sessions.length === 0 ? (
          <div style={{ padding: '2rem' }} className="mono">No recent sessions.</div>
        ) : (
          <table>
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
                    <span className={`chip ${s.final_status === 'succeeded' ? 'success' : 'error'}`}>
                      {s.final_status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link to={`/sessions/${s.id}`} className="btn">View</Link>
                      {s.intervention_type && (
                        <Link to={`/replay/${s.id}`} className="btn" style={{ background: 'var(--accent)', color: 'var(--bg)' }}>▶ Replay</Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
