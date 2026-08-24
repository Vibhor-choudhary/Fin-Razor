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
  const [selectedDecisionStep, setSelectedDecisionStep] = useState<number>(2); // Default to ENFORCE
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

  // 5-Stage Decision Engine Specs
  const decisionSteps = [
    {
      stage: '01',
      title: 'OBSERVE',
      subtitle: 'Event evidence received',
      badge: 'SANDBOX SIMULATION',
      badgeClass: 'badge-neutral',
      height: '40%',
      marker: '○',
      summary: 'Captures terminal checkout event telemetry without blocking the payment stream.',
      detail: 'Freezes environmental context: cart amount, error code (DC_08), and state snapshot. Does not execute payment retries or escalate automatically.',
      invariant: 'Event store captures immutable snapshot before reasoning commences.'
    },
    {
      stage: '02',
      title: 'PROPOSE',
      subtitle: 'LLM recommendation',
      badge: 'SIMULATED OUTCOME',
      badgeClass: 'badge-cyan',
      height: '60%',
      marker: '◇',
      summary: 'Upsonic LLM agent evaluates failure reason and proposes an advisory action.',
      detail: 'Outputs structured proposal: action (retry, nudge, none), target channel, and confidence score. The proposal is strictly advisory and cannot execute directly.',
      invariant: 'LLM output is quarantined as an unprivileged recommendation.'
    },
    {
      stage: '03',
      title: 'ENFORCE',
      subtitle: 'Code checks policy',
      badge: 'POLICY v1 · CODE ENFORCED',
      badgeClass: 'badge-gold',
      height: '96%',
      marker: '⬡',
      isDominant: true,
      summary: '8 deterministic code guardrails evaluate proposal against hard allowlists.',
      detail: 'Evaluates retry allowlist (DC_08 only), confidence threshold (≥ 0.60), freshness window (60s), amount immutability, and one-action ceiling. Blocks invalid actions immediately.',
      invariant: 'Policy engine is pure deterministic Python code with zero runtime mutation.'
    },
    {
      stage: '04',
      title: 'ACT ONCE',
      subtitle: 'One bounded action',
      badge: 'SANDBOX VERIFIED',
      badgeClass: 'badge-green',
      height: '75%',
      marker: '◇',
      summary: 'Executes at most one permitted action over authenticated sandbox payment rails.',
      detail: 'Dispatches retry request to Hyperswitch sandbox API or modeled customer nudge. Captures real terminal payment state (succeeded or failed). Never modifies cart amount.',
      invariant: 'Single-action bound guaranteed: session transitions to terminal evaluated state.'
    },
    {
      stage: '05',
      title: 'AUDIT',
      subtitle: 'Outcome retained',
      badge: 'HISTORICAL REPLAY · READ ONLY',
      badgeClass: 'badge-neutral',
      height: '50%',
      marker: '○',
      summary: 'Records raw gateway response and full reasoning path in event store.',
      detail: 'Stores payload hashes, guardrail decision log, model confidence, and final outcome. Powers Recovery Replay, Guardrail Tracer, and Recovery Ledger.',
      invariant: 'Audit records retained for review: every recovery decision can be replayed step-by-step.'
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
                <span className="doc-node-num mono">{sec.num}</span>
                <span className="doc-node-label">{sec.label}</span>
                {isActive && <div className="doc-active-indicator" aria-hidden="true" />}
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
            SECTION 1: HERO / DECISION GATEWAY WIREFRAME
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

            {/* Original Decision Gateway Wireframe Visual */}
            <div className="hero-visual-wrapper">
              <div className="wireframe-panel decision-gateway-panel">
                <div className="wireframe-panel-header">
                  <span className="mono text-xs text-muted">DECISION GATEWAY WIREFRAME</span>
                  <span className="chip provenance-enforced">POLICY v1 · CODE ENFORCED</span>
                </div>

                <div className="gateway-vector-stage">
                  <svg
                    className="gateway-svg"
                    viewBox="0 0 460 210"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-label="Decision gateway wireframe architecture"
                  >
                    {/* Dashed Perspective Projection Lines */}
                    <line x1="30" y1="30" x2="230" y2="105" stroke="#d9d9d9" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="430" y1="30" x2="230" y2="105" stroke="#d9d9d9" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="30" y1="180" x2="230" y2="105" stroke="#d9d9d9" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="430" y1="180" x2="230" y2="105" stroke="#d9d9d9" strokeWidth="1" strokeDasharray="3 3" />

                    {/* Central Connectors */}
                    <line x1="125" y1="105" x2="195" y2="105" stroke="#1b1b1b" strokeWidth="1.5" />
                    <line x1="265" y1="105" x2="335" y2="105" stroke="#1b1b1b" strokeWidth="1.5" />
                    <line x1="230" y1="55" x2="230" y2="75" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" />

                    {/* Card A: Risk Signal (Left) */}
                    <g className="svg-card-node">
                      <rect x="25" y="70" width="100" height="70" rx="6" fill="#ffffff" stroke="#ef4444" strokeWidth="1.5" />
                      <circle cx="38" cy="84" r="4" fill="#ef4444" />
                      <text x="48" y="87" className="svg-tag mono">RISK SIGNAL</text>
                      <text x="38" y="107" className="svg-bold-val mono">DC_08</text>
                      <text x="38" y="125" className="svg-desc mono">Card declined</text>
                    </g>

                    {/* Central Node: Decision Gateway */}
                    <g className="svg-gateway-core">
                      <polygon points="230,75 265,105 230,135 195,105" fill="#1b1b1b" stroke="#1b1b1b" strokeWidth="2" />
                      <circle cx="230" cy="105" r="7" fill="#f59e0b" />
                      <text x="230" y="152" textAnchor="middle" className="svg-tag mono font-bold">DECISION GATEWAY</text>
                      <text x="230" y="165" textAnchor="middle" className="svg-sub mono">Code Enforces</text>
                    </g>

                    {/* Card B: Policy Check (Top Center) */}
                    <g className="svg-card-node">
                      <rect x="175" y="10" width="110" height="45" rx="6" fill="#ffffff" stroke="#f59e0b" strokeWidth="1.5" />
                      <rect x="185" y="18" width="6" height="6" fill="#f59e0b" />
                      <text x="197" y="24" className="svg-tag mono">POLICY CHECK</text>
                      <text x="185" y="42" className="svg-sub mono font-bold">≥ 0.60 · 1 action max</text>
                    </g>

                    {/* Card C: Outcome (Right) */}
                    <g className="svg-card-node">
                      <rect x="330" y="70" width="110" height="70" rx="6" fill="#ffffff" stroke="#10b981" strokeWidth="1.5" />
                      <circle cx="344" cy="84" r="4" fill="#10b981" />
                      <text x="354" y="87" className="svg-tag mono">OUTCOME</text>
                      <text x="344" y="107" className="svg-bold-val mono text-green">
                        {metrics?.verified_sandbox_recovered_amount != null
                          ? `₹${Math.round(metrics.verified_sandbox_recovered_amount).toLocaleString('en-IN')}`
                          : '₹—'}
                      </text>
                      <text x="344" y="125" className="svg-desc mono text-green">SANDBOX VERIFIED</text>
                    </g>
                  </svg>
                </div>

                <div className="wireframe-panel-footer">
                  <span className="mono text-xs text-muted">
                    Deterministic policy matrix ensures exactly one bounded recovery execution per session.
                  </span>
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
            <div className="journey-nodes-row">
              {journeyStages.map((stage, idx) => {
                const isSelected = selectedJourneyStage === idx;
                return (
                  <button
                    key={stage.stage}
                    type="button"
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
            <div className="journey-drawer-box">
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

          {/* 5-Stage Wireframe Bar Analysis Visual */}
          <div className="wireframe-panel decision-chart-panel">
            <div className="decision-chart-grid">
              {/* Horizontal Guide Lines */}
              <div className="chart-guides" aria-hidden="true">
                <div className="chart-guide-line"></div>
                <div className="chart-guide-line"></div>
                <div className="chart-guide-line"></div>
                <div className="chart-guide-line"></div>
              </div>

              {/* 5 Stage Pillars */}
              <div className="chart-pillars-row">
                {decisionSteps.map((step, idx) => {
                  const isSelected = selectedDecisionStep === idx;
                  return (
                    <div
                      key={step.stage}
                      className={`chart-pillar-col ${isSelected ? 'selected' : ''} ${step.isDominant ? 'dominant' : ''}`}
                      onClick={() => setSelectedDecisionStep(idx)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setSelectedDecisionStep(idx);
                      }}
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
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Phase Invariant Details */}
            <div className="decision-phase-card">
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
            SECTION 4: RECOVERY PROOF & ORBIT FOCAL PANEL
            ----------------------------------------------------------------------- */}
        <section id="proof" className="wireframe-section bordered-section">
          <div className="section-title-bar">
            <div>
              <span className="doc-section-tag mono">04 EMPIRICAL OUTCOMES</span>
              <h3 className="doc-section-heading">Recovery Proof & Calibration</h3>
              <p className="doc-section-sub">
                Measured conversion lift and proven revenue settlement across evaluation sessions.
              </p>
            </div>
            <div className="chip sandbox">SANDBOX SIMULATION</div>
          </div>

          {/* Staggered Vertical Evidence Columns */}
          <div className="staggered-columns-grid">
            {/* Column A: Recovery Lift */}
            <div className="stagger-col col-offset-1">
              <span className="stagger-tag mono">RECOVERY LIFT</span>
              <div className="stagger-metric-val text-gold">{fmtLift(metrics?.recovery_lift)}</div>
              <p className="stagger-desc">
                Difference between recorded treatment and control conversion rates in this sandbox evaluation batch.
              </p>
            </div>

            {/* Column B: Agent Conversion */}
            <div className="stagger-col col-offset-2">
              <span className="stagger-tag mono">AGENT CONVERSION</span>
              <div className="stagger-metric-val">{fmtPct(metrics?.agent_conversion)}</div>
              <p className="stagger-desc">
                Recorded treatment cohort conversion. Baseline: {fmtPct(metrics?.baseline_conversion)}.
              </p>
            </div>

            {/* Column C: Sandbox Verified */}
            <div className="stagger-col col-offset-3">
              <div className="col-header-chip">
                <span className="stagger-tag mono">SANDBOX VERIFIED</span>
                <span className="chip provenance-verified">REAL RAILS</span>
              </div>
              <div className="stagger-metric-val text-green">
                {fmtCurrency(metrics?.verified_sandbox_recovered_amount)}
              </div>
              <p className="stagger-desc">
                Successful sandbox retry evidence only. Real terminal status <code className="mono">succeeded</code>.
              </p>
            </div>

            {/* Column D: Policy Evidence */}
            <div className="stagger-col col-offset-4">
              <div className="col-header-chip">
                <span className="stagger-tag mono">POLICY EVIDENCE</span>
                <span className="chip sandbox">PARTIAL</span>
              </div>
              <div className="stagger-metric-val">
                {metrics?.abstentions != null ? metrics.abstentions : '—'}
              </div>
              <p className="stagger-desc">
                Recorded abstentions are a safety outcome. Policy checks are partial where stored evidence cannot conclusively verify an invariant.
              </p>
            </div>
          </div>

          {/* Original Orbit / Focal Evidence Panel */}
          <div className="wireframe-panel orbit-focal-panel">
            <div className="orbit-canvas-wrapper">
              <svg
                className="orbit-svg"
                viewBox="0 0 500 240"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Orbit focal evidence diagram"
              >
                {/* Outer Dashed Orbit Path */}
                <ellipse
                  cx="250"
                  cy="120"
                  rx="220"
                  ry="95"
                  stroke="#d9d9d9"
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
                  stroke="#1b1b1b"
                  strokeWidth="1"
                  className="orbit-ring-solid"
                />

                {/* Geometric Evidence Orbit Tokens */}
                <g className="orbit-token token-1">
                  <circle cx="70" cy="120" r="6" fill="#ffffff" stroke="#1b1b1b" strokeWidth="1.5" />
                  <circle cx="70" cy="120" r="2" fill="#1b1b1b" />
                  <text x="70" y="142" textAnchor="middle" className="svg-sub mono">DC_08</text>
                </g>

                <g className="orbit-token token-2">
                  <rect x="424" y="114" width="12" height="12" rx="2" fill="#ffffff" stroke="#10b981" strokeWidth="1.5" />
                  <circle cx="430" cy="120" r="2" fill="#10b981" />
                  <text x="430" y="142" textAnchor="middle" className="svg-sub mono text-green">Retry</text>
                </g>

                <g className="orbit-token token-3">
                  <polygon points="250,20 256,28 250,36 244,28" fill="#f59e0b" />
                  <text x="250" y="15" textAnchor="middle" className="svg-sub mono text-gold">Policy</text>
                </g>
              </svg>

              {/* Center Focal Box */}
              <div className="orbit-center-card">
                <span className="chip sandbox" style={{ marginBottom: '0.5rem' }}>
                  TOTAL MODELED RECOVERY
                </span>
                <div className="orbit-focal-amount">
                  {fmtCurrency(metrics?.total_modeled_recovered_amount)}
                </div>
                <p className="orbit-method-line mono">
                  Verified sandbox retries + simulated nudge outcomes
                </p>
                <div className="orbit-disclaimer-tag mono">
                  Not settled/live money.
                </div>
                <Link to="/ledger" className="doc-link-action mono" style={{ marginTop: '1rem' }}>
                  <span>Inspect recovery ledger</span>
                  <ArrowRight size={14} />
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
            SECTION 6: POLICY MATRIX
            ----------------------------------------------------------------------- */}
        <section id="policy" className="wireframe-section bordered-section">
          <div className="section-title-bar">
            <div>
              <span className="doc-section-tag mono">05 GOVERNANCE</span>
              <h3 className="doc-section-heading">Policy Matrix</h3>
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
                <div
                  key={rule.id}
                  className={`matrix-tile ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => setSelectedPolicyRule(isExpanded ? null : idx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedPolicyRule(isExpanded ? null : idx);
                  }}
                >
                  <div className="tile-top-bar">
                    <span className="chip provenance-enforced">{rule.tag}</span>
                    <span className="mono tile-rule-num">RULE #{rule.id}</span>
                  </div>
                  <h4 className="matrix-tile-title">{rule.rule}</h4>
                  <div className="matrix-tile-val mono">{rule.value}</div>
                  <p className="matrix-tile-desc">{rule.explanation}</p>
                </div>
              );
            })}
          </div>

          <div className="proof-action-row">
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
              <span className="mono arch-tag">OPERATOR UI</span>
              <h4 className="arch-heading">Merchant Console</h4>
              <p className="arch-p">
                Read-only observability: Recovery Queue, Policy Studio, Error Intelligence, and Full Replay.
              </p>
            </div>
          </div>

          <div className="proof-action-row">
            <Link to="/architecture" className="doc-link-action mono">
              <span>Open Architecture Explorer</span>
              <ArrowRight size={14} />
            </Link>
            <Link to="/audit-log" className="doc-link-action mono">
              <span>View Audit Trail</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* -----------------------------------------------------------------------
            SECTION 8: CONSOLE DIRECTORY
            ----------------------------------------------------------------------- */}
        <section id="console" className="wireframe-section finale-section">
          <div className="finale-inner">
            <span className="doc-section-tag mono">07 COMPLETE EVIDENCE TRAIL</span>
            <h2 className="finale-heading">Inspect the live console.</h2>
            <p className="finale-subheading">
              Every metric, proposal, decline code, and guardrail decision is fully auditable in the merchant console.
            </p>

            <div className="console-grid">
              <Link to="/" className="console-tile">
                <LayoutDashboard size={16} />
                <span className="mono font-bold">Overview</span>
                <span className="tile-sub">Batch metrics & lift</span>
              </Link>
              <Link to="/recovery-queue" className="console-tile">
                <Layers size={16} />
                <span className="mono font-bold">Recovery Queue</span>
                <span className="tile-sub">Session inspection</span>
              </Link>
              <Link to="/policy" className="console-tile">
                <ShieldCheck size={16} />
                <span className="mono font-bold">Policy Studio</span>
                <span className="tile-sub">Deterministic rules</span>
              </Link>
              <Link to="/guardrail-tracer" className="console-tile">
                <Navigation size={16} />
                <span className="mono font-bold">Guardrail Tracer</span>
                <span className="tile-sub">Replay rule chains</span>
              </Link>
              <Link to="/policy-analysis" className="console-tile">
                <Scale size={16} />
                <span className="mono font-bold">Policy Analysis</span>
                <span className="tile-sub">Coverage & calibration</span>
              </Link>
              <Link to="/ledger" className="console-tile">
                <BookOpen size={16} />
                <span className="mono font-bold">Recovery Ledger</span>
                <span className="tile-sub">Provenance accounting</span>
              </Link>
              <Link to="/architecture" className="console-tile">
                <Workflow size={16} />
                <span className="mono font-bold">Architecture</span>
                <span className="tile-sub">System node explorer</span>
              </Link>
              <Link to="/audit-log" className="console-tile">
                <ScrollText size={16} />
                <span className="mono font-bold">Audit Log</span>
                <span className="tile-sub">Audit records</span>
              </Link>
            </div>

            <div className="truth-disclaimer-card">
              <span className="mono text-xs text-muted">
                SANDBOX SIMULATION — REAL HYPERSWITCH PAYMENT RAILS · SIMULATED CUSTOMER OUTCOMES
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* =========================================================================
          FLOATING ACTION CAPSULE (Desktop-Only Bottom Center)
          ========================================================================= */}
      <div className={`floating-action-capsule ${footerInView ? 'capsule-hidden' : ''}`} aria-hidden="true">
        <Link to={primaryReplayUrl} className="capsule-btn-primary">
          <Play size={13} />
          <span>Watch recovery replay</span>
        </Link>
        <div className="capsule-divider"></div>
        <Link to="/" className="capsule-btn-sub">
          <span>Explore console</span>
        </Link>
      </div>

      {/* =========================================================================
          BOTTOM FOOTER BAR
          ========================================================================= */}
      <footer ref={footerRef} className="story-bottom-footer">
        <div className="footer-left mono text-xs text-muted">
          © 2024 Checkout Recovery Agent · Real sandbox payment rails. Simulated customer outcomes.
        </div>
        <div className="footer-right">
          <Link to="/" className="footer-link mono">Console</Link>
          <Link to={primaryReplayUrl} className="footer-link mono">Replay</Link>
          <Link to="/policy" className="footer-link mono">Policy</Link>
          <Link to="/architecture" className="footer-link mono">Architecture</Link>
        </div>
      </footer>
    </div>
  );
}
