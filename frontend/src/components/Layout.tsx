import { useState } from 'react';
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
  X
} from 'lucide-react';
import { TrustBadge } from './TrustBadge';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          RAZORPAY RECOVERY
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
        <div style={{ marginBottom: '2rem', padding: '0 0.5rem' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--fg-muted)', letterSpacing: '0.1em' }}>
            RAZORPAY RECOVERY
          </div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', fontWeight: 500, marginTop: '0.25rem' }}>
            Merchant Console
          </div>
        </div>

        <Link
          to="/"
          onClick={closeMenu}
          className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
          aria-current={location.pathname === '/' ? 'page' : undefined}
        >
          <LayoutDashboard size={15} /> Overview
        </Link>
        <Link
          to="/recovery-queue"
          onClick={closeMenu}
          className={`nav-item ${location.pathname === '/recovery-queue' || location.pathname.startsWith('/sessions/') ? 'active' : ''}`}
          aria-current={location.pathname === '/recovery-queue' ? 'page' : undefined}
        >
          <ListFilter size={15} /> Recovery Queue
        </Link>
        <Link
          to="/error-intelligence"
          onClick={closeMenu}
          className={`nav-item ${location.pathname === '/error-intelligence' ? 'active' : ''}`}
          aria-current={location.pathname === '/error-intelligence' ? 'page' : undefined}
        >
          <BrainCircuit size={15} /> Error Intelligence
        </Link>
        <Link
          to="/policy"
          onClick={closeMenu}
          className={`nav-item ${location.pathname === '/policy' ? 'active' : ''}`}
          aria-current={location.pathname === '/policy' ? 'page' : undefined}
        >
          <ShieldCheck size={15} /> Policy Studio
        </Link>
        <Link
          to="/guardrail-tracer"
          onClick={closeMenu}
          className={`nav-item ${location.pathname === '/guardrail-tracer' ? 'active' : ''}`}
          aria-current={location.pathname === '/guardrail-tracer' ? 'page' : undefined}
        >
          <Navigation size={15} /> Guardrail Tracer
        </Link>
        <Link
          to="/policy-analysis"
          onClick={closeMenu}
          className={`nav-item ${location.pathname === '/policy-analysis' ? 'active' : ''}`}
          aria-current={location.pathname === '/policy-analysis' ? 'page' : undefined}
        >
          <Scale size={15} /> Policy Analysis
        </Link>
        <Link
          to="/compare"
          onClick={closeMenu}
          className={`nav-item ${location.pathname === '/compare' ? 'active' : ''}`}
          aria-current={location.pathname === '/compare' ? 'page' : undefined}
        >
          <Scale size={15} style={{ transform: 'rotate(90deg)' }} /> Compare Sessions
        </Link>
        <Link
          to="/ledger"
          onClick={closeMenu}
          className={`nav-item ${location.pathname === '/ledger' ? 'active' : ''}`}
          aria-current={location.pathname === '/ledger' ? 'page' : undefined}
        >
          <BookOpen size={15} /> Recovery Ledger
        </Link>
        <Link
          to="/architecture"
          onClick={closeMenu}
          className={`nav-item ${location.pathname === '/architecture' ? 'active' : ''}`}
          aria-current={location.pathname === '/architecture' ? 'page' : undefined}
        >
          <Workflow size={15} /> Architecture
        </Link>
        <Link
          to="/audit-log"
          onClick={closeMenu}
          className={`nav-item ${location.pathname === '/audit-log' ? 'active' : ''}`}
          aria-current={location.pathname === '/audit-log' ? 'page' : undefined}
        >
          <ScrollText size={15} /> Audit Log
        </Link>
        <Link
          to="/story"
          onClick={closeMenu}
          className={`nav-item ${location.pathname === '/story' ? 'active' : ''}`}
          style={{ color: 'var(--gold)', borderColor: location.pathname === '/story' ? 'var(--gold)' : 'transparent' }}
          aria-current={location.pathname === '/story' ? 'page' : undefined}
        >
          <BookOpen size={15} style={{ color: 'var(--gold)' }} /> Recovery Story
        </Link>

        <div style={{ marginTop: 'auto', paddingTop: '3rem', paddingLeft: '0.25rem', paddingRight: '0.25rem' }}>
          <TrustBadge />
          <div className="chip sandbox" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}>
            <Activity size={12} /> Sandbox Mode
          </div>
        </div>
      </nav>

      <main className="main-content">{children}</main>
    </div>
  );
}
