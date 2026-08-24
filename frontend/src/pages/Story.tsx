import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Metrics } from '../lib/api';
import './Story.css';

export function Story() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [visible, setVisible] = useState<Set<number>>(new Set());
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    api.getMetrics().then(setMetrics).catch(console.error);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          const idx = parseInt(e.target.getAttribute('data-section') || '-1');
          if (e.isIntersecting) setVisible(prev => new Set([...prev, idx]));
        });
      },
      { threshold: 0.15 }
    );
    sectionRefs.current.forEach(el => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const fmt = (n?: number, prefix = '₹') =>
    n != null ? `${prefix}${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : '—';
  const pct = (n?: number) => n != null ? `${(n * 100).toFixed(1)}%` : '—';

  const section = (idx: number, className: string, children: React.ReactNode) => (
    <section
      ref={el => { sectionRefs.current[idx] = el; }}
      data-section={idx}
      className={`story-section ${className} ${visible.has(idx) ? 'visible' : ''}`}
    >
      {children}
    </section>
  );

  return (
    <div className="story-page">
      <nav className="story-nav">
        <span className="mono" style={{ color: 'var(--fg-muted)', fontSize: '0.7rem' }}>RAZORPAY RECOVERY</span>
        <Link to="/" className="btn" style={{ fontSize: '0.8rem' }}>← Console</Link>
      </nav>

      {/* Hero */}
      {section(0, 'story-hero', <>
        <div className="hero-eyebrow mono">CHECKOUT RECOVERY AGENT</div>
        <h1 className="hero-title">What happens after<br/><span className="accent-text">a payment fails?</span></h1>
        <p className="hero-sub">
          Most platforms log it. This one decides whether to act — and proves it can be trusted to do so without human supervision.
        </p>
        <div className="hero-badge mono">SANDBOX SIMULATION — REAL HYPERSWITCH RAILS · SIMULATED CUSTOMER OUTCOMES</div>
        <div className="hero-cta">
          <Link to="/" className="btn btn-primary">Open Console</Link>
          <a href="#act-1" className="btn">Read the story ↓</a>
        </div>
      </>)}

      {/* Act 1: The Problem */}
      {section(1, 'story-act', <>
        <div id="act-1" className="act-label mono">ACT I</div>
        <h2>The moment of failure is not the end.</h2>
        <p className="act-body">
          A customer adds items to their cart, reaches checkout, and their card is declined with error <code className="mono">DC_08</code>. In most systems, that session is abandoned silently — revenue lost, no audit, no recovery attempt.
        </p>
        <div className="stat-row">
          <div className="story-stat">
            <div className="stat-num">{pct(metrics?.baseline_conversion)}</div>
            <div className="stat-label mono">Baseline conversion<br/>without agent</div>
          </div>
          <div className="stat-arrow">→</div>
          <div className="story-stat accent">
            <div className="stat-num">{pct(metrics?.agent_conversion)}</div>
            <div className="stat-label mono">With agent<br/>(same sessions)</div>
          </div>
          <div className="stat-arrow">→</div>
          <div className="story-stat gold">
            <div className="stat-num">+{((metrics?.recovery_lift || 0) * 100).toFixed(1)} pp</div>
            <div className="stat-label mono">Conversion lift</div>
          </div>
        </div>
        <div className="act-link-row">
          <Link to="/" className="story-link">View live metrics →</Link>
        </div>
      </>)}

      {/* Act 2: The Agent */}
      {section(2, 'story-act', <>
        <div className="act-label mono">ACT II</div>
        <h2>The agent proposes. Code decides.</h2>
        <p className="act-body">
          A Upsonic-powered LLM reads the session state and proposes a recovery action. Before anything executes, eight deterministic guardrails check the proposal. The agent has no ability to bypass them.
        </p>
        <div className="guardrail-preview">
          {[
            { rule: 'Retry allowlist', value: 'DC_08 only' },
            { rule: 'Minimum confidence', value: '≥ 0.60' },
            { rule: 'Freshness cooldown', value: '60 seconds' },
            { rule: 'Maximum actions', value: '1 per session' },
            { rule: 'Amount immutability', value: 'Original only' },
            { rule: 'Unknown errors', value: 'Abstain by default' },
          ].map(g => (
            <div key={g.rule} className="guardrail-row">
              <span className="chip provenance-enforced" style={{ fontSize: '0.65rem' }}>CODE ENFORCED</span>
              <span className="guardrail-name">{g.rule}</span>
              <span className="guardrail-value mono">{g.value}</span>
            </div>
          ))}
        </div>
        <div className="act-link-row">
          <Link to="/policy" className="story-link">Full policy studio →</Link>
          <Link to="/guardrail-tracer" className="story-link">Guardrail tracer →</Link>
        </div>
      </>)}

      {/* Act 3: The Evidence */}
      {section(3, 'story-act', <>
        <div className="act-label mono">ACT III</div>
        <h2>Real rails. Provenance-labeled outcomes.</h2>
        <p className="act-body">
          Successful retries hit the actual Hyperswitch sandbox and return real terminal payment statuses. Nudge outcomes are deterministic simulations. Every result is labeled so you never confuse the two.
        </p>
        <div className="evidence-split">
          <div className="evidence-card verified">
            <div className="chip provenance-verified" style={{ marginBottom: '1rem' }}>SANDBOX VERIFIED</div>
            <div className="evidence-amount">{fmt(metrics?.verified_sandbox_recovered_amount)}</div>
            <div className="evidence-label mono">Via real Hyperswitch retry payments</div>
          </div>
          <div className="evidence-card simulated">
            <div className="chip provenance-simulated" style={{ marginBottom: '1rem' }}>SIMULATED OUTCOME</div>
            <div className="evidence-amount">{fmt(metrics?.simulated_nudge_recovered_amount)}</div>
            <div className="evidence-label mono">Via deterministic modeled nudges</div>
          </div>
          <div className="evidence-card total">
            <div className="chip sandbox" style={{ marginBottom: '1rem' }}>TOTAL MODELED</div>
            <div className="evidence-amount">{fmt(metrics?.total_modeled_recovered_amount)}</div>
            <div className="evidence-label mono">Combined · not settled/live money</div>
          </div>
        </div>
        <div className="act-link-row">
          <Link to="/ledger" className="story-link">Recovery ledger →</Link>
          <Link to="/recovery-queue" className="story-link">Session queue →</Link>
        </div>
      </>)}

      {/* Act 4: The Proof */}
      {section(4, 'story-act', <>
        <div className="act-label mono">ACT IV</div>
        <h2>Every decision is auditable.</h2>
        <p className="act-body">
          The Guardrail Stress Test Tracer replays the deterministic rule chain against stored evidence for any session. The Recovery Replay shows the 5-step cinematic evidence log — risk, proposal, guardrails, action, outcome.
        </p>
        <div className="proof-chain">
          {['Risk Observed', 'Agent Proposal', 'Guardrails Run', 'Bounded Action', 'Outcome Recorded'].map((step, i) => (
            <div key={step} className="chain-item">
              <div className="chain-num mono">{i + 1}</div>
              <div className="chain-label">{step}</div>
              {i < 4 && <div className="chain-arrow">→</div>}
            </div>
          ))}
        </div>
        <div className="policy-invariants mono">
          <div className="invariant">✓ One action maximum per session</div>
          <div className="invariant">✓ Original amount only — no discounts</div>
          <div className="invariant">✓ Raw Hyperswitch payload retained for audit</div>
          <div className="invariant">✓ Zero hidden autonomous escalation</div>
        </div>
        <div className="act-link-row">
          <Link to="/guardrail-tracer" className="story-link">Guardrail tracer →</Link>
          <Link to="/audit-log" className="story-link">Audit log →</Link>
        </div>
      </>)}

      {/* Act 5: Batch stats */}
      {section(5, 'story-act', <>
        <div className="act-label mono">ACT V</div>
        <h2>The numbers from this batch.</h2>
        <div className="batch-stats-grid">
          <div className="batch-stat">
            <div className="bs-val">{metrics?.treatment_sessions ?? '—'}</div>
            <div className="bs-label mono">Treatment sessions</div>
          </div>
          <div className="batch-stat">
            <div className="bs-val">{metrics?.interventions_applied ?? '—'}</div>
            <div className="bs-label mono">Interventions applied</div>
          </div>
          <div className="batch-stat">
            <div className="bs-val">{metrics?.abstentions ?? '—'}</div>
            <div className="bs-label mono">Guardrail abstentions</div>
          </div>
          <div className="batch-stat">
            <div className="bs-val">{fmt(metrics?.false_positive_cost_inr)}</div>
            <div className="bs-label mono">False-positive cost</div>
          </div>
        </div>
        <p className="act-body" style={{ marginTop: '2rem' }}>
          The agent abstained {metrics?.abstentions} time{metrics?.abstentions !== 1 ? 's' : ''} — proving the guardrails fire in production scenarios, not just in unit tests. One of those abstentions is a freshness-rule test fixture preserved for inspection.
        </p>
        <div className="act-link-row">
          <Link to="/error-intelligence" className="story-link">Error intelligence →</Link>
          <Link to="/compare" className="story-link">Session comparator →</Link>
        </div>
      </>)}

      {/* Final CTA */}
      {section(6, 'story-finale', <>
        <div className="act-label mono">EXPLORE THE CONSOLE</div>
        <h2>The evidence is in the console.</h2>
        <p className="act-body" style={{ maxWidth: '500px', margin: '0 auto 3rem' }}>
          Every claim above is backed by an inspectable page. The agent proposes. Deterministic code permits or denies. Every outcome is in the audit trail.
        </p>
        <div className="finale-links">
          <Link to="/" className="btn btn-primary">Overview</Link>
          <Link to="/recovery-queue" className="btn">Recovery Queue</Link>
          <Link to="/policy" className="btn">Policy Studio</Link>
          <Link to="/architecture" className="btn">Architecture</Link>
          <Link to="/ledger" className="btn">Recovery Ledger</Link>
          <Link to="/audit-log" className="btn">Audit Log</Link>
        </div>
        <div className="finale-badge mono">
          SANDBOX SIMULATION — REAL HYPERSWITCH PAYMENT RAILS · SIMULATED CUSTOMER OUTCOMES
        </div>
      </>)}
    </div>
  );
}
