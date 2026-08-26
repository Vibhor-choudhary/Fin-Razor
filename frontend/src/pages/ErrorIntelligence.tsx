import { useEffect, useState, useMemo } from 'react';
import { api, type Session } from '../lib/api';
import { useReveal } from '../hooks/useReveal';
import './ErrorIntelligence.css';

interface ErrorGroup {
  signal: string;
  count: number;
  valueAtRisk: number;
  policyPosture: string;
  actionMix: { retry: number; nudge: number; none: number; abstain: number };
  outcomeMix: { succeeded: number; failed: number; rejected: number };
  provenance: string;
  safeText: string;
}

export function ErrorIntelligence() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getAllSessions();
        setSessions(res);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, ErrorGroup>();

    sessions.forEach(s => {
      let signal = 'Unknown / no policy';
      let policyPosture = 'Default deny — abstain';
      let provenance = 'GUARDRAIL ABSTAINED';
      let safeText = 'Unrecognized errors are not retried. They are recorded and abstained until intentionally allowlisted in code.';

      if (s.latest_error_code === 'DC_08') {
        signal = 'DC_08';
        policyPosture = 'Allowlisted for one bounded retry';
        provenance = 'SANDBOX VERIFIED RETRY';
        safeText = 'Known card decline error.';
      } else if (s.initial_status === 'requires_payment_method') {
        signal = 'requires_payment_method';
        policyPosture = 'Eligible for one recovery nudge';
        provenance = 'SIMULATED OUTCOME';
        safeText = 'Checkout abandonment state.';
      } else if (s.initial_status === 'succeeded' || s.final_status === 'succeeded') {
        if (!s.intervention_type) {
          signal = 'succeeded';
          policyPosture = 'Excluded — no recovery action';
          provenance = 'N/A';
          safeText = 'Completed payment.';
        }
      } else {
        if (s.latest_error_code) {
          signal = s.latest_error_code;
        }
      }

      if (!map.has(signal)) {
        map.set(signal, {
          signal,
          count: 0,
          valueAtRisk: 0,
          policyPosture,
          actionMix: { retry: 0, nudge: 0, none: 0, abstain: 0 },
          outcomeMix: { succeeded: 0, failed: 0, rejected: 0 },
          provenance,
          safeText
        });
      }

      const g = map.get(signal)!;
      g.count++;
      if (s.at_risk) {
        g.valueAtRisk += s.cart_value;
      }

      if (s.intervention_type) {
        if (s.intervention_type === 'retry') g.actionMix.retry++;
        else if (s.intervention_type === 'nudge') g.actionMix.nudge++;
        else if (s.intervention_type === 'none') g.actionMix.none++;
        else if (s.intervention_type === 'abstain') g.actionMix.abstain++;
      }

      if (s.intervention_status) {
        if (s.intervention_status === 'succeeded') g.outcomeMix.succeeded++;
        else if (s.intervention_status === 'failed') g.outcomeMix.failed++;
        else if (s.intervention_status === 'rejected') g.outcomeMix.rejected++;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [sessions]);

  const hasUnknown = groups.some(g => g.policyPosture.includes('Default deny'));
  const selectedGroup = groups.find(g => g.signal === selectedSignal);

  const revealRef = useReveal({ selector: '.reveal-item' });

  return (
    <div className="ei-container slide-up" ref={revealRef}>
      <div className="header" style={{ marginBottom: '2rem' }}>
        <h1 className="title">Error Intelligence</h1>
        <div className="methodology">
          HISTORICAL SANDBOX ANALYSIS — Groups are derived strictly from observed session evidence.
        </div>
      </div>

      <div className="default-deny-callout">
        {hasUnknown ? 
          'Unrecognized errors are not retried. They are recorded and abstained until intentionally allowlisted in code.' :
          'No unknown error codes observed in this sandbox batch. Default-deny remains active.'
        }
      </div>

      {loading ? (
        <div className="loader">Loading analysis...</div>
      ) : error ? (
        <div className="error-state">Error: {error}</div>
      ) : (
        <div className="ei-layout">
          <div className="ei-table-container panel">
            <table className="ei-table">
              <thead>
                <tr>
                  <th>Signal</th>
                  <th>Sessions</th>
                  <th>Value at Risk</th>
                  <th>Policy Posture</th>
                </tr>
              </thead>
              <tbody>
                {groups.map(g => {
                  const isClickable = g.signal === 'DC_08' || g.signal === 'requires_payment_method' || g.signal === 'succeeded';
                  return (
                    <tr 
                      key={g.signal} 
                      onClick={() => isClickable && setSelectedSignal(g.signal)}
                      className={isClickable ? (selectedSignal === g.signal ? 'selected clickable' : 'clickable') : 'unclickable'}
                    >
                      <td className="mono" style={{ fontWeight: 'bold' }}>{g.signal}</td>
                      <td>{g.count}</td>
                      <td>{g.valueAtRisk > 0 ? `₹${g.valueAtRisk}` : '—'}</td>
                      <td>
                        <span className={`chip ${g.signal === 'succeeded' ? 'success' : g.policyPosture.includes('deny') ? 'error' : 'sandbox'}`}>
                          {g.policyPosture}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="ei-detail-panel panel">
            {selectedGroup ? (
              <div className="ei-detail-content slide-up" key={selectedGroup.signal}>
                <h2 className="mono">{selectedGroup.signal}</h2>
                <div className="chip sandbox" style={{ marginBottom: '1rem', display: 'inline-block' }}>{selectedGroup.provenance}</div>
                
                <div className="detail-section">
                  <h4>Observed Evidence Summary</h4>
                  <p>{selectedGroup.safeText}</p>
                </div>
                
                <div className="detail-section">
                  <h4>Policy Explanation</h4>
                  <p>{selectedGroup.policyPosture}</p>
                </div>

                <div className="detail-section">
                  <h4>Action Distribution</h4>
                  <div className="dist-bars mono">
                    <div>Retry: {selectedGroup.actionMix.retry}</div>
                    <div>Nudge: {selectedGroup.actionMix.nudge}</div>
                    <div>None: {selectedGroup.actionMix.none}</div>
                    <div>Abstain: {selectedGroup.actionMix.abstain}</div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Outcome Distribution</h4>
                  <div className="dist-bars mono">
                    <div style={{ color: 'var(--accent)' }}>Succeeded: {selectedGroup.outcomeMix.succeeded}</div>
                    <div style={{ color: 'var(--error)' }}>Failed: {selectedGroup.outcomeMix.failed}</div>
                    <div style={{ color: 'var(--gold)' }}>Rejected: {selectedGroup.outcomeMix.rejected}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="ei-empty-state">
                Select a clickable signal row to view detailed evidence and policy bounds.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
