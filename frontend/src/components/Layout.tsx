import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ListFilter,
  ScrollText,
  Activity,
  ShieldCheck,
  BrainCircuit,
  Workflow,
  Navigation,
  Scale,
  BookOpen,
  Menu,
  X,
  ArrowUpRight,
  FlaskConical,
  Lock
} from 'lucide-react';
import { TrustBadge } from './TrustBadge';
import { api } from '../lib/api';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);

  useEffect(() => {
    async function checkEnv() {
      try {
        const res = await api.getLabScenarios();
        setIsReadOnly(res.read_only);
      } catch (e) {
        // Safe fallback
      }
    }
    checkEnv();
  }, []);

  // If on the Story page, render full standalone light-mode storyboard canvas
  if (location.pathname === '/story') {
    return <>{children}</>;
  }

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <div className="layout">
      {/* Mobile Top Header */}
      <header className="console-mobile-header">
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em' }}>
          CHECKOUT RECOVERY AGENT
        </div>
        <button
          type="button"
          className="console-menu-btn"
          aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Navigation Menu'}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Main Sidebar */}
      <nav className={`sidebar ${mobileMenuOpen ? 'open' : ''}`} aria-label="Console Navigation">
        <div className="sidebar-brand-block">
          <span className="doc-tree-eyebrow mono">CHECKOUT RECOVERY AGENT</span>
          <h2 className="doc-tree-title">Merchant Console</h2>
          <div className="doc-chip-sandbox">
            <span className="doc-dot-pulse" aria-hidden="true"></span>
            <span>SANDBOX SIMULATION</span>
          </div>
        </div>

        {/* Group 1: OPERATE */}
        <div className="sidebar-nav-group">
          <span className="sidebar-group-label mono">OPERATE</span>
          <Link
            to="/"
            onClick={closeMenu}
            className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
            aria-current={location.pathname === '/' ? 'page' : undefined}
          >
            <LayoutDashboard size={14} /> Overview
          </Link>
          <Link
            to="/recovery-queue"
            onClick={closeMenu}
            className={`nav-item ${location.pathname === '/recovery-queue' || location.pathname.startsWith('/sessions/') ? 'active' : ''}`}
            aria-current={location.pathname === '/recovery-queue' ? 'page' : undefined}
          >
            <ListFilter size={14} /> Recovery Queue
          </Link>
          <Link
            to="/lab"
            onClick={closeMenu}
            className={`nav-item ${location.pathname === '/lab' ? 'active' : ''}`}
            aria-current={location.pathname === '/lab' ? 'page' : undefined}
          >
            <FlaskConical size={14} /> Recovery Lab
          </Link>
          <Link
            to="/audit-log"
            onClick={closeMenu}
            className={`nav-item ${location.pathname === '/audit-log' ? 'active' : ''}`}
            aria-current={location.pathname === '/audit-log' ? 'page' : undefined}
          >
            <ScrollText size={14} /> Audit Log
          </Link>
        </div>

        {/* Group 2: ANALYZE */}
        <div className="sidebar-nav-group">
          <span className="sidebar-group-label mono">ANALYZE</span>
          <Link
            to="/error-intelligence"
            onClick={closeMenu}
            className={`nav-item ${location.pathname === '/error-intelligence' ? 'active' : ''}`}
            aria-current={location.pathname === '/error-intelligence' ? 'page' : undefined}
          >
            <BrainCircuit size={14} /> Error Intelligence
          </Link>
          <Link
            to="/policy-analysis"
            onClick={closeMenu}
            className={`nav-item ${location.pathname === '/policy-analysis' ? 'active' : ''}`}
            aria-current={location.pathname === '/policy-analysis' ? 'page' : undefined}
          >
            <Scale size={14} /> Policy Analysis
          </Link>
          <Link
            to="/compare"
            onClick={closeMenu}
            className={`nav-item ${location.pathname === '/compare' ? 'active' : ''}`}
            aria-current={location.pathname === '/compare' ? 'page' : undefined}
          >
            <Scale size={14} style={{ transform: 'rotate(90deg)' }} /> Compare Sessions
          </Link>
          <Link
            to="/ledger"
            onClick={closeMenu}
            className={`nav-item ${location.pathname === '/ledger' ? 'active' : ''}`}
            aria-current={location.pathname === '/ledger' ? 'page' : undefined}
          >
            <BookOpen size={14} /> Recovery Ledger
          </Link>
        </div>

        {/* Group 3: GOVERN */}
        <div className="sidebar-nav-group">
          <span className="sidebar-group-label mono">GOVERN</span>
          <Link
            to="/policy"
            onClick={closeMenu}
            className={`nav-item ${location.pathname === '/policy' ? 'active' : ''}`}
            aria-current={location.pathname === '/policy' ? 'page' : undefined}
          >
            <ShieldCheck size={14} /> Policy Studio
          </Link>
          <Link
            to="/guardrail-tracer"
            onClick={closeMenu}
            className={`nav-item ${location.pathname === '/guardrail-tracer' ? 'active' : ''}`}
            aria-current={location.pathname === '/guardrail-tracer' ? 'page' : undefined}
          >
            <Navigation size={14} /> Guardrail Tracer
          </Link>
          <Link
            to="/architecture"
            onClick={closeMenu}
            className={`nav-item ${location.pathname === '/architecture' ? 'active' : ''}`}
            aria-current={location.pathname === '/architecture' ? 'page' : undefined}
          >
            <Workflow size={14} /> Architecture
          </Link>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer-block">
          <TrustBadge />
          <Link
            to="/story"
            onClick={closeMenu}
            className="doc-pill-btn doc-btn-outline"
            style={{ width: '100%' }}
          >
            <span>View recovery story</span>
            <ArrowUpRight size={13} />
          </Link>
          <div className="chip sandbox" style={{ width: '100%', justifyContent: 'center' }}>
            <Activity size={11} /> Sandbox Mode
          </div>
        </div>
      </nav>

      <main className="main-content">
        {isReadOnly && (
          <div className="demo-readonly-banner" role="status" aria-label="Public Demo Notice">
            <div className="demo-readonly-badge mono">
              <Lock size={12} style={{ marginRight: '0.35rem' }} />
              PUBLIC DEMO · READ ONLY
            </div>
            <div className="demo-readonly-text">
              SIMULATED DEMO DATA · No new payments or interventions can be executed here.
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
