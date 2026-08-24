import { useEffect, useRef, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api, type Metrics, type Session } from '../lib/api';
import {
  Play,
  LayoutDashboard,
  ShieldCheck,
  Workflow,
  ScrollText,
  ArrowRight,
  Menu,
  X,
  Database,
  Cpu,
  Layers,
  Activity,
  AlertTriangle,
  Scale,
  Navigation,
  BookOpen
} from 'lucide-react';
import './Story.css';

interface NavSection {
  id: string;
  num: string;
  label: string;
}

const SECTIONS: NavSection[] = [
  { id: 'problem', num: '01', label: 'The Problem' },
  { id: 'journey', num: '02', label: 'Loss Journey' },
  { id: 'decision', num: '03', label: 'Decision Boundary' },
  { id: 'proof', num: '04', label: 'Recovery Proof' },
  { id: 'policy', num: '05', label: 'Policy Boundaries' },
  { id: 'architecture', num: '06', label: 'Architecture' }
];

export function Story() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSection, setActiveSection] = useState<string>('problem');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [selectedDecisionStep, setSelectedDecisionStep] = useState<number>(0);
  const [selectedPolicyRule, setSelectedPolicyRule] = useState<number | null>(null);
  const [selectedJourneyStage, setSelectedJourneyStage] = useState<number>(2);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);

    // Fetch live metrics and session list safely
    api.getMetrics().then(setMetrics).catch(console.error);
    api.getAllSessions().then(setSessions).catch(console.error);
  }, []);

  // Discover an authentic decision-bearing session for the primary replay CTA
  const primaryReplayUrl = useMemo(() => {
    if (!sessions || sessions.length === 0) return '/recovery-queue';
    // Prefer a successful retry with recorded decision
    const successfulRetry = sessions.find(
      s => s.intervention_type === 'retry' && s.intervention_status === 'succeeded'
    );
    if (successfulRetry) return `/replay/${successfulRetry.id}`;

    // Otherwise find any session with an intervention record
    const anyIntervention = sessions.find(s => Boolean(s.intervention_type));
    if (anyIntervention) return `/replay/${anyIntervention.id}`;

    // Fallback to recovery queue
    return '/recovery-queue';
  }, [sessions]);

  // Track active section via IntersectionObserver
  useEffect(() => {
    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
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

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fmtCurrency = (n?: number) => {
    if (n == null) return '—';
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

  // Decision boundary steps
  const decisionSteps = [
    {
      stage: '01',
      title: 'OBSERVE',
      badge: 'SANDBOX SIMULATION',
      badgeClass: 'badge-neutral',
      summary: 'Captures terminal checkout event telemetry without blocking the payment stream.',
      detail: 'Freezes environmental context: cart amount, merchant ID, error code (DC_08), and timestamps. Does not execute payment retries or escalate automatically.',
      invariant: 'Event store captures immutable snapshot before any reasoning commences.'
    },
    {
      stage: '02',
      title: 'PROPOSE',
      badge: 'SIMULATED OUTCOME',
      badgeClass: 'badge-cyan',
      summary: 'Upsonic LLM agent evaluates failure reason and proposes an advisory action.',
      detail: 'Outputs structured proposal: action (retry, nudge, none), target channel, and confidence score. The proposal is strictly advisory and cannot execute directly.',
      invariant: 'LLM output is quarantined as an unprivileged recommendation.'
    },
    {
      stage: '03',
      title: 'ENFORCE',
      badge: 'POLICY v1 · CODE ENFORCED',
      badgeClass: 'badge-gold',
      summary: '8 deterministic code guardrails evaluate proposal against hard allowlists.',
      detail: 'Evaluates retry allowlist (DC_08 only), confidence threshold (≥ 0.60), freshness window (60s), amount immutability, and one-action ceiling. Blocks invalid actions immediately.',
      invariant: 'Policy engine is pure deterministic Python code with zero runtime mutation.'
    },
    {
      stage: '04',
      title: 'ACT ONCE',
      badge: 'SANDBOX VERIFIED',
      badgeClass: 'badge-green',
      summary: 'Executes at most one permitted action over authenticated sandbox payment rails.',
      detail: 'Dispatches retry request to Hyperswitch sandbox API or modeled customer nudge. Captures real terminal payment state (succeeded or failed). Never modifies cart amount.',
      invariant: 'Single-action bound guaranteed: session transitions to terminal evaluated state.'
    },
    {
      stage: '05',
      title: 'AUDIT',
      badge: 'HISTORICAL REPLAY · READ ONLY',
      badgeClass: 'badge-neutral',
      summary: 'Records raw gateway response and full reasoning path in tamper-evident event store.',
      detail: 'Stores payload hashes, guardrail decision log, model confidence, and final settlement outcome. Powers Recovery Replay, Guardrail Tracer, and Recovery Ledger.',
      invariant: 'Complete traceability: every recovery decision can be replayed step-by-step.'
    }
  ];

  // Guardrail Matrix items
  const guardrailRules = [
    {
      id: 1,
      rule: 'One-Action Limit',
      value: 'Maximum 1 per session',
      tag: 'STRICT CEILING',
      explanation: 'A checkout session can only ever trigger a single recovery intervention. Repeated spam loops and infinite retries are physically blocked in code.'
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
      time: 'T-00:00',
      title: 'Checkout Opened',
      status: 'Active Intent',
      desc: 'Customer enters checkout with active intent and cart items.',
      chip: 'INITIATED'
    },
    {
      stage: '02',
      time: 'T+02:14',
      title: 'Payment Attempted',
      status: 'In Flight',
      desc: 'Card credentials submitted to Hyperswitch payment orchestration rail.',
      chip: 'PROCESSING'
    },
    {
      stage: '03',
      time: 'T+02:16',
      title: 'Payment Failed',
      status: 'DC_08 · Card declined',
      desc: 'Terminal gateway decline with safe code DC_08 · Payment declined: Card declined.',
      chip: 'DECLINED',
      error: true
    },
    {
      stage: '04',
      time: 'T+02:45',
      title: 'Revenue At Risk',
      status: 'Abandonment Risk',
      desc: 'Customer reaches inactivity threshold. Standard checkouts drop context here.',
      chip: 'AT RISK',
      warning: true
    },
    {
      stage: '05',
      time: 'T+02:46',
      title: 'Recovery Decision',
      status: 'Deterministic Rule Engine',
      desc: 'The model proposes. Deterministic code permits or denies.',
      chip: 'BOUNDED ACTION',
      success: true
    }
  ];

  return (
    <div className="stitch-story">
      {/* =========================================================================
          DESKTOP FIXED STORY SIDEBAR (Stitch Layout)
          ========================================================================= */}
      <aside className="story-sidebar" aria-label="Story Navigation">
        <div className="story-sidebar-brand">
          <span className="story-brand-mono">RAZORPAY RECOVERY</span>
          <h1 className="story-brand-title">
            Checkout
            <br />
            Recovery
            <br />
            Agent
          </h1>
          <div className="story-badge-sandbox">
            <span className="story-dot-pulse" aria-hidden="true"></span>
            <span>SANDBOX SIMULATION</span>
          </div>
        </div>

        <nav className="story-nav-list">
          {SECTIONS.map((sec) => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                className={`story-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => scrollToSection(sec.id)}
                aria-current={isActive ? 'true' : undefined}
              >
                <span className="story-nav-num">{sec.num}</span>
                <span className="story-nav-label">{sec.label}</span>
                {isActive && <div className="story-nav-indicator" aria-hidden="true" />}
              </button>
            );
          })}
        </nav>

        <div className="story-sidebar-footer">
          <Link to="/" className="story-btn story-btn-primary">
            <LayoutDashboard size={14} />
            <span>Explore Console</span>
          </Link>
          <Link to={primaryReplayUrl} className="story-btn story-btn-outline">
            <Play size={14} />
            <span>Watch Recovery Replay</span>
          </Link>
        </div>
      </aside>

      {/* =========================================================================
          MOBILE TOP NAVBAR & MENU
          ========================================================================= */}
      <header className="story-mobile-header">
        <div className="story-mobile-brand">
          <span className="story-brand-mono">CHECKOUT RECOVERY AGENT</span>
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
                  <span className="story-nav-num">{sec.num}</span>
                  <span>{sec.label}</span>
                </button>
              ))}
            </div>

            <div className="story-mobile-menu-actions">
              <Link
                to="/"
                className="story-btn story-btn-primary w-full"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutDashboard size={14} />
                <span>Explore Console</span>
              </Link>
              <Link
                to={primaryReplayUrl}
                className="story-btn story-btn-outline w-full"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Play size={14} />
                <span>Watch Recovery Replay</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MAIN STORY CANVAS (White Background, Wide Column)
          ========================================================================= */}
      <main className="story-main-canvas">
        {/* -----------------------------------------------------------------------
            SECTION 1: HERO / THE PROBLEM
            ----------------------------------------------------------------------- */}
        <section id="problem" className="story-section story-hero-section">
          <div className="story-hero-grid">
            <div className="story-hero-copy">
              <div className="story-eyebrow-row">
                <span className="story-pill-mono">TRACK 03</span>
                <span className="story-pill-mono highlight">
                  <span className="story-dot-pulse" aria-hidden="true"></span>
                  SANDBOX SIMULATION
                </span>
              </div>

              <h2 className="story-hero-heading">
                A failed checkout is not always a lost customer.
              </h2>

              <p className="story-hero-lead">
                Institutional recovery mechanisms identify false declines and safely re-route payments
                before the session expires. Finding revenue at risk with precise operational clarity.
              </p>

              <div className="story-hero-actions">
                <Link to={primaryReplayUrl} className="story-btn story-btn-primary">
                  <Play size={15} />
                  <span>Watch Replay</span>
                  <ArrowRight size={14} className="btn-arrow" />
                </Link>
                <Link to="/" className="story-btn story-btn-outline">
                  <span>Explore Console</span>
                </Link>
              </div>
            </div>

            {/* Original CSS/SVG Primitive Diagram (Replaces Stitch Placeholder) */}
            <div className="story-hero-visual">
              <div className="recovery-vector-card">
                <div className="vector-card-header">
                  <span className="vector-tag mono">RECOVERY VECTOR DIAGRAM</span>
                  <span className="chip provenance-enforced">ACTIVE PIPELINE</span>
                </div>

                <div className="vector-diagram-stage">
                  <svg
                    className="vector-svg"
                    viewBox="0 0 420 180"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-label="Recovery vector pipeline diagram"
                  >
                    {/* Connection Lines */}
                    <line x1="60" y1="90" x2="130" y2="90" stroke="#d9d9d9" strokeWidth="2" strokeDasharray="3 3" />
                    <line x1="150" y1="90" x2="220" y2="90" stroke="#ef4444" strokeWidth="2" />
                    <line x1="240" y1="90" x2="310" y2="90" stroke="#d97706" strokeWidth="2" strokeDasharray="3 3" />
                    <line x1="330" y1="90" x2="390" y2="90" stroke="#10b981" strokeWidth="2" />

                    {/* Node 1: Checkout Event */}
                    <g className="vector-node">
                      <circle cx="50" cy="90" r="18" fill="#ffffff" stroke="#1b1b1b" strokeWidth="2" />
                      <circle cx="50" cy="90" r="6" fill="#1b1b1b" />
                      <text x="50" y="130" textAnchor="middle" className="svg-label mono">Checkout</text>
                      <text x="50" y="142" textAnchor="middle" className="svg-sub mono">T-00:00</text>
                    </g>

                    {/* Node 2: Payment Attempt */}
                    <g className="vector-node">
                      <circle cx="140" cy="90" r="18" fill="#ffffff" stroke="#1b1b1b" strokeWidth="2" />
                      <rect x="134" y="85" width="12" height="10" rx="2" fill="#1b1b1b" />
                      <text x="140" y="130" textAnchor="middle" className="svg-label mono">Attempt</text>
                      <text x="140" y="142" textAnchor="middle" className="svg-sub mono">Gateway</text>
                    </g>

                    {/* Node 3: Risk Signal (DC_08) */}
                    <g className="vector-node">
                      <circle cx="230" cy="90" r="18" fill="#ffffff" stroke="#ef4444" strokeWidth="2" />
                      <line x1="225" y1="85" x2="235" y2="95" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                      <line x1="235" y1="85" x2="225" y2="95" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                      <text x="230" y="130" textAnchor="middle" className="svg-label mono text-red">DC_08</text>
                      <text x="230" y="142" textAnchor="middle" className="svg-sub mono">Declined</text>
                    </g>

                    {/* Node 4: Decision Boundary */}
                    <g className="vector-node">
                      <rect x="312" y="72" width="36" height="36" rx="6" fill="#1b1b1b" stroke="#f59e0b" strokeWidth="2" />
                      <polygon points="330,82 338,90 330,98 322,90" fill="#f59e0b" />
                      <text x="330" y="130" textAnchor="middle" className="svg-label mono font-bold">Policy</text>
                      <text x="330" y="142" textAnchor="middle" className="svg-sub mono">Guardrail</text>
                    </g>

                    {/* Node 5: Audit & Verified Settlement */}
                    <g className="vector-node">
                      <circle cx="395" cy="90" r="16" fill="#10b981" stroke="#10b981" strokeWidth="2" />
                      <polyline points="390,90 393,94 400,86" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <text x="395" y="130" textAnchor="middle" className="svg-label mono text-green">Audit</text>
                      <text x="395" y="142" textAnchor="middle" className="svg-sub mono">Verified</text>
                    </g>
                  </svg>
                </div>

                <div className="vector-card-footer">
                  <span className="mono text-muted text-xs">
                    Deterministic policy matrix ensures exactly one bounded recovery execution per session.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -----------------------------------------------------------------------
            SECTION 2: CHECKOUT LOSS JOURNEY
            ----------------------------------------------------------------------- */}
        <section id="journey" className="story-section story-bordered-section">
          <div className="section-header-row">
            <div>
              <span className="story-section-tag mono">02 THE PROBLEM SPACE</span>
              <h3 className="story-section-title">Checkout Loss Journey</h3>
              <p className="story-section-desc">Mapping the critical path to abandonment and recovery.</p>
            </div>
            <div className="chip sandbox">HISTORICAL REPLAY · READ ONLY</div>
          </div>

          <div className="journey-card-wrapper">
            {/* Desktop Horizontal Connecting Track */}
            <div className="journey-track-desktop" aria-hidden="true">
              <div className="journey-track-line"></div>
            </div>

            {/* Stages */}
            <div className="journey-stages-grid">
              {journeyStages.map((stage, idx) => {
                const isSelected = selectedJourneyStage === idx;
                return (
                  <button
                    key={stage.stage}
                    type="button"
                    className={`journey-stage-node ${isSelected ? 'selected' : ''} ${
                      stage.error ? 'is-error' : stage.warning ? 'is-warning' : stage.success ? 'is-success' : ''
                    }`}
                    onClick={() => setSelectedJourneyStage(idx)}
                  >
                    <div className="journey-node-circle">
                      <span className="mono node-stage-num">{stage.stage}</span>
                    </div>
                    <span className="mono journey-time">{stage.time}</span>
                    <h4 className="journey-stage-title">{stage.title}</h4>
                    <span className={`chip journey-chip ${stage.error ? 'chip-red' : stage.warning ? 'chip-gold' : stage.success ? 'chip-green' : 'chip-neutral'}`}>
                      {stage.chip}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Selected Stage Detail Drawer */}
            <div className="journey-detail-box">
              <div className="detail-box-top">
                <span className="mono font-bold">{journeyStages[selectedJourneyStage].title}</span>
                <span className="mono text-muted text-xs">{journeyStages[selectedJourneyStage].time}</span>
              </div>
              <p className="journey-detail-text">
                {journeyStages[selectedJourneyStage].desc}
              </p>
              {journeyStages[selectedJourneyStage].error && (
                <div className="evidence-truth-banner">
                  <AlertTriangle size={14} className="text-red" />
                  <span className="mono text-xs">DC_08 · Payment declined: Card declined</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* -----------------------------------------------------------------------
            SECTION 3: DECISION BOUNDARY (5 STAGES)
            ----------------------------------------------------------------------- */}
        <section id="decision" className="story-section story-bordered-section">
          <div className="section-header-row">
            <div>
              <span className="story-section-tag mono">03 POLICY EXECUTION</span>
              <h3 className="story-section-title">The Decision Boundary</h3>
              <p className="story-section-desc">“The model proposes. Deterministic code permits or denies.”</p>
            </div>
            <div className="chip provenance-enforced">POLICY v1 · CODE ENFORCED</div>
          </div>

          <div className="decision-boundary-layout">
            {/* Step Selector List */}
            <div className="decision-steps-list">
              {decisionSteps.map((step, idx) => {
                const isSelected = selectedDecisionStep === idx;
                return (
                  <button
                    key={step.stage}
                    type="button"
                    className={`decision-step-row ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedDecisionStep(idx)}
                  >
                    <div className="step-row-left">
                      <span className="mono step-stage-tag">STEP {step.stage}</span>
                      <span className="step-row-title">{step.title}</span>
                    </div>
                    <span className={`chip ${step.badgeClass}`}>{step.badge}</span>
                  </button>
                );
              })}
            </div>

            {/* Step Detail Card */}
            <div className="decision-detail-card">
              <div className="detail-card-head">
                <div className="detail-head-left">
                  <span className="mono text-muted text-xs">
                    PHASE {decisionSteps[selectedDecisionStep].stage}
                  </span>
                  <h4 className="detail-head-title">{decisionSteps[selectedDecisionStep].title}</h4>
                </div>
                <span className={`chip ${decisionSteps[selectedDecisionStep].badgeClass}`}>
                  {decisionSteps[selectedDecisionStep].badge}
                </span>
              </div>

              <div className="detail-card-body">
                <p className="detail-summary-p">
                  {decisionSteps[selectedDecisionStep].summary}
                </p>

                <div className="detail-inner-box">
                  <span className="mono text-xs text-muted block mb-1">EXECUTION SPECIFICATION</span>
                  <p className="text-sm m-0">
                    {decisionSteps[selectedDecisionStep].detail}
                  </p>
                </div>

                <div className="detail-invariant-row">
                  <ShieldCheck size={16} className="text-gold flex-shrink-0" />
                  <span className="mono text-xs">
                    {decisionSteps[selectedDecisionStep].invariant}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* -----------------------------------------------------------------------
            SECTION 4: RECOVERY PROOF & CALIBRATION
            ----------------------------------------------------------------------- */}
        <section id="proof" className="story-section story-bordered-section">
          <div className="section-header-row">
            <div>
              <span className="story-section-tag mono">04 EMPIRICAL OUTCOMES</span>
              <h3 className="story-section-title">Recovery Proof & Calibration</h3>
              <p className="story-section-desc">Measured conversion lift and proven revenue settlement.</p>
            </div>
            <div className="chip sandbox">SANDBOX SIMULATION</div>
          </div>

          {/* Tri-Metric Conversion Row */}
          <div className="conversion-proof-banner">
            <div className="conversion-col">
              <span className="mono conversion-label">BASELINE CONVERSION</span>
              <div className="conversion-val">{fmtPct(metrics?.baseline_conversion)}</div>
              <span className="mono conversion-sub">Control without agent</span>
            </div>

            <div className="conversion-arrow-col" aria-hidden="true">
              <ArrowRight size={24} className="text-muted" />
            </div>

            <div className="conversion-col highlight-col">
              <span className="mono conversion-label">AGENT CONVERSION</span>
              <div className="conversion-val text-green">{fmtPct(metrics?.agent_conversion)}</div>
              <span className="mono conversion-sub">Treatment batch</span>
            </div>

            <div className="conversion-arrow-col" aria-hidden="true">
              <ArrowRight size={24} className="text-muted" />
            </div>

            <div className="conversion-col gold-col">
              <span className="mono conversion-label">CONVERSION LIFT</span>
              <div className="conversion-val text-gold">{fmtLift(metrics?.recovery_lift)}</div>
              <span className="mono conversion-sub">Net percentage points</span>
            </div>
          </div>

          {/* Split Evidence Cards (Strict Provenance Language) */}
          <div className="evidence-cards-grid">
            {/* Card 1: Sandbox Verified */}
            <div className="evidence-card verified-card">
              <div className="evidence-card-top">
                <span className="chip provenance-verified">SANDBOX VERIFIED</span>
                <span className="mono text-xs text-muted">REAL RAILS</span>
              </div>
              <div className="evidence-metric-amount text-green">
                {fmtCurrency(metrics?.verified_sandbox_recovered_amount)}
              </div>
              <div className="evidence-card-desc">
                Revenue recovered via actual successful Hyperswitch sandbox retry payments with terminal
                status <code className="mono">succeeded</code>.
              </div>
              <div className="evidence-card-rule mono">
                Real card decline DC_08 re-attempted once.
              </div>
            </div>

            {/* Card 2: Simulated Outcome */}
            <div className="evidence-card simulated-card">
              <div className="evidence-card-top">
                <span className="chip provenance-simulated">SIMULATED OUTCOME</span>
                <span className="mono text-xs text-muted">MODELED NUDGE</span>
              </div>
              <div className="evidence-metric-amount text-cyan">
                {fmtCurrency(metrics?.simulated_nudge_recovered_amount)}
              </div>
              <div className="evidence-card-desc">
                Revenue recovered via deterministic simulated customer checkout nudges and subsequent
                conversion behavior.
              </div>
              <div className="evidence-card-rule mono">
                Model simulation · customer response modeled.
              </div>
            </div>

            {/* Card 3: Combined Modeled Recovery */}
            <div className="evidence-card total-card">
              <div className="evidence-card-top">
                <span className="chip sandbox">TOTAL MODELED RECOVERY</span>
                <span className="mono text-xs text-muted">COMBINED</span>
              </div>
              <div className="evidence-metric-amount">
                {fmtCurrency(metrics?.total_modeled_recovered_amount)}
              </div>
              <div className="evidence-card-desc">
                Combined sum of verified sandbox retry payments and simulated customer nudges.
              </div>
              <div className="evidence-card-rule mono text-warning">
                NOT SETTLED / LIVE PRODUCTION MONEY.
              </div>
            </div>
          </div>

          {/* Secondary Operational Stats */}
          <div className="secondary-stats-row">
            <div className="sec-stat-box">
              <span className="mono sec-stat-label">FALSE-POSITIVE COST</span>
              <span className="sec-stat-val text-warning">{fmtCurrency(metrics?.false_positive_cost_inr)}</span>
              <span className="mono sec-stat-sub">
                {metrics?.false_positives ?? 0} interventions on self-converts
              </span>
            </div>
            <div className="sec-stat-box">
              <span className="mono sec-stat-label">GUARDRAIL ABSTENTIONS</span>
              <span className="sec-stat-val text-gold">{metrics?.abstentions ?? 0}</span>
              <span className="mono sec-stat-sub">
                {fmtPct(metrics?.abstain_rate)} of evaluated checkouts
              </span>
            </div>
            <div className="sec-stat-box">
              <span className="mono sec-stat-label">UNRESOLVABLE RATE</span>
              <span className="sec-stat-val">{fmtPct(metrics?.unresolvable_rate)}</span>
              <span className="mono sec-stat-sub">Permanent non-retryable declines</span>
            </div>
          </div>

          <div className="proof-action-row">
            <Link to="/ledger" className="story-link-action">
              <span>Inspect Recovery Ledger</span>
              <ArrowRight size={14} />
            </Link>
            <Link to="/policy-analysis" className="story-link-action">
              <span>View Confidence Calibration</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* -----------------------------------------------------------------------
            SECTION 5: POLICY BOUNDARIES
            ----------------------------------------------------------------------- */}
        <section id="policy" className="story-section story-bordered-section">
          <div className="section-header-row">
            <div>
              <span className="story-section-tag mono">05 GOVERNANCE</span>
              <h3 className="story-section-title">Policy Boundaries</h3>
              <p className="story-section-desc">Code-enforced invariants that cannot be overridden by model hallucination.</p>
            </div>
            <div className="chip provenance-enforced">POLICY v1 · CODE ENFORCED</div>
          </div>

          <div className="guardrails-matrix-grid">
            {guardrailRules.map((rule, idx) => {
              const isExpanded = selectedPolicyRule === idx;
              return (
                <div
                  key={rule.id}
                  className={`guardrail-tile ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => setSelectedPolicyRule(isExpanded ? null : idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedPolicyRule(isExpanded ? null : idx);
                    }
                  }}
                >
                  <div className="tile-top">
                    <span className="chip provenance-enforced">{rule.tag}</span>
                    <span className="mono tile-id">RULE #{rule.id}</span>
                  </div>
                  <h4 className="tile-title">{rule.rule}</h4>
                  <div className="tile-value mono">{rule.value}</div>
                  <p className="tile-explanation">{rule.explanation}</p>
                </div>
              );
            })}
          </div>

          <div className="proof-action-row">
            <Link to="/policy" className="story-link-action">
              <span>Open Policy Studio</span>
              <ArrowRight size={14} />
            </Link>
            <Link to="/guardrail-tracer" className="story-link-action">
              <span>Run Guardrail Stress Test Tracer</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* -----------------------------------------------------------------------
            SECTION 6: ARCHITECTURE & SAFETY ENVELOPE
            ----------------------------------------------------------------------- */}
        <section id="architecture" className="story-section story-bordered-section">
          <div className="section-header-row">
            <div>
              <span className="story-section-tag mono">06 SYSTEM ARCHITECTURE</span>
              <h3 className="story-section-title">Architecture & Safety Envelope</h3>
              <p className="story-section-desc">Separation of external payment rails, state machine, and model reasoning.</p>
            </div>
            <div className="chip sandbox">EVENT DRIVEN</div>
          </div>

          {/* System Flow Diagram Cards */}
          <div className="arch-flow-cards">
            <div className="arch-flow-card">
              <div className="arch-card-icon">
                <Workflow size={20} />
              </div>
              <span className="mono arch-card-tag">EXTERNAL RAILS</span>
              <h4 className="arch-card-title">Hyperswitch Sandbox</h4>
              <p className="arch-card-text">
                Real test payment creation, confirmation, terminal status webhooks, and DC_08 decline telemetry.
              </p>
            </div>

            <div className="arch-flow-card">
              <div className="arch-card-icon">
                <Database size={20} />
              </div>
              <span className="mono arch-card-tag">AUDIT LOG</span>
              <h4 className="arch-card-title">SQLite Event Store</h4>
              <p className="arch-card-text">
                Retains immutable session records, intervention decisions, and raw gateway response payloads.
              </p>
            </div>

            <div className="arch-flow-card">
              <div className="arch-card-icon">
                <Cpu size={20} />
              </div>
              <span className="mono arch-card-tag">REASONING LAYER</span>
              <h4 className="arch-card-title">Upsonic LLM Agent</h4>
              <p className="arch-card-text">
                Evaluates structured checkout history and produces advisory action proposals with confidence scores.
              </p>
            </div>

            <div className="arch-flow-card">
              <div className="arch-card-icon">
                <ShieldCheck size={20} />
              </div>
              <span className="mono arch-card-tag">SAFETY GATEWAY</span>
              <h4 className="arch-card-title">Deterministic Guardrails</h4>
              <p className="arch-card-text">
                Immutable code rules enforce one-action limit, retry allowlists, cooldown, and amount equality.
              </p>
            </div>

            <div className="arch-flow-card">
              <div className="arch-card-icon">
                <Activity size={20} />
              </div>
              <span className="mono arch-card-tag">DISPATCHER</span>
              <h4 className="arch-card-title">Bounded Intervention</h4>
              <p className="arch-card-text">
                Dispatches a single authenticated retry to Hyperswitch or modeled customer nudge. Zero autonomous escalation.
              </p>
            </div>

            <div className="arch-flow-card">
              <div className="arch-card-icon">
                <LayoutDashboard size={20} />
              </div>
              <span className="mono arch-card-tag">OPERATOR UI</span>
              <h4 className="arch-card-title">Merchant Console</h4>
              <p className="arch-card-text">
                Read-only observability: Recovery Queue, Policy Studio, Error Intelligence, and Full Replay.
              </p>
            </div>
          </div>

          <div className="proof-action-row">
            <Link to="/architecture" className="story-link-action">
              <span>Open Architecture Explorer</span>
              <ArrowRight size={14} />
            </Link>
            <Link to="/audit-log" className="story-link-action">
              <span>View Audit Trail</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* -----------------------------------------------------------------------
            SECTION 7: FINAL CTA / CONSOLE DIRECTORY
            ----------------------------------------------------------------------- */}
        <section id="console" className="story-section story-finale-section">
          <div className="finale-content">
            <span className="story-section-tag mono">07 COMPLETE EVIDENCE TRAIL</span>
            <h2 className="finale-title">Inspect the live console.</h2>
            <p className="finale-subtitle">
              Every metric, proposal, decline code, and guardrail decision is fully auditable in the merchant
              console.
            </p>

            <div className="console-links-grid">
              <Link to="/" className="console-link-card">
                <LayoutDashboard size={18} />
                <span className="mono font-bold">Overview</span>
                <span className="text-xs text-muted">Batch metrics & lift</span>
              </Link>
              <Link to="/recovery-queue" className="console-link-card">
                <Layers size={18} />
                <span className="mono font-bold">Recovery Queue</span>
                <span className="text-xs text-muted">Session inspection</span>
              </Link>
              <Link to="/policy" className="console-link-card">
                <ShieldCheck size={18} />
                <span className="mono font-bold">Policy Studio</span>
                <span className="text-xs text-muted">Deterministic rules</span>
              </Link>
              <Link to="/guardrail-tracer" className="console-link-card">
                <Navigation size={18} />
                <span className="mono font-bold">Guardrail Tracer</span>
                <span className="text-xs text-muted">Replay rule chains</span>
              </Link>
              <Link to="/policy-analysis" className="console-link-card">
                <Scale size={18} />
                <span className="mono font-bold">Policy Analysis</span>
                <span className="text-xs text-muted">Coverage & calibration</span>
              </Link>
              <Link to="/ledger" className="console-link-card">
                <BookOpen size={18} />
                <span className="mono font-bold">Recovery Ledger</span>
                <span className="text-xs text-muted">Provenance accounting</span>
              </Link>
              <Link to="/architecture" className="console-link-card">
                <Workflow size={18} />
                <span className="mono font-bold">Architecture</span>
                <span className="text-xs text-muted">System node explorer</span>
              </Link>
              <Link to="/audit-log" className="console-link-card">
                <ScrollText size={18} />
                <span className="mono font-bold">Audit Log</span>
                <span className="text-xs text-muted">Immutable event records</span>
              </Link>
            </div>

            <div className="finale-disclaimer-card">
              <span className="mono text-xs text-muted">
                SANDBOX SIMULATION — REAL HYPERSWITCH PAYMENT RAILS · SIMULATED CUSTOMER OUTCOMES
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================================
          BOTTOM STICKY UTILITY BAR (Non-Obscuring)
          ========================================================================= */}
      <footer className="story-utility-bar">
        <div className="utility-bar-left">
          <span className="mono text-xs text-muted">
            © 2024 Checkout Recovery Agent · Precise Operational Clarity
          </span>
        </div>
        <div className="utility-bar-right">
          <Link to="/" className="utility-link mono">
            Console
          </Link>
          <Link to={primaryReplayUrl} className="utility-link mono">
            Replay
          </Link>
          <Link to="/policy" className="utility-link mono">
            Policy
          </Link>
          <Link to="/architecture" className="utility-link mono">
            Architecture
          </Link>
        </div>
      </footer>
    </div>
  );
}
