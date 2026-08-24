import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Metrics, type Session } from '../lib/api';
import './Policy.css';
import { ShieldAlert, AlertTriangle, Scale, Clock, Hourglass, Lock, Coins, CheckCircle2 } from 'lucide-react';

export function Policy() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [fixtureId, setFixtureId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const m = await api.getMetrics();
        setMetrics(m);
        // Attempt to find the freshness fixture
        const sRes = await api.getSessions({ limit: '100' });
        const fixture = sRes.sessions.find((s: Session) => s.id.includes('guardrail_test'));
        if (fixture) setFixtureId(fixture.id);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="policy-container slide-in">
      <div className="policy-header">
        <div className="policy-header-content">
          <div className="eyebrow mono">INTERVENTION POLICY</div>
          <h1 className="title">Bounded by code, not confidence alone.</h1>
          <p className="description">
            The model may propose an action. These deterministic rules decide whether anything is allowed to execute. Policy is read-only in this demo.
          </p>
        </div>
        <div className="policy-status">
          <div className="chip provenance-enforced">
            <Lock size={14} style={{ marginRight: 6 }} />
            POLICY v1 · CODE ENFORCED
          </div>
          <div className="status-note mono">Changes require code review and redeployment.</div>
        </div>
      </div>

      <div className="decision-boundary panel">
        <div className="flow-step">
          <span className="mono">Risk signal</span>
        </div>
        <div className="flow-arrow">→</div>
        <div className="flow-step advisory">
          <span className="mono">LLM proposal</span>
        </div>
        <div className="flow-arrow">→</div>
        <div className="flow-step authoritative">
          <Lock size={14} style={{ marginRight: 6 }} />
          <span className="mono">Deterministic policy</span>
        </div>
        <div className="flow-arrow">→</div>
        <div className="flow-step">
          <span className="mono">One bounded action or abstention</span>
        </div>
        <div className="flow-arrow">→</div>
        <div className="flow-step">
          <span className="mono">Audit trail</span>
        </div>
      </div>

      <div className="policy-grid-section">
        <h2>Active guardrails</h2>
        <div className="policy-grid">
          
          <div className="policy-card">
            <div className="card-header">
              <ShieldAlert size={18} className="icon-gold" />
              <h3>Retry allowlist</h3>
              <span className="chip provenance-enforced">CODE ENFORCED</span>
            </div>
            <div className="card-value mono">DC_08 only</div>
            <p className="card-why"><strong>Why:</strong> Retries are permitted only for the observed, explicitly allowlisted card-decline code.</p>
            <p className="card-effect"><strong>Effect:</strong> Unseen error codes cannot trigger a retry.</p>
          </div>

          <div className="policy-card">
            <div className="card-header">
              <AlertTriangle size={18} className="icon-gold" />
              <h3>Unknown errors</h3>
              <span className="chip provenance-enforced">CODE ENFORCED</span>
            </div>
            <div className="card-value mono">ABSTAIN BY DEFAULT</div>
            <p className="card-why"><strong>Why:</strong> The system does not assume an unfamiliar failure is recoverable.</p>
            <p className="card-effect"><strong>Effect:</strong> No action is taken until a rule is intentionally added in code.</p>
          </div>

          <div className="policy-card">
            <div className="card-header">
              <Scale size={18} className="icon-gold" />
              <h3>Minimum confidence</h3>
              <span className="chip provenance-enforced">CODE ENFORCED</span>
            </div>
            <div className="card-value mono">≥ 0.60</div>
            <p className="card-why"><strong>Why:</strong> Low-confidence model recommendations are not sufficient to act.</p>
            <p className="card-effect"><strong>Effect:</strong> The proposal is recorded, then rejected.</p>
          </div>

          <div className="policy-card">
            <div className="card-header">
              <Clock size={18} className="icon-gold" />
              <h3>Freshness cooldown</h3>
              <span className="chip provenance-enforced">CODE ENFORCED</span>
            </div>
            <div className="card-value mono">60 seconds</div>
            <p className="card-why"><strong>Why:</strong> A customer may still be actively completing checkout.</p>
            <p className="card-effect"><strong>Effect:</strong> The agent waits rather than racing the customer.</p>
          </div>

          <div className="policy-card">
            <div className="card-header">
              <Hourglass size={18} className="icon-gold" />
              <h3>Abandonment threshold</h3>
              <span className="chip provenance-enforced">CODE ENFORCED</span>
            </div>
            <div className="card-value mono">10 minutes</div>
            <p className="card-why"><strong>Why:</strong> A payment method must remain incomplete long enough to be considered genuine checkout abandonment.</p>
            <p className="card-effect"><strong>Effect:</strong> No nudge is considered before this threshold.</p>
          </div>

          <div className="policy-card">
            <div className="card-header">
              <Lock size={18} className="icon-gold" />
              <h3>Maximum actions</h3>
              <span className="chip provenance-enforced">CODE ENFORCED</span>
            </div>
            <div className="card-value mono">1 action per session</div>
            <p className="card-why"><strong>Why:</strong> Recovery must not become repeated charging or repeated customer outreach.</p>
            <p className="card-effect"><strong>Effect:</strong> Every later proposal is blocked.</p>
          </div>

          <div className="policy-card">
            <div className="card-header">
              <Coins size={18} className="icon-gold" />
              <h3>Amount immutability</h3>
              <span className="chip provenance-enforced">CODE ENFORCED</span>
            </div>
            <div className="card-value mono">ORIGINAL AMOUNT ONLY</div>
            <p className="card-why"><strong>Why:</strong> The agent is never permitted to discount, increase, split, or alter money.</p>
            <p className="card-effect"><strong>Effect:</strong> A retry must exactly match the original cart value.</p>
          </div>

          <div className="policy-card">
            <div className="card-header">
              <CheckCircle2 size={18} className="icon-gold" />
              <h3>Completed-payment exclusion</h3>
              <span className="chip provenance-enforced">CODE ENFORCED</span>
            </div>
            <div className="card-value mono">SUCCEEDED SESSIONS EXCLUDED</div>
            <p className="card-why"><strong>Why:</strong> A completed payment does not need recovery.</p>
            <p className="card-effect"><strong>Effect:</strong> The agent never intervenes after success.</p>
          </div>

        </div>
      </div>

      <div className="proof-section panel">
        <h2>Proof in this batch</h2>
        <div className="proof-grid">
          <div className="metric">
            <div className="metric-label">Abstention Rate</div>
            <div className="metric-value">
              {loading ? '—' : metrics ? `${(metrics.abstain_rate * 100).toFixed(1)}%` : '—'}
            </div>
            <div className="metric-sub mono">
              {loading ? '—' : metrics ? `${metrics.abstentions} sessions` : '—'}
            </div>
          </div>
          <div className="metric">
            <div className="metric-label">False-Positive Cost</div>
            <div className="metric-value">
              {loading ? '—' : metrics ? `₹${metrics.false_positive_cost_inr.toFixed(2)}` : '—'}
            </div>
          </div>
          <div className="metric">
            <div className="metric-label">Treatment Sessions</div>
            <div className="metric-value">
              {loading ? '—' : metrics ? metrics.treatment_sessions : '—'}
            </div>
          </div>
          <div className="metric">
            <div className="metric-label">Maximum Actions</div>
            <div className="metric-value">1 action maximum</div>
            <div className="metric-sub mono">Immutable policy statement</div>
          </div>
        </div>

        <div className="fixture-callout">
          <p>
            One recorded guardrail abstention is available as a test fixture for the freshness rule.
          </p>
          {fixtureId && (
            <Link to={`/replay/${fixtureId}`} className="btn" style={{ background: 'var(--bg-hover)' }}>
              View Test Fixture Replay
            </Link>
          )}
        </div>
      </div>

      <div className="policy-footer">
        <h3>What policy cannot do</h3>
        <ul className="cannot-do-list mono">
          <li>No amount changes</li>
          <li>No unlimited retries</li>
          <li>No action on unknown errors</li>
          <li>No hidden autonomous escalation</li>
        </ul>
        <p className="footer-conclusion">
          The agent proposes. Deterministic code permits or denies. Every outcome is retained in the audit trail.
        </p>
        {metrics && (
          <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--fg-muted)' }}>
            Data Mode: {metrics.data_mode}
          </div>
        )}
      </div>
    </div>
  );
}
