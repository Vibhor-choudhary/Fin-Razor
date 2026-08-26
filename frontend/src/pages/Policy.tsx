import { useEffect, useState } from 'react';
import { api, type Metrics } from '../lib/api';
import { PageHeader } from '../components/PageHeader';
import { ProvenanceChip } from '../components/ProvenanceChip';
import { ShieldAlert, AlertTriangle, Scale, Clock, Hourglass, Lock, Coins } from 'lucide-react';
import './Policy.css';

export function Policy() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const m = await api.getMetrics();
        setMetrics(m);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <PageHeader 
          title="Guardrails" 
          description="Bounded by code, not confidence alone. The model proposes, but deterministic rules decide whether anything executes."
          eyebrow="INTERVENTION POLICY"
        />
        <div style={{ marginTop: 'var(--space-4)' }}>
          <ProvenanceChip type="enforced" label="POLICY v1 · CODE ENFORCED" />
          <div className="mono text-caption text-muted mt-2">Changes require code review and redeployment.</div>
        </div>
      </div>

      <div className="panel mb-6 fade-in" style={{ padding: 'var(--space-4)' }}>
        <div className="decision-boundary">
          <div className="flow-step">
            <span className="mono">Risk signal</span>
          </div>
          <div className="flow-arrow text-muted">→</div>
          <div className="flow-step advisory text-secondary">
            <span className="mono">LLM proposal</span>
          </div>
          <div className="flow-arrow text-muted">→</div>
          <div className="flow-step authoritative" style={{ fontWeight: 600, color: 'var(--ink)' }}>
            <Lock size={14} style={{ marginRight: 6 }} />
            <span className="mono">Deterministic policy</span>
          </div>
          <div className="flow-arrow text-muted">→</div>
          <div className="flow-step">
            <span className="mono">Action / Abstain</span>
          </div>
          <div className="flow-arrow text-muted">→</div>
          <div className="flow-step">
            <span className="mono">Audit trail</span>
          </div>
        </div>
      </div>

      <h2 className="title-section mb-4">Active Guardrails</h2>
      
      <div className="policy-grid">
        <div className="policy-card">
          <div className="card-header mb-3">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <ShieldAlert size={16} className="text-secondary" />
              <h3 className="text-label m-0">Retry allowlist</h3>
            </div>
          </div>
          <div className="mono mb-2">DC_08 only</div>
          <p className="text-secondary text-sm mb-1"><strong>Why:</strong> Retries are permitted only for the observed, explicitly allowlisted card-decline code.</p>
          <p className="text-sm"><strong>Effect:</strong> Unseen error codes cannot trigger a retry.</p>
        </div>

        <div className="policy-card">
          <div className="card-header mb-3">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <AlertTriangle size={16} className="text-secondary" />
              <h3 className="text-label m-0">Unknown errors</h3>
            </div>
          </div>
          <div className="mono mb-2">ABSTAIN BY DEFAULT</div>
          <p className="text-secondary text-sm mb-1"><strong>Why:</strong> The system does not assume an unfamiliar failure is recoverable.</p>
          <p className="text-sm"><strong>Effect:</strong> No action is taken until a rule is intentionally added in code.</p>
        </div>

        <div className="policy-card">
          <div className="card-header mb-3">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Scale size={16} className="text-secondary" />
              <h3 className="text-label m-0">Minimum confidence</h3>
            </div>
          </div>
          <div className="mono mb-2">≥ 0.60</div>
          <p className="text-secondary text-sm mb-1"><strong>Why:</strong> Low-confidence model recommendations are not sufficient to act.</p>
          <p className="text-sm"><strong>Effect:</strong> The proposal is recorded, then rejected.</p>
        </div>

        <div className="policy-card">
          <div className="card-header mb-3">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Clock size={16} className="text-secondary" />
              <h3 className="text-label m-0">Freshness cooldown</h3>
            </div>
          </div>
          <div className="mono mb-2">60 seconds</div>
          <p className="text-secondary text-sm mb-1"><strong>Why:</strong> A customer may still be actively completing checkout.</p>
          <p className="text-sm"><strong>Effect:</strong> The agent waits rather than racing the customer.</p>
        </div>

        <div className="policy-card">
          <div className="card-header mb-3">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Hourglass size={16} className="text-secondary" />
              <h3 className="text-label m-0">Abandonment threshold</h3>
            </div>
          </div>
          <div className="mono mb-2">10 minutes</div>
          <p className="text-secondary text-sm mb-1"><strong>Why:</strong> A payment method must remain incomplete long enough to be considered genuine abandonment.</p>
          <p className="text-sm"><strong>Effect:</strong> No nudge is considered before this threshold.</p>
        </div>

        <div className="policy-card">
          <div className="card-header mb-3">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Lock size={16} className="text-secondary" />
              <h3 className="text-label m-0">Maximum actions</h3>
            </div>
          </div>
          <div className="mono mb-2">1 action per session</div>
          <p className="text-secondary text-sm mb-1"><strong>Why:</strong> Recovery must not become repeated charging or repeated customer outreach.</p>
          <p className="text-sm"><strong>Effect:</strong> Every later proposal is blocked.</p>
        </div>

        <div className="policy-card">
          <div className="card-header mb-3">
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Coins size={16} className="text-secondary" />
              <h3 className="text-label m-0">Amount immutability</h3>
            </div>
          </div>
          <div className="mono mb-2">ORIGINAL AMOUNT ONLY</div>
          <p className="text-secondary text-sm mb-1"><strong>Why:</strong> The agent is never permitted to discount, increase, split, or alter money.</p>
          <p className="text-sm"><strong>Effect:</strong> A retry must exactly match the original cart value.</p>
        </div>
      </div>

      <div style={{ marginTop: 'var(--space-7)' }}>
        <h2 className="title-section mb-4">Guardrail Efficacy Overview</h2>
        {!loading && metrics ? (
          <div className="metric-blocks-grid">
            <div className="panel">
              <div className="text-label mb-1">Total Proposals Reviewed</div>
              <div className="mono" style={{ fontSize: '32px' }}>{metrics.treatment_sessions}</div>
            </div>
            <div className="panel">
              <div className="text-label mb-1">Enforced Abstentions</div>
              <div className="mono" style={{ fontSize: '32px', color: 'var(--warning)' }}>{metrics.abstentions}</div>
            </div>
            <div className="panel">
              <div className="text-label mb-1">Permitted Actions</div>
              <div className="mono" style={{ fontSize: '32px', color: 'var(--ink)' }}>{metrics.interventions_applied}</div>
            </div>
          </div>
        ) : (
          <div className="text-muted fade-in mono">Loading metrics...</div>
        )}
      </div>
    </div>
  );
}
