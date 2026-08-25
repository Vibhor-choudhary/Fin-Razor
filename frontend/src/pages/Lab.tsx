import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type LabScenario, type LabRunResponse } from '../lib/api';
import {
  Play,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Lock,
  ReceiptText,
  FileSearch,
  ExternalLink
} from 'lucide-react';
import './Lab.css';

export function Lab() {
  const [scenarios, setScenarios] = useState<LabScenario[]>([]);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('card_declined');
  const [amountInr, setAmountInr] = useState<number>(150);
  const [isLoadingScenarios, setIsLoadingScenarios] = useState<boolean>(true);
  
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<LabRunResponse | null>(null);
  
  const [recentLabRuns, setRecentLabRuns] = useState<any[]>([]);

  const fetchRecentRuns = async () => {
    try {
      const data = await api.getSessions({ limit: '50' });
      const labSessions = data.sessions.filter(s => s.id.startsWith('lab_')).slice(0, 5);
      setRecentLabRuns(labSessions);
    } catch (err) {
      console.error('Failed to load recent lab runs:', err);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    api.getLabScenarios()
      .then((data) => {
        setScenarios(data.scenarios || []);
        setIsReadOnly(Boolean(data.read_only));
        setIsLoadingScenarios(false);
      })
      .catch((err) => {
        console.error('Failed to load lab scenarios:', err);
        setErrorMsg('Failed to load sandbox scenarios from backend.');
        setIsLoadingScenarios(false);
      });
      
    fetchRecentRuns();
  }, []);

  const handleRun = async () => {
    if (!selectedScenarioId || isRunning || isReadOnly) return;
    if (amountInr < 10 || amountInr > 5000 || isNaN(amountInr)) {
      setErrorMsg('Amount must be between ₹10 and ₹5,000.');
      return;
    }

    setIsRunning(true);
    setErrorMsg(null);
    setRunResult(null);

    try {
      const res = await api.runLabScenario({
        scenario_id: selectedScenarioId,
        amount_inr: Number(amountInr)
      });
      setRunResult(res);
      fetchRecentRuns();
    } catch (err: any) {
      console.error('Lab execution error:', err);
      setErrorMsg(err.message || 'Controlled scenario execution failed.');
    } finally {
      setIsRunning(false);
    }
  };

  const selectedScenario = scenarios.find(s => s.id === selectedScenarioId);
  const isValidAmount = !isNaN(amountInr) && amountInr >= 10 && amountInr <= 5000;

  return (
    <div className="lab-container slide-up">
      {/* 1. Header & Environment Banner */}
      <div className="lab-header">
        <div className="lab-header-left">
          <span className="doc-tree-eyebrow mono">CONTROLLED SANDBOX EXECUTION</span>
          <h1 className="lab-title">Recovery Lab</h1>
          <p className="lab-description">
            Run an approved Hyperswitch test scenario. The backend owns payment secrets, scenario mapping, and policy execution.
          </p>
        </div>

        <div className="lab-header-right">
          {isReadOnly ? (
            <div className="lab-env-badge read-only mono">
              <Lock size={12} />
              <span>PUBLIC DEMO · READ ONLY</span>
            </div>
          ) : (
            <div className="lab-env-badge local-enabled mono">
              <span className="doc-dot-pulse" aria-hidden="true"></span>
              <span>LOCAL SANDBOX ENABLED</span>
            </div>
          )}
        </div>
      </div>

      {isReadOnly && (
        <div className="lab-readonly-notice">
          <Lock size={16} className="text-gold flex-shrink-0" />
          <div className="text-sm">
            <strong>Read-Only Safety Lock Active:</strong> Recovery Lab execution is disabled in public demonstration mode (<code className="mono">APP_ENV=demo_readonly</code>). Run locally to execute real sandbox payments.
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="lab-error-banner" role="alert">
          <AlertTriangle size={16} className="text-red flex-shrink-0" />
          <span className="text-sm">{errorMsg}</span>
        </div>
      )}

      {/* 2. Configuration Grid: Scenarios & Parameters */}
      <div className="lab-config-grid">
        {/* Scenario Selection Section */}
        <div className="lab-config-card">
          <div className="card-section-header">
            <span className="card-section-tag mono">STEP 01</span>
            <h3 className="card-section-heading">Select Approved Scenario</h3>
            <p className="card-section-sub">
              Scenario maps to a controlled Hyperswitch sandbox test profile.
            </p>
          </div>

          {isLoadingScenarios ? (
            <div className="lab-loading-state mono text-xs text-muted">
              Loading approved sandbox scenarios…
            </div>
          ) : (
            <div className="lab-scenarios-list" role="radiogroup" aria-label="Sandbox Scenarios">
              {scenarios.map((s) => {
                const isSelected = selectedScenarioId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={`lab-scenario-card ${isSelected ? 'selected' : ''}`}
                    disabled={isRunning || isReadOnly || !!runResult}
                    style={{ opacity: (isRunning || isReadOnly || !!runResult) && !isSelected ? 0.6 : 1 }}
                    onClick={() => {
                      setSelectedScenarioId(s.id);
                      setErrorMsg(null);
                    }}
                  >
                    <div className="scenario-card-top">
                      <div className="scenario-title-row">
                        <div className="scenario-marker-dot" aria-hidden="true" />
                        <span className="scenario-label font-medium">{s.label}</span>
                      </div>
                      <span className={`chip mono text-xs ${
                        s.expected_class === 'success' ? 'chip-green' :
                        s.expected_class === 'customer_action' ? 'chip-cyan' :
                        'chip-neutral'
                      }`}>
                        {s.expected_class}
                      </span>
                    </div>

                    <p className="scenario-desc">{s.description}</p>

                    <div className="scenario-posture-row">
                      <span className="posture-tag mono text-xs">POLICY POSTURE:</span>
                      <span className="posture-val mono text-xs">{s.policy_posture}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Amount & Execution Control Card */}
        <div className="lab-config-card lab-controls-card">
          <div className="card-section-header">
            <span className="card-section-tag mono">STEP 02</span>
            <h3 className="card-section-heading">Order Value & Execution</h3>
            <p className="card-section-sub">
              Amount is converted to paise only on the server.
            </p>
          </div>

          <div className="lab-amount-box">
            <label htmlFor="lab-amount-input" className="amount-label mono text-xs">
              CART VALUE (INR)
            </label>
            <div className="amount-input-wrapper">
              <span className="currency-prefix mono">₹</span>
              <input
                id="lab-amount-input"
                type="number"
                min={10}
                max={5000}
                step={1}
                value={amountInr}
                onChange={(e) => setAmountInr(parseFloat(e.target.value))}
                className="lab-amount-input mono font-bold"
                disabled={isRunning || isReadOnly || !!runResult}
              />
            </div>
            <div className="amount-helper mono text-xs text-muted">
              Min ₹10 · Max ₹5,000 · Converted to paise only on the server.
            </div>
          </div>

          {selectedScenario && (
            <div className="lab-preflight-panel">
              <h4 className="preflight-title mono">RUN PREFLIGHT</h4>
              <div className="preflight-grid">
                <div className="preflight-row">
                  <span className="preflight-label mono">Environment</span>
                  <span className={`preflight-val mono font-bold ${isReadOnly ? 'text-gold' : 'text-green'}`}>
                    {isReadOnly ? 'PUBLIC DEMO · READ ONLY' : 'LOCAL SANDBOX ENABLED'}
                  </span>
                </div>
                <div className="preflight-row">
                  <span className="preflight-label mono">Selected scenario</span>
                  <div className="preflight-val-flex">
                    <span className="font-bold">{selectedScenario.label}</span>
                    <span className={`chip mono text-xs ${
                      selectedScenario.expected_class === 'success' ? 'chip-green' :
                      selectedScenario.expected_class === 'customer_action' ? 'chip-cyan' :
                      'chip-neutral'
                    }`}>
                      {selectedScenario.expected_class}
                    </span>
                  </div>
                </div>
                <div className="preflight-row">
                  <span className="preflight-label mono">Amount</span>
                  <div className="preflight-val-flex flex-col">
                    <span className="mono font-bold">₹{amountInr}</span>
                    <span className="mono text-muted text-xs">Server converts this value to paise.</span>
                  </div>
                </div>
                <div className="preflight-row">
                  <span className="preflight-label mono">Expected policy posture</span>
                  <span className="preflight-val mono text-xs">{selectedScenario.policy_posture}</span>
                </div>
                <div className="preflight-row">
                  <span className="preflight-label mono">Execution boundary</span>
                  <span className="preflight-val mono text-xs text-gold">One bounded action maximum. No card values or payment secrets leave the backend.</span>
                </div>
              </div>
              <div className="preflight-notice mono text-xs text-muted">
                A retry may be considered only after real payment evidence and policy checks.
              </div>
            </div>
          )}

          <div className="lab-action-row">
            {runResult || errorMsg ? (
              <div className="lab-run-completed-state">
                <span className="mono text-xs font-bold mb-3 block">
                  {runResult 
                    ? runResult.final_outcome.status === 'succeeded' || runResult.bounded_action.executed 
                      ? 'Run complete' 
                      : 'Run completed with partial evidence'
                    : 'Controlled run could not be completed. No automatic retry was sent.'
                  }
                </span>
                <button
                  type="button"
                  className="btn-outline lab-reset-btn"
                  onClick={() => {
                    setRunResult(null);
                    setErrorMsg(null);
                  }}
                >
                  <RefreshCw size={14} />
                  <span>Prepare another run</span>
                </button>
              </div>
            ) : (
              <div className="lab-run-controls">
                <button
                  type="button"
                  className="btn-primary lab-run-btn"
                  disabled={isRunning || !isValidAmount || isReadOnly || !selectedScenarioId}
                  onClick={handleRun}
                  aria-live="polite"
                >
                  {isRunning ? (
                    <>
                      <RefreshCw size={14} className="spin-icon" />
                      <span>Running controlled sandbox scenario…</span>
                    </>
                  ) : isReadOnly ? (
                    <>
                      <Lock size={14} />
                      <span>Run locally to execute sandbox scenarios</span>
                    </>
                  ) : (
                    <>
                      <Play size={14} />
                      <span>Run controlled scenario</span>
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>
                {isReadOnly && (
                  <div className="mono text-xs text-gold mt-2 text-center">
                    Run locally with controlled sandbox credentials to execute this scenario.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Result Dossier (reveals upon server response) */}
      {runResult && (
        <div className="lab-result-dossier slide-up" role="region" aria-label="Scenario Execution Dossier">
          <div className="dossier-header-bar">
            <div>
              <span className="doc-section-tag mono">RUN DOSSIER · {runResult.run_id}</span>
              <h2 className="dossier-heading">Execution Evidence Dossier</h2>
            </div>
            <div className="dossier-badge-cluster">
              <span className="chip mono text-xs chip-neutral">SESSION: {runResult.session_id}</span>
              <span className={`chip mono text-xs ${
                runResult.final_outcome.provenance === 'sandbox_verified' ? 'chip-green' :
                runResult.final_outcome.provenance === 'simulated_outcome' ? 'chip-cyan' :
                'chip-neutral'
              }`}>
                {runResult.final_outcome.provenance.toUpperCase().replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="dossier-vertical-rail">
            {/* Box 1: Initial Payment Evidence */}
            <div className="dossier-card">
              <div className="dossier-card-top">
                <span className="card-stage-num mono">01</span>
                <span className="dossier-card-tag mono">PAYMENT RAIL RESPONSE</span>
              </div>
              
              <div className="dossier-evidence-list mono">
                <div className="evidence-line">
                  <span className="evidence-key">Payment ID:</span>
                  <span className="evidence-val font-bold">{runResult.initial_payment.payment_id || '—'}</span>
                </div>
                <div className="evidence-line">
                  <span className="evidence-key">Rail Status:</span>
                  <span className="evidence-val font-bold">
                    {runResult.initial_payment.status}
                  </span>
                </div>
                <div className="evidence-line">
                  <span className="evidence-key">Error Code:</span>
                  <span className="evidence-val">
                    {runResult.initial_payment.error_code ? (
                      <span className="chip chip-red text-xs">{runResult.initial_payment.error_code}</span>
                    ) : 'None (Success)'}
                  </span>
                </div>
                {runResult.initial_payment.error_message && (
                  <div className="evidence-line">
                    <span className="evidence-key">Message:</span>
                    <span className="evidence-val text-muted">{runResult.initial_payment.error_message}</span>
                  </div>
                )}
                <div className="evidence-line mt-2">
                  <span className="evidence-key">Label:</span>
                  <span className={`chip mono text-xs ${
                    runResult.initial_payment.payment_id && runResult.initial_payment.status ? 'chip-green' : 'chip-neutral'
                  }`}>
                    {runResult.initial_payment.payment_id && runResult.initial_payment.status ? 'SANDBOX VERIFIED' : 'PARTIAL PAYMENT EVIDENCE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Box 2: Agent Proposal */}
            <div className="dossier-card">
              <div className="dossier-card-top">
                <span className="card-stage-num mono">02</span>
                <span className="dossier-card-tag mono">AGENT ADVISORY</span>
              </div>

              <div className="dossier-evidence-list mono">
                <div className="evidence-line">
                  <span className="evidence-key">Availability:</span>
                  <span className="evidence-val">
                    {runResult.agent.available ? (
                      <span className="chip chip-green text-xs">AVAILABLE</span>
                    ) : (
                      <span className="chip chip-neutral text-xs">UNAVAILABLE</span>
                    )}
                  </span>
                </div>
                <div className="evidence-line">
                  <span className="evidence-key">Recommendation:</span>
                  <span className="evidence-val font-bold text-gold">
                    {runResult.agent.proposal ? runResult.agent.proposal.toUpperCase() : 'NONE'}
                  </span>
                </div>
                <div className="evidence-line">
                  <span className="evidence-key">Confidence:</span>
                  <span className="evidence-val">
                    {runResult.agent.confidence != null ? `${(runResult.agent.confidence * 100).toFixed(0)}%` : '—'}
                  </span>
                </div>
                <div className="evidence-rationale">
                  <span className="evidence-key block mb-1">Rationale:</span>
                  <p className="rationale-p text-muted">{runResult.agent.reasoning || 'No proposal generated.'}</p>
                </div>
                <div className="evidence-line mt-2 text-gold">
                  <span className="evidence-val text-xs text-left w-full block">Advisory only. This did not execute a payment action.</span>
                </div>
              </div>
            </div>

            {/* Box 3: Deterministic Policy */}
            <div className="dossier-card">
              <div className="dossier-card-top">
                <span className="card-stage-num mono">03</span>
                <span className="dossier-card-tag mono">CODE-ENFORCED POLICY</span>
              </div>

              <div className="dossier-evidence-list mono">
                <div className="evidence-line">
                  <span className="evidence-key">Result:</span>
                  <span className="evidence-val font-bold">
                    {runResult.guardrail.result.toUpperCase()}
                  </span>
                </div>
                <div className="evidence-rationale">
                  <span className="evidence-key block mb-1">Reason:</span>
                  <p className="rationale-p">{runResult.guardrail.reason}</p>
                </div>
                <div className="evidence-rationale">
                  <span className="evidence-key block mb-1">Constraints:</span>
                  <p className="rationale-p text-muted">Allowlist · confidence floor · freshness rule · one-action limit · original amount</p>
                </div>
                <div className="evidence-line mt-2">
                  <span className="evidence-key">Label:</span>
                  <span className="chip chip-neutral text-xs">POLICY v1 · CODE ENFORCED</span>
                </div>
              </div>
            </div>

            {/* Box 4: Bounded Action */}
            <div className="dossier-card">
              <div className="dossier-card-top">
                <span className="card-stage-num mono">04</span>
                <span className="dossier-card-tag mono">BOUNDED ACTION</span>
              </div>

              <div className="dossier-evidence-list mono">
                <div className="evidence-line">
                  <span className="evidence-key">Action Type:</span>
                  <span className="evidence-val font-bold">{runResult.bounded_action.type.toUpperCase()}</span>
                </div>
                <div className="evidence-line">
                  <span className="evidence-key">Executed:</span>
                  <span className="evidence-val">{runResult.bounded_action.executed ? 'YES' : 'NO'}</span>
                </div>
                <div className="evidence-line text-gold mt-1">
                  <span className="evidence-val text-xs text-left w-full block">Maximum actions for this session: 1</span>
                </div>
                <div className="evidence-line mt-1">
                  <span className="evidence-val text-xs text-left w-full block text-muted">
                    {runResult.bounded_action.executed && runResult.bounded_action.type === 'retry'
                      ? 'Retry amount equals original amount'
                      : 'Amount invariant retained by backend policy.'
                    }
                  </span>
                </div>
              </div>
            </div>
            
            {/* Box 5: Final Outcome & Evidence */}
            <div className="dossier-card">
              <div className="dossier-card-top">
                <span className="card-stage-num mono">05</span>
                <span className="dossier-card-tag mono">FINAL OUTCOME & EVIDENCE</span>
              </div>

              <div className="dossier-evidence-list mono">
                <div className="evidence-line">
                  <span className="evidence-key">Final Status:</span>
                  <span className={`evidence-val font-bold ${
                    runResult.final_outcome.status === 'succeeded' ? 'text-green' : 'text-red'
                  }`}>
                    {runResult.final_outcome.status.toUpperCase()}
                  </span>
                </div>
                <div className="evidence-line">
                  <span className="evidence-key">Provenance:</span>
                  <span className={`chip mono text-xs ${
                    runResult.final_outcome.provenance === 'sandbox_verified' ? 'chip-green' :
                    runResult.final_outcome.provenance === 'simulated_outcome' ? 'chip-cyan' :
                    'chip-neutral'
                  }`}>
                    {runResult.final_outcome.provenance.toUpperCase().replace('_', ' ')}
                  </span>
                </div>
                
                <div className="dossier-links-cluster mt-4 pt-4 border-t border-dashed" style={{ borderColor: 'var(--border-subtle)' }}>
                  <Link to={runResult.links.replay} className="doc-pill-btn doc-btn-primary">
                    <FileSearch size={14} />
                    <span>Open Recovery Replay</span>
                    <ExternalLink size={12} />
                  </Link>
                  <Link to={runResult.links.audit} className="doc-pill-btn doc-btn-outline">
                    <ReceiptText size={14} />
                    <span>View Audit Log</span>
                  </Link>
                </div>
                <div className="evidence-line mt-2">
                  <span className="evidence-val text-xs text-left w-full block text-muted">Open the Replay to inspect the same decision as a chronological evidence flow.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {recentLabRuns.length > 0 && (
        <div className="lab-recent-runs slide-up" style={{ marginTop: '3rem' }}>
          <h3 className="mono" style={{ fontSize: '0.85rem', color: 'var(--fg-muted)', marginBottom: '1rem', letterSpacing: '0.04em', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
            RECENT CONTROLLED RUNS
          </h3>
          <div className="recent-runs-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {recentLabRuns.map(run => (
              <div key={run.id} className="recent-run-card" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                backgroundColor: 'var(--bg-panel)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span className="mono text-xs font-bold">{run.id}</span>
                  <span className="mono text-xs text-muted">{new Date(run.created_at).toLocaleString()}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className={`chip mono text-xs ${
                    run.final_status === 'succeeded' ? 'chip-green' : 'chip-red'
                  }`}>
                    {run.final_status.toUpperCase()}
                  </span>
                  
                  <Link to={`/story/replay/${run.id}`} className="doc-pill-btn doc-btn-outline" style={{ padding: '0.25rem 0.5rem' }}>
                    <FileSearch size={12} />
                    <span style={{ fontSize: '0.7rem' }}>Replay</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
