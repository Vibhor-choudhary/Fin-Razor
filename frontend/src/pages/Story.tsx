import { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api, type Metrics, type Session } from '../lib/api';
import {
  Play,
  LayoutDashboard,
  ShieldCheck,
  Workflow,
  ArrowRight,
  Menu,
  X,
  Database,
  Cpu,
  Activity,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import './Story.css';

interface NavSection {
  id: string;
  num: string;
  label: string;
}

const SECTIONS: NavSection[] = [
  { id: 'overview', num: '01', label: 'Overview' },
  { id: 'journey', num: '02', label: 'Loss Journey' },
  { id: 'decision', num: '03', label: 'Decision Engine' },
  { id: 'proof', num: '04', label: 'Recovery Proof' },
  { id: 'policy', num: '05', label: 'Policy Matrix' },
  { id: 'architecture', num: '06', label: 'Architecture' }
];

export function Story() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  
  // Interactive Component States
  const [selectedHeroNode, setSelectedHeroNode] = useState<number>(2); // Default to DC_08
  const [selectedDecisionStep, setSelectedDecisionStep] = useState<number>(2); // Default to ENFORCE
  const [selectedOrbitToken, setSelectedOrbitToken] = useState<number>(2); // Default to Sandbox Verified
  const [expandedMetricCol, setExpandedMetricCol] = useState<number | null>(null); // Inline expand
  const [selectedAbstainStep, setSelectedAbstainStep] = useState<number>(1); // Default to Policy Check
  const [selectedPolicyRule, setSelectedPolicyRule] = useState<number | null>(null);
  const [selectedJourneyStage, setSelectedJourneyStage] = useState<number>(2); // Default to DC_08
  const [footerInView, setFooterInView] = useState<boolean>(false);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const footerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    api.getMetrics().then(setMetrics).catch(console.error);
    api.getAllSessions().then(setSessions).catch(console.error);
  }, []);

  // Discover an authentic decision-bearing session for the primary replay CTA
  const primaryReplayUrl = useMemo(() => {
    if (!sessions || sessions.length === 0) return '/recovery-queue';
    const successfulRetry = sessions.find(
      s => s.intervention_type === 'retry' && s.intervention_status === 'succeeded'
    );
    if (successfulRetry) return `/replay/${successfulRetry.id}`;

    const anyIntervention = sessions.find(s => Boolean(s.intervention_type));
    if (anyIntervention) return `/replay/${anyIntervention.id}`;

    return '/recovery-queue';
  }, [sessions]);

  // Section tracking via IntersectionObserver
  useEffect(() => {
    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '-20% 0px -55% 0px',
      threshold: 0
    };

    const handleIntersect: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, observerOptions);

    SECTIONS.forEach((sec) => {
      const el = document.getElementById(sec.id);
      if (el) {
        sectionRefs.current[sec.id] = el;
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, []);

  // Footer intersection for floating capsule visibility
  useEffect(() => {
    if (!footerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setFooterInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fmtCurrency = (n?: number) => {
    if (n == null) return '₹—';
    return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const fmtLift = (n?: number) => {
    if (n == null) return '—';
    const pp = (n * 100).toFixed(1);
    return `+${pp} pp`;
  };

  const fmtPct = (n?: number) => {
    if (n == null) return '—';
    return `${(n * 100).toFixed(1)}%`;
  };

  // 1. Clickable Hero Recovery Vector Flow Nodes
  const heroVectorNodes = [
    {
      id: 0,
      title: 'CHECKOUT EVENT',
      short: '01 EVENT',
      observed: 'Active customer session initiated',
      next: 'Payment gateway submission',
      stored: 'Session ID & cart value recorded',
      evidence: 'A checkout session entered the evaluation set.',
      provenance: 'SANDBOX SIMULATION',
      badgeClass: 'chip-neutral',
      cx: 45,
      cy: 85
    },
    {
      id: 1,
      title: 'PAYMENT ATTEMPT',
      short: '02 ATTEMPT',
      observed: 'Credentials submitted to gateway',
      next: 'Process via Hyperswitch rail',
      stored: 'Attempt timestamp & routing info',
      evidence: 'Hyperswitch payment attempt created in the sandbox.',
      provenance: 'REAL RAILS',
      badgeClass: 'chip-neutral',
      cx: 135,
      cy: 85
    },
    {
      id: 2,
      title: 'DC_08 · CARD DECLINED',
      short: '03 DECLINE',
      observed: 'Error code DC_08 returned by bank',
      next: 'Evaluate recovery eligibility',
      stored: 'Decline code & error payload',
      evidence: 'Payment status failed. Error code DC_08: Payment declined: Card declined.',
      provenance: 'RISK SIGNAL',
      badgeClass: 'chip-red',
      cx: 230,
      cy: 85,
      isRisk: true
    },
    {
      id: 3,
      title: 'POLICY GATE',
      short: '04 POLICY',
      observed: 'LLM proposal checked against 8 rules',
      next: 'Allow single retry or abstain',
      stored: 'Guardrail evaluation decision log',
      evidence: 'The stored proposal is checked against deterministic rules.',
      provenance: 'CODE ENFORCED',
      badgeClass: 'chip-gold',
      cx: 325,
      cy: 85,
      isPolicy: true
    },
    {
      id: 4,
      title: 'AUDIT RECORD',
      short: '05 AUDIT',
      observed: 'Terminal state reached (₹11,571 verified)',
      next: 'None · Session locked',
      stored: 'Final outcome & audit hash',
      evidence: 'Decision and payment response retained for review.',
      provenance: 'SANDBOX VERIFIED',
      badgeClass: 'chip-green',
      cx: 415,
      cy: 85,
      isSuccess: true
    }
  ];

  // 2. 5-Stage Decision Engine Specs
  const decisionSteps = [
    {
      stage: '01',
      title: 'OBSERVE',
      subtitle: 'Event evidence received',
      badge: 'SANDBOX SIMULATION',
      badgeClass: 'chip-neutral',
      height: '40%',
      marker: '○',
      summary: 'Payment and checkout evidence enters the system.',
      detail: 'Captures terminal checkout event telemetry without blocking the payment stream. Freezes environmental context: cart amount, error code (DC_08), and state snapshot.',
      invariant: 'Event store captures immutable snapshot before reasoning commences.'
    },
    {
      stage: '02',
      title: 'PROPOSE',
      subtitle: 'LLM recommendation',
      badge: 'SIMULATED OUTCOME',
      badgeClass: 'chip-cyan',
      height: '60%',
      marker: '◇',
      summary: 'The LLM recommends an action; it does not execute one.',
      detail: 'Outputs structured proposal: action (retry, nudge, none), target channel, and confidence score. The proposal is strictly advisory and cannot execute directly.',
      invariant: 'LLM output is quarantined as an unprivileged recommendation.'
    },
    {
      stage: '03',
      title: 'ENFORCE',
      subtitle: 'Deterministic policy',
      badge: 'POLICY v1 · CODE ENFORCED',
      badgeClass: 'chip-gold',
      height: '96%',
      marker: '⬡',
      isDominant: true,
      summary: 'Deterministic code checks allowlists, confidence, freshness, amount, completed-session exclusion, and action count.',
      detail: '8 deterministic code guardrails evaluate proposal against hard allowlists. Evaluates retry allowlist (DC_08 only), confidence threshold (≥ 0.60), freshness window (60s), amount immutability, and one-action ceiling. Blocks invalid actions immediately.',
      invariant: 'Policy engine is pure deterministic Python code with zero runtime mutation.'
    },
    {
      stage: '04',
      title: 'ACT ONCE',
      subtitle: 'One bounded action',
      badge: 'SANDBOX VERIFIED',
      badgeClass: 'chip-green',
      height: '75%',
      marker: '◇',
      summary: 'At most one permitted retry or one modeled nudge is recorded.',
      detail: 'Dispatches retry request to Hyperswitch sandbox API or modeled customer nudge. Captures real terminal payment state (succeeded or failed). Never modifies cart amount.',
      invariant: 'Single-action bound guaranteed: session transitions to terminal evaluated state.'
    },
    {
      stage: '05',
      title: 'AUDIT',
      subtitle: 'Outcome retained',
      badge: 'HISTORICAL REPLAY · READ ONLY',
      badgeClass: 'chip-neutral',
      height: '50%',
      marker: '○',
      summary: 'The outcome and available raw response evidence are retained for review.',
      detail: 'Stores payload hashes, guardrail decision log, model confidence, and final outcome. Powers Recovery Replay, Guardrail Tracer, and Recovery Ledger.',
      invariant: 'Audit records retained for review: every recovery decision can be replayed step-by-step.'
    }
  ];

  // 3. Orbit Interactive Tokens
  const orbitTokens = [
    {
      id: 0,
      code: 'DC_08',
      label: 'Risk Signal',
      tag: 'ERROR TRIGGER',
      provenance: 'RISK SIGNAL',
      chipClass: 'chip-red',
      amount: null,
      explanation: 'DC_08 (Card declined) is the only error code permitted for automated sandbox payment retries.'
    },
    {
      id: 1,
      code: 'ONE ACTION',
      label: 'Ceiling Bound',
      tag: 'POLICY INVARIANT',
      provenance: 'CODE ENFORCED',
      chipClass: 'chip-gold',
      amount: null,
      explanation: 'Exactly one bounded recovery action permitted per session, preventing cascading dispatches.'
    },
    {
      id: 2,
      code: 'SANDBOX VERIFIED',
      label: 'Verified Recovery',
      tag: 'REAL RAILS',
      provenance: 'SANDBOX VERIFIED',
      chipClass: 'chip-green',
      amount: metrics?.verified_sandbox_recovered_amount,
      explanation: 'Successful retry attempts executed directly against authenticated Hyperswitch sandbox payment rails.'
    },
    {
      id: 3,
      code: 'AUDIT LOG',
      label: 'Retained Evidence',
      tag: 'AUDIT TRAIL',
      provenance: 'HISTORICAL REPLAY',
      chipClass: 'chip-neutral',
      amount: metrics?.total_modeled_recovered_amount,
      explanation: 'Every recovery decision, model confidence score, and raw gateway response is persisted for review.'
    }
  ];

  // 4. Click-to-Expand Metric Columns
  const metricEvidenceColumns = [
    {
      id: 0,
      tag: 'RECOVERY LIFT',
      value: fmtLift(metrics?.recovery_lift),
      valClass: 'text-gold',
      shortDesc: 'Difference between recorded treatment and control conversion rates.',
      expandedTitle: 'Conversion Lift Methodology',
      expandedDetail: 'Calculated as (Agent Conversion 60.8% - Baseline Conversion 55.8%) across the 103 evaluation sessions. Represents net conversion delta in percentage points.',
      provenance: 'EVALUATION METRIC'
    },
    {
      id: 1,
      tag: 'AGENT CONVERSION',
      value: fmtPct(metrics?.agent_conversion),
      valClass: '',
      shortDesc: `Recorded treatment cohort conversion. Baseline: ${fmtPct(metrics?.baseline_conversion)}.`,
      expandedTitle: 'Cohort Conversion Breakdown',
      expandedDetail: '60.8% of checkout sessions in the treatment group converted (either through self-recovery, sandbox retry, or simulated nudge), compared to 55.8% in the baseline cohort.',
      provenance: 'EVALUATION METRIC'
    },
    {
      id: 2,
      tag: 'SANDBOX VERIFIED',
      chipTag: 'REAL RAILS',
      chipClass: 'chip-green',
      value: fmtCurrency(metrics?.verified_sandbox_recovered_amount),
      valClass: 'text-green',
      shortDesc: 'Successful sandbox retry evidence only. Real terminal status succeeded.',
      expandedTitle: 'Verified Sandbox Payment Rails',
      expandedDetail: 'Represents ₹11,571.49 recovered across verified Hyperswitch payment intents. Every single retry was dispatched to the real sandbox gateway API and confirmed via webhook.',
      provenance: 'SANDBOX VERIFIED'
    },
    {
      id: 3,
      tag: 'POLICY EVIDENCE',
      chipTag: 'PARTIAL',
      chipClass: 'chip-gold',
      value: metrics?.abstentions != null ? `${metrics.abstentions} abstained` : '—',
      valClass: '',
      shortDesc: 'Policy checks are partial where stored evidence cannot conclusively verify an invariant.',
      expandedTitle: 'Safety Abstention Breakdown',
      expandedDetail: '42 sessions triggered safe abstention (40.8% abstain rate) due to non-retryable errors, low model confidence (< 0.60), or expired freshness (> 60s). Zero unsafe secondary retries were permitted.',
      provenance: 'CODE ENFORCED'
    }
  ];

  // 5. Interactive Abstention Gate
  const abstentionSteps = [
    {
      id: 0,
      title: '1. LLM PROPOSAL',
      subtitle: 'Advisory recommendation',
      tag: 'UNPRIVILEGED INPUT',
      chipClass: 'chip-cyan',
      badge: 'SIMULATED OUTCOME',
      detail: 'Agent evaluates DC_08_EXPIRED session and suggests a payment retry based on cart value (₹2,499.00) and card decline history. The proposal carries confidence 0.82.',
      storedEvidence: 'Proposal payload: { action: "retry", confidence: 0.82, reason: "card_declined_retryable" }'
    },
    {
      id: 1,
      title: '2. POLICY EVALUATION',
      subtitle: 'Rule #5 Freshness check',
      tag: 'BLOCKED BY RULE 05',
      chipClass: 'chip-gold',
      badge: 'POLICY v1 · CODE ENFORCED',
      detail: 'Deterministic guardrail inspects session timestamp: Abandonment elapsed time is 84 seconds (> 60s window). Policy Rule #5 triggers immediate hard block.',
      storedEvidence: 'Guardrail check: FRESHNESS_WINDOW (84s > 60s) -> VIOLATION_PREVENTED -> Status: ABSTAINED'
    },
    {
      id: 2,
      title: '3. FINAL OUTCOME',
      subtitle: 'Safe default-deny state',
      tag: 'NO ACTION DISPATCHED',
      chipClass: 'chip-neutral',
      badge: 'GUARDRAIL ABSTAINED',
      detail: 'Zero network calls dispatched to payment rails. Session marked as terminal abstained in the event store. Double-billing and customer spam structurally prevented.',
      storedEvidence: 'Audit log entry: { session_id: "DC_08_EXPIRED", outcome: "none", guardrail_result: "blocked_freshness" }'
    }
  ];

  // Guardrail Policy Matrix
  const guardrailRules = [
    {
      id: 1,
      rule: 'One-Action Limit',
      value: 'Maximum 1 per session',
      tag: 'STRICT CEILING',
      explanation: 'A checkout session can only ever trigger a single recovery intervention. Repeated retry loops and cascading dispatches are physically blocked in code.'
    },
    {
      id: 2,
      rule: 'Retry Allowlist',
      value: 'DC_08 only',
      tag: 'ERROR FILTER',
      explanation: 'Retries are exclusively permitted for code DC_08 (Card declined). Fraud flags, expired instruments, or unknown errors trigger immediate safe abstention.'
    },
    {
      id: 3,
      rule: 'Confidence Floor',
      value: 'Score ≥ 0.60',
      tag: 'MODEL THRESHOLD',
      explanation: 'The LLM agent proposal must meet or exceed a 0.60 calibrated confidence score. Low-confidence proposals are rejected into the audit log.'
    },
    {
      id: 4,
      rule: 'Amount Invariant',
      value: 'Strict equality (₹ = ₹)',
      tag: 'FINANCIAL BOUND',
      explanation: 'The intervention retry amount must exactly equal the original cart amount. The system is structurally prohibited from altering prices, discounts, or fees.'
    },
    {
      id: 5,
      rule: 'Freshness Cooldown',
      value: '60-second window',
      tag: 'TIMING GUARD',
      explanation: 'Actions are constrained to a 60-second freshness window from checkout abandonment. Stale sessions (>60s) or active checkouts are abstained.'
    },
    {
      id: 6,
      rule: 'Completed Exclusion',
      value: 'Terminal state locked',
      tag: 'SAFETY CHECK',
      explanation: 'Sessions that have already succeeded or self-converted are strictly excluded from intervention evaluation, eliminating double-billing risk.'
    }
  ];

  // Loss journey stages
  const journeyStages = [
    {
      stage: '01',
      title: 'Checkout opened',
      desc: 'Customer begins checkout with active cart intent.',
      chip: 'INITIATED'
    },
    {
      stage: '02',
      title: 'Payment attempted',
      desc: 'Credentials submitted to Hyperswitch payment gateway orchestration.',
      chip: 'PROCESSING'
    },
    {
      stage: '03',
      title: 'DC_08 · Card declined',
      desc: 'DC_08 · Payment declined: Card declined.',
      chip: 'DECLINED',
      error: true
    },
    {
      stage: '04',
      title: 'Revenue at risk',
      desc: 'Session reaches abandonment threshold without customer retry.',
      chip: 'AT RISK',
      warning: true
    },
    {
      stage: '05',
      title: 'Recovery decision',
      desc: 'Recovery begins at the policy boundary. The model proposes, code decides.',
      chip: 'BOUNDED ACTION',
      success: true
    }
  ];

  return (
    <div className="stitch-wireframe-story">
      {/* =========================================================================
          1. REFINED DOCUMENTATION STORY SIDEBAR (Desktop)
          ========================================================================= */}
      <aside className="story-doc-sidebar" aria-label="Recovery Story Navigation">
        <div className="doc-sidebar-header">
          <span className="doc-tree-eyebrow mono">RECOVERY STORY</span>
          <h1 className="doc-tree-title">
            Checkout
            <br />
            Recovery
            <br />
            Agent
          </h1>
          <div className="doc-chip-sandbox">
            <span className="doc-dot-pulse" aria-hidden="true"></span>
            <span>SANDBOX SIMULATION</span>
          </div>
        </div>

        <nav className="doc-tree-nav">
          <span className="doc-tree-category mono">DOCUMENTATION TREE</span>
          {SECTIONS.map((sec) => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                className={`doc-nav-node ${isActive ? 'active' : ''}`}
                onClick={() => scrollToSection(sec.id)}
                aria-current={isActive ? 'true' : undefined}
              >
                <div className="doc-node-progress-mark" aria-hidden="true" />
                <span className="doc-node-num mono">{sec.num}</span>
                <span className="doc-node-label">{sec.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="doc-sidebar-footer">
          <Link to="/" className="doc-pill-btn doc-btn-primary">
            <LayoutDashboard size={14} />
            <span>Explore console</span>
          </Link>
          <Link to={primaryReplayUrl} className="doc-pill-btn doc-btn-outline">
            <Play size={14} />
            <span>Watch recovery replay</span>
          </Link>
        </div>
      </aside>

      {/* =========================================================================
          MOBILE TOP NAVBAR & OVERLAY
          ========================================================================= */}
      <header className="story-mobile-header">
        <div className="story-mobile-brand">
          <span className="doc-tree-eyebrow mono">CHECKOUT RECOVERY AGENT</span>
        </div>
        <button
          type="button"
          className="story-menu-toggle"
          aria-label="Menu"
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {mobileMenuOpen && (
        <div className="story-mobile-menu-overlay" role="dialog" aria-modal="true">
          <div className="story-mobile-menu-inner">
            <div className="story-mobile-menu-links">
              {SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  className="story-mobile-link"
                  onClick={() => scrollToSection(sec.id)}
                >
                  <span className="doc-node-num mono">{sec.num}</span>
                  <span>{sec.label}</span>
                </button>
              ))}
            </div>

            <div className="story-mobile-menu-actions">
              <Link
                to="/"
                className="doc-pill-btn doc-btn-primary w-full"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutDashboard size={14} />
                <span>Explore console</span>
              </Link>
              <Link
                to={primaryReplayUrl}
                className="doc-pill-btn doc-btn-outline w-full"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Play size={14} />
                <span>Watch recovery replay</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MAIN STORY CANVAS (Editorial White Canvas)
          ========================================================================= */}
      <main className="story-wireframe-canvas">
        {/* -----------------------------------------------------------------------
            SECTION 1: HERO / INTERACTIVE RECOVERY VECTOR FLOW
            ----------------------------------------------------------------------- */}
        <section id="overview" className="wireframe-section hero-wireframe-section">
          <div className="hero-content-grid">
            <div className="hero-text-block">
              <div className="hero-badge-row">
                <span className="wireframe-chip mono">TRACK 03</span>
                <span className="wireframe-chip mono highlight">
                  <span className="doc-dot-pulse" aria-hidden="true"></span>
                  SANDBOX SIMULATION
                </span>
              </div>

              <h2 className="wireframe-hero-title">
                A failed checkout is not always a lost customer.
              </h2>

              <p className="wireframe-hero-lead">
                The model proposes one recovery action. Deterministic code decides whether it is allowed.
              </p>

              <p className="wireframe-hero-sub mono">
                Real sandbox payment rails. Simulated customer outcomes.
              </p>

              <div className="wireframe-hero-actions">
                <Link to={primaryReplayUrl} className="doc-pill-btn doc-btn-primary">
                  <Play size={14} />
                  <span>Watch replay</span>
                  <ArrowRight size={13} className="btn-arrow-slide" />
                </Link>
                <Link to="/" className="doc-pill-btn doc-btn-outline">
                  <span>Explore console</span>
                </Link>
              </div>
            </div>

            {/* Clickable 5-Node Hero Recovery Vector Flow */}
            <div className="hero-visual-wrapper">
              <div className="wireframe-panel decision-gateway-panel">
                <div className="wireframe-panel-header">
                  <span className="mono text-xs text-muted">INTERACTIVE EVIDENCE FLOW</span>
                  <span className={`chip ${heroVectorNodes[selectedHeroNode].badgeClass}`}>
                    {heroVectorNodes[selectedHeroNode].provenance}
                  </span>
                </div>

                <div className="gateway-vector-stage">
                  <svg
                    className="gateway-svg"
                    viewBox="0 0 460 170"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-label="Interactive recovery vector flowchart"
                  >
                    {/* Background Connection Track */}
                    <line x1="45" y1="85" x2="415" y2="85" stroke="#eaedf1" strokeWidth="2" />

                    {/* Active Animated Connector Path */}
                    <line
                      x1="45"
                      y1="85"
                      x2={heroVectorNodes[selectedHeroNode].cx}
                      y2="85"
                      stroke="#0f1419"
                      strokeWidth="2"
                      className="hero-active-connector"
                    />

                    {/* 5 Clickable Vector Flow Nodes */}
                    {heroVectorNodes.map((node) => {
                      const isSelected = selectedHeroNode === node.id;
                      return (
                        <g
                          key={node.id}
                          className={`hero-flow-node-group ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedHeroNode(node.id)}
                          role="button"
                          tabIndex={0}
                          aria-pressed={isSelected}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') setSelectedHeroNode(node.id);
                          }}
                        >
                          <circle
                            cx={node.cx}
                            cy={node.cy}
                            r={isSelected ? 16 : 13}
                            fill={isSelected ? '#0f1419' : '#ffffff'}
                            stroke={isSelected ? '#0f1419' : '#dcdfe4'}
                            strokeWidth={isSelected ? 2.5 : 1.5}
                            className="hero-node-circle"
                          />
                          <text
                            x={node.cx}
                            y={node.cy + 4}
                            textAnchor="middle"
                            fill={isSelected ? '#ffffff' : '#536471'}
                            fontSize="9"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {node.id + 1}
                          </text>
                          <text
                            x={node.cx}
                            y={node.cy + (isSelected ? 30 : 28)}
                            textAnchor="middle"
                            fill={isSelected ? '#0f1419' : '#8899a6'}
                            fontSize="8"
                            fontFamily="monospace"
                            fontWeight={isSelected ? 'bold' : 'normal'}
                            letterSpacing="0.04em"
                          >
                            {node.short}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Grounded Node Evidence Inspection Panel */}
                <div className="hero-node-evidence-box">
                  <div className="hero-evidence-top">
                    <span className="mono font-bold text-sm">
                      {heroVectorNodes[selectedHeroNode].title}
                    </span>
                    <span className="mono text-xs text-muted">
                      STAGE 0{selectedHeroNode + 1} OF 05
                    </span>
                  </div>

                  <p className="hero-evidence-desc">
                    {heroVectorNodes[selectedHeroNode].evidence}
                  </p>

                  <div className="hero-evidence-triad mono">
                    <div className="triad-item">
                      <span className="triad-label">OBSERVED</span>
                      <span className="triad-val">{heroVectorNodes[selectedHeroNode].observed}</span>
                    </div>
                    <div className="triad-item">
                      <span className="triad-label">NEXT</span>
                      <span className="triad-val">{heroVectorNodes[selectedHeroNode].next}</span>
                    </div>
                    <div className="triad-item">
                      <span className="triad-label">STORED</span>
                      <span className="triad-val">{heroVectorNodes[selectedHeroNode].stored}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -----------------------------------------------------------------------
            SECTION 2: LOSS JOURNEY — TECHNICAL PATH
            ----------------------------------------------------------------------- */}
        <section id="journey" className="wireframe-section bordered-section">
          <div className="section-title-bar">
            <div>
              <span className="doc-section-tag mono">02 THE PROBLEM SPACE</span>
              <h3 className="doc-section-heading">Checkout Loss Journey</h3>
              <p className="doc-section-sub">
                Illustrative evidence flow · Mapping the critical path from decline to bounded recovery.
              </p>
            </div>
            <div className="chip sandbox">HISTORICAL REPLAY · READ ONLY</div>
          </div>

          <div className="wireframe-panel journey-panel">
            {/* Horizontal Dashed Guide Track (Desktop) */}
            <div className="journey-guide-track" aria-hidden="true">
              <div className="journey-dashed-line"></div>
            </div>

            {/* Stages Grid */}
            <div className="journey-nodes-row" role="tablist" aria-label="Checkout journey stages">
              {journeyStages.map((stage, idx) => {
                const isSelected = selectedJourneyStage === idx;
                return (
                  <button
                    key={stage.stage}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    className={`journey-node-box ${isSelected ? 'active' : ''} ${
                      stage.error ? 'node-error' : stage.warning ? 'node-warning' : stage.success ? 'node-success' : ''
                    }`}
                    onClick={() => setSelectedJourneyStage(idx)}
                  >
                    <div className="node-marker-circle">
                      <span className="mono node-num-text">{stage.stage}</span>
                    </div>
                    <h4 className="node-stage-heading">{stage.title}</h4>
                    <span
                      className={`chip node-chip ${
                        stage.error ? 'chip-red' : stage.warning ? 'chip-gold' : stage.success ? 'chip-green' : 'chip-neutral'
                      }`}
                    >
                      {stage.chip}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Detail Drawer */}
            <div className="journey-drawer-box" role="tabpanel">
              <div className="drawer-top-line">
                <span className="mono font-bold">{journeyStages[selectedJourneyStage].title}</span>
                <span className="mono text-muted text-xs">STAGE {journeyStages[selectedJourneyStage].stage}</span>
              </div>
              <p className="drawer-detail-p">{journeyStages[selectedJourneyStage].desc}</p>
              {journeyStages[selectedJourneyStage].error && (
                <div className="drawer-truth-banner">
                  <AlertTriangle size={14} className="text-red flex-shrink-0" />
                  <span className="mono text-xs">DC_08 · Payment declined: Card declined</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* -----------------------------------------------------------------------
            SECTION 3: DECISION ENGINE — 5-STAGE ANALYSIS PANEL
            ----------------------------------------------------------------------- */}
        <section id="decision" className="wireframe-section bordered-section">
          <div className="section-title-bar">
            <div>
              <span className="doc-section-tag mono">03 DECISION ENGINE</span>
              <h3 className="doc-section-heading">The Decision Boundary</h3>
              <p className="doc-section-sub">
                “The model proposes. Deterministic code permits or denies.”
              </p>
            </div>
            <div className="chip provenance-enforced">POLICY v1 · CODE ENFORCED</div>
          </div>

          {/* 5-Stage Interactive Decision Analysis Chart */}
          <div className="wireframe-panel decision-chart-panel">
            <div className="decision-chart-header-bar">
              <span className="mono text-xs text-muted">
                Illustrative process stages · not measured latency
              </span>
              <span className="mono text-xs text-muted">CLICK TO INSPECT PHASE</span>
            </div>

            <div className="decision-chart-grid">
              {/* Horizontal Guide Lines */}
              <div className="chart-guides" aria-hidden="true">
                <div className="chart-guide-line"></div>
                <div className="chart-guide-line"></div>
                <div className="chart-guide-line"></div>
                <div className="chart-guide-line"></div>
              </div>

              {/* 5 Stage Pillars */}
              <div className="chart-pillars-row" role="tablist" aria-label="Decision engine phases">
                {decisionSteps.map((step, idx) => {
                  const isSelected = selectedDecisionStep === idx;
                  return (
                    <button
                      key={step.stage}
                      type="button"
                      role="tab"
                      aria-selected={isSelected}
                      className={`chart-pillar-col ${isSelected ? 'selected' : ''} ${step.isDominant ? 'dominant' : ''}`}
                      onClick={() => setSelectedDecisionStep(idx)}
                    >
                      <div className="pillar-marker-token mono">{step.marker}</div>
                      <div className="pillar-bar-track">
                        <div
                          className={`pillar-bar-fill ${step.isDominant ? 'fill-gold' : ''}`}
                          style={{ height: step.height }}
                        ></div>
                      </div>
                      <span className="pillar-title mono">{step.title}</span>
                      <span className="pillar-sub mono">{step.subtitle}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Phase Invariant Details */}
            <div className="decision-phase-card" role="tabpanel">
              <div className="phase-card-header">
                <div>
                  <span className="mono text-xs text-muted">
                    PHASE {decisionSteps[selectedDecisionStep].stage} EXECUTION SPECIFICATION
                  </span>
                  <h4 className="phase-card-title">{decisionSteps[selectedDecisionStep].title}</h4>
                </div>
                <span className={`chip ${decisionSteps[selectedDecisionStep].badgeClass}`}>
                  {decisionSteps[selectedDecisionStep].badge}
                </span>
              </div>

              <p className="phase-summary-text">{decisionSteps[selectedDecisionStep].summary}</p>

              <div className="phase-detail-box">
                <p className="text-sm m-0">{decisionSteps[selectedDecisionStep].detail}</p>
              </div>

              <div className="phase-invariant-row">
                <ShieldCheck size={16} className="text-gold flex-shrink-0" />
                <span className="mono text-xs">{decisionSteps[selectedDecisionStep].invariant}</span>
              </div>
            </div>

            <div className="panel-sub-cta-bar">
              <span className="text-sm">Ready to inspect the deterministic rule engine?</span>
              <Link to="/policy" className="doc-link-action mono">
                <span>Open Policy Studio</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

        {/* -----------------------------------------------------------------------
            SECTION 4: RECOVERY PROOF & INTERACTIVE ORBIT FOCAL PANEL
            ----------------------------------------------------------------------- */}
        <section id="proof" className="wireframe-section bordered-section">
          <div className="section-title-bar">
            <div>
              <span className="doc-section-tag mono">04 EMPIRICAL OUTCOMES</span>
              <h3 className="doc-section-heading">Recovery Proof & Calibration</h3>
              <p className="doc-section-sub">
                Measured conversion lift and proven revenue settlement across evaluation sessions. Click cards to expand evidence.
              </p>
            </div>
            <div className="chip sandbox">SANDBOX SIMULATION</div>
          </div>

          {/* Click-to-Expand Evidence Columns */}
          <div className="staggered-columns-grid">
            {metricEvidenceColumns.map((col) => {
              const isExpanded = expandedMetricCol === col.id;
              return (
                <div
                  key={col.id}
                  className={`stagger-col col-offset-${col.id + 1} ${isExpanded ? 'expanded' : ''}`}
                >
                  <button
                    type="button"
                    className="stagger-col-toggle-btn"
                    onClick={() => setExpandedMetricCol(isExpanded ? null : col.id)}
                    aria-expanded={isExpanded}
                  >
                    <div className="col-header-chip">
                      <span className="stagger-tag mono">{col.tag}</span>
                      {col.chipTag && <span className={`chip ${col.chipClass}`}>{col.chipTag}</span>}
                    </div>
                    <div className={`stagger-metric-val ${col.valClass}`}>{col.value}</div>
                    <p className="stagger-desc">{col.shortDesc}</p>
                    <div className="stagger-expand-affordance mono text-xs">
                      <span>{isExpanded ? 'Hide methodology' : 'Click to inspect'}</span>
                      <ChevronDown
                        size={12}
                        className={`expand-chevron ${isExpanded ? 'rotated' : ''}`}
                      />
                    </div>
                  </button>

                  {/* Inline Expandable Methodology Panel */}
                  {isExpanded && (
                    <div className="stagger-expanded-content">
                      <div className="expanded-title mono font-bold">{col.expandedTitle}</div>
                      <p className="expanded-text">{col.expandedDetail}</p>
                      <div className="chip chip-neutral mono text-xs mt-2">{col.provenance}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Interactive Orbit Focal Evidence Panel */}
          <div className="wireframe-panel orbit-focal-panel">
            <div className="orbit-interactive-header">
              <span className="mono text-xs text-muted">EVIDENCE ORBIT · CLICK NODE TO INSPECT</span>
              <span className="chip sandbox">SANDBOX PROVENANCE</span>
            </div>

            <div className="orbit-canvas-wrapper">
              <svg
                className="orbit-svg"
                viewBox="0 0 500 240"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Interactive recovery orbit evidence diagram"
              >
                {/* Outer Dashed Orbit Path */}
                <ellipse
                  cx="250"
                  cy="120"
                  rx="220"
                  ry="95"
                  stroke="#dcdfe4"
                  strokeWidth="1.5"
                  strokeDasharray="6 6"
                  className="orbit-ring-dashed"
                />

                {/* Inner Solid Organic Orbit Path */}
                <ellipse
                  cx="250"
                  cy="120"
                  rx="180"
                  ry="70"
                  stroke="#0f1419"
                  strokeWidth="1"
                  className="orbit-ring-solid"
                />

                {/* Interactive Geometric Orbit Tokens */}
                {/* Token 0: DC_08 (Left) */}
                <g
                  className={`orbit-token token-0 ${selectedOrbitToken === 0 ? 'selected' : ''}`}
                  onClick={() => setSelectedOrbitToken(0)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedOrbitToken === 0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedOrbitToken(0);
                  }}
                >
                  <circle cx="70" cy="120" r={selectedOrbitToken === 0 ? 12 : 8} fill="#ffffff" stroke="#ef4444" strokeWidth="2" />
                  <circle cx="70" cy="120" r="3" fill="#ef4444" />
                  <text x="70" y="145" textAnchor="middle" className="svg-sub mono text-red font-bold">DC_08</text>
                </g>

                {/* Token 1: ONE ACTION (Top) */}
                <g
                  className={`orbit-token token-1 ${selectedOrbitToken === 1 ? 'selected' : ''}`}
                  onClick={() => setSelectedOrbitToken(1)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedOrbitToken === 1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedOrbitToken(1);
                  }}
                >
                  <polygon points="250,18 258,28 250,38 242,28" fill={selectedOrbitToken === 1 ? '#f59e0b' : '#ffffff'} stroke="#f59e0b" strokeWidth="2" />
                  <text x="250" y="12" textAnchor="middle" className="svg-sub mono text-gold font-bold">ONE ACTION</text>
                </g>

                {/* Token 2: SANDBOX VERIFIED (Right) */}
                <g
                  className={`orbit-token token-2 ${selectedOrbitToken === 2 ? 'selected' : ''}`}
                  onClick={() => setSelectedOrbitToken(2)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedOrbitToken === 2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedOrbitToken(2);
                  }}
                >
                  <rect x="422" y="112" width={selectedOrbitToken === 2 ? 18 : 14} height={selectedOrbitToken === 2 ? 18 : 14} rx="3" fill="#ffffff" stroke="#10b981" strokeWidth="2" />
                  <circle cx="430" cy="120" r="3" fill="#10b981" />
                  <text x="430" y="145" textAnchor="middle" className="svg-sub mono text-green font-bold">VERIFIED</text>
                </g>

                {/* Token 3: AUDIT LOG (Bottom) */}
                <g
                  className={`orbit-token token-3 ${selectedOrbitToken === 3 ? 'selected' : ''}`}
                  onClick={() => setSelectedOrbitToken(3)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedOrbitToken === 3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedOrbitToken(3);
                  }}
                >
                  <circle cx="250" cy="215" r={selectedOrbitToken === 3 ? 12 : 8} fill="#ffffff" stroke="#0f1419" strokeWidth="2" />
                  <circle cx="250" cy="215" r="3" fill="#0f1419" />
                  <text x="250" y="235" textAnchor="middle" className="svg-sub mono font-bold">AUDIT</text>
                </g>
              </svg>

              {/* Dynamic Center Focal Evidence Box */}
              <div className="orbit-center-card">
                <span className={`chip ${orbitTokens[selectedOrbitToken].chipClass}`} style={{ marginBottom: '0.4rem' }}>
                  {orbitTokens[selectedOrbitToken].provenance}
                </span>
                <div className="orbit-focal-amount">
                  {orbitTokens[selectedOrbitToken].amount != null
                    ? fmtCurrency(orbitTokens[selectedOrbitToken].amount)
                    : orbitTokens[selectedOrbitToken].code}
                </div>
                <p className="orbit-method-line mono">
                  {orbitTokens[selectedOrbitToken].explanation}
                </p>
                <div className="orbit-disclaimer-tag mono">
                  Not settled/live money · Historical batch evaluation.
                </div>
                <Link to="/ledger" className="doc-link-action mono" style={{ marginTop: '0.85rem' }}>
                  <span>Inspect recovery ledger</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* -----------------------------------------------------------------------
            SECTION 5: QUOTE / EVIDENCE BANNER
            ----------------------------------------------------------------------- */}
        <section className="quote-evidence-banner">
          <div className="quote-container">
            <blockquote className="quote-text">
              “The model proposes. Deterministic code permits or denies.”
            </blockquote>
            <p className="quote-supporting">
              Every recorded action is constrained by an allowlist, a confidence floor, a one-action limit, and an audit record.
            </p>
            <div className="quote-attribution mono">
              Checkout Recovery Agent · Policy architecture
            </div>
          </div>
        </section>

        {/* -----------------------------------------------------------------------
            SECTION 6: POLICY MATRIX & INTERACTIVE ABSTENTION GATE
            ----------------------------------------------------------------------- */}
        <section id="policy" className="wireframe-section bordered-section">
          <div className="section-title-bar">
            <div>
              <span className="doc-section-tag mono">05 GOVERNANCE</span>
              <h3 className="doc-section-heading">Policy Matrix & Safety Gate</h3>
              <p className="doc-section-sub">
                Deterministic invariants enforced in code before any action dispatches.
              </p>
            </div>
            <div className="chip provenance-enforced">POLICY v1 · CODE ENFORCED</div>
          </div>

          <div className="policy-matrix-grid">
            {guardrailRules.map((rule, idx) => {
              const isExpanded = selectedPolicyRule === idx;
              return (
                <button
                  key={rule.id}
                  type="button"
                  className={`matrix-tile ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => setSelectedPolicyRule(isExpanded ? null : idx)}
                  aria-expanded={isExpanded}
                >
                  <div className="tile-top-bar">
                    <span className="chip provenance-enforced">{rule.tag}</span>
                    <span className="mono tile-rule-num">RULE #{rule.id}</span>
                  </div>
                  <h4 className="matrix-tile-title">{rule.rule}</h4>
                  <div className="matrix-tile-val mono">{rule.value}</div>
                  <p className="matrix-tile-desc">{rule.explanation}</p>
                </button>
              );
            })}
          </div>

          {/* Interactive Abstention Gate Trace */}
          <div className="wireframe-panel abstention-gate-panel" style={{ marginTop: '2rem' }}>
            <div className="abstention-gate-header">
              <div>
                <span className="doc-section-tag mono">SAFETY ENFORCEMENT TRACE</span>
                <h4 className="font-serif text-lg font-medium m-0">
                  Interactive Abstention Gate: Stale Session Evaluation
                </h4>
              </div>
              <span className="chip sandbox">GUARDRAIL ABSTAINED</span>
            </div>

            {/* 3-Step Selection Buttons */}
            <div className="abstention-steps-nav" role="tablist">
              {abstentionSteps.map((step) => {
                const isSelected = selectedAbstainStep === step.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    className={`abstain-step-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedAbstainStep(step.id)}
                  >
                    <span className="mono font-bold text-xs">{step.title}</span>
                    <span className="text-xs text-muted">{step.subtitle}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Abstention Trace Details */}
            <div className="abstention-trace-card" role="tabpanel">
              <div className="trace-header">
                <span className="mono font-bold text-sm">
                  {abstentionSteps[selectedAbstainStep].title}
                </span>
                <span className={`chip ${abstentionSteps[selectedAbstainStep].chipClass}`}>
                  {abstentionSteps[selectedAbstainStep].tag}
                </span>
              </div>
              <p className="trace-detail-text">
                {abstentionSteps[selectedAbstainStep].detail}
              </p>
              <div className="trace-evidence-code mono">
                {abstentionSteps[selectedAbstainStep].storedEvidence}
              </div>
            </div>
          </div>

          <div className="proof-action-row" style={{ marginTop: '2rem' }}>
            <Link to="/policy" className="doc-link-action mono">
              <span>Open Policy Studio</span>
              <ArrowRight size={14} />
            </Link>
            <Link to="/guardrail-tracer" className="doc-link-action mono">
              <span>Run Guardrail Stress Test Tracer</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* -----------------------------------------------------------------------
            SECTION 7: SYSTEM ARCHITECTURE
            ----------------------------------------------------------------------- */}
        <section id="architecture" className="wireframe-section bordered-section">
          <div className="section-title-bar">
            <div>
              <span className="doc-section-tag mono">06 ARCHITECTURE</span>
              <h3 className="doc-section-heading">Architecture & Safety Envelope</h3>
              <p className="doc-section-sub">
                Separation of external payment rails, state machine, and model reasoning.
              </p>
            </div>
            <div className="chip sandbox">EVENT DRIVEN</div>
          </div>

          <div className="arch-cards-grid">
            <div className="arch-node-card">
              <div className="arch-icon-box">
                <Workflow size={18} />
              </div>
              <span className="mono arch-tag">EXTERNAL RAILS</span>
              <h4 className="arch-heading">Hyperswitch Sandbox</h4>
              <p className="arch-p">
                Real test payment creation, confirmation, terminal status webhooks, and DC_08 decline telemetry.
              </p>
            </div>

            <div className="arch-node-card">
              <div className="arch-icon-box">
                <Database size={18} />
              </div>
              <span className="mono arch-tag">AUDIT LOG</span>
              <h4 className="arch-heading">SQLite Event Store</h4>
              <p className="arch-p">
                Retains session records, intervention decisions, and raw gateway response payloads for audit review.
              </p>
            </div>

            <div className="arch-node-card">
              <div className="arch-icon-box">
                <Cpu size={18} />
              </div>
              <span className="mono arch-tag">REASONING LAYER</span>
              <h4 className="arch-heading">Upsonic LLM Agent</h4>
              <p className="arch-p">
                Evaluates structured checkout history and produces advisory action proposals with confidence scores.
              </p>
            </div>

            <div className="arch-node-card">
              <div className="arch-icon-box">
                <ShieldCheck size={18} />
              </div>
              <span className="mono arch-tag">SAFETY GATEWAY</span>
              <h4 className="arch-heading">Deterministic Guardrails</h4>
              <p className="arch-p">
                Immutable code rules enforce one-action limit, retry allowlists, cooldown, and amount equality.
              </p>
            </div>

            <div className="arch-node-card">
              <div className="arch-icon-box">
                <Activity size={18} />
              </div>
              <span className="mono arch-tag">DISPATCHER</span>
              <h4 className="arch-heading">Bounded Intervention</h4>
              <p className="arch-p">
                Dispatches a single authenticated retry to Hyperswitch or modeled customer nudge. Zero autonomous escalation.
              </p>
            </div>

            <div className="arch-node-card">
              <div className="arch-icon-box">
                <LayoutDashboard size={18} />
              </div>
              <span className="mono arch-tag">OPERATIONS</span>
              <h4 className="arch-heading">Merchant Console</h4>
              <p className="arch-p">
                Read-only surface for audit analysis, queue inspection, session comparison, and policy stress tests.
              </p>
            </div>
          </div>
        </section>

        {/* -----------------------------------------------------------------------
            SECTION 8: FINALE & CONSOLE DIRECTORY
            ----------------------------------------------------------------------- */}
        <section className="wireframe-section finale-section">
          <div className="finale-inner">
            <span className="doc-tree-eyebrow mono">GET STARTED</span>
            <h3 className="finale-heading">Explore the Operational Surface</h3>
            <p className="finale-subheading">
              Step from product narrative into live read-only merchant consoles, calibration tables, and step-by-step session replays.
            </p>

            <div className="console-grid">
              <Link to="/" className="console-tile">
                <LayoutDashboard size={18} />
                <span className="mono font-bold text-xs">Overview</span>
                <span className="tile-sub">Metrics & funnel</span>
              </Link>
              <Link to="/recovery-queue" className="console-tile">
                <Activity size={18} />
                <span className="mono font-bold text-xs">Recovery Queue</span>
                <span className="tile-sub">Session ledger</span>
              </Link>
              <Link to="/policy" className="console-tile">
                <ShieldCheck size={18} />
                <span className="mono font-bold text-xs">Policy Studio</span>
                <span className="tile-sub">Code guardrails</span>
              </Link>
              <Link to="/guardrail-tracer" className="console-tile">
                <Workflow size={18} />
                <span className="mono font-bold text-xs">Guardrail Tracer</span>
                <span className="tile-sub">Stress testing</span>
              </Link>
            </div>

            <div className="truth-disclaimer-card mono text-xs text-muted">
              Real sandbox payment rails. Simulated customer outcomes. Policy checks are partial where stored evidence cannot conclusively verify an invariant.
            </div>
          </div>
        </section>
      </main>

      {/* Floating Action Capsule */}
      <div
        className={`floating-action-capsule ${footerInView ? 'capsule-hidden' : ''}`}
        aria-hidden={footerInView}
      >
        <Link to="/" className="capsule-btn-primary">
          <LayoutDashboard size={13} />
          <span>Explore Console</span>
        </Link>
        <div className="capsule-divider" />
        <Link to={primaryReplayUrl} className="capsule-btn-sub">
          <span>Watch Replay</span>
        </Link>
      </div>

      {/* Story Bottom Footer */}
      <footer ref={footerRef} className="story-bottom-footer">
        <div className="footer-left">
          <span className="mono text-xs text-muted">
            CHECKOUT RECOVERY AGENT · SANDBOX EVALUATION SPECIFICATION
          </span>
        </div>
        <div className="footer-right">
          <Link to="/" className="footer-link mono">Console</Link>
          <Link to="/policy" className="footer-link mono">Policy</Link>
          <Link to="/architecture" className="footer-link mono">Architecture</Link>
          <Link to="/audit-log" className="footer-link mono">Audit Log</Link>
        </div>
      </footer>
    </div>
  );
}
