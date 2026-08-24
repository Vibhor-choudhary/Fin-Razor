import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ListFilter, ScrollText, Activity, ShieldCheck, BrainCircuit, Workflow, Navigation, Scale, BookOpen } from 'lucide-react';
import { TrustBadge } from './TrustBadge';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  
  return (
    <div className="layout">
      <nav className="sidebar">
        <div style={{ marginBottom: '2rem', padding: '0 1rem' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--fg-muted)', letterSpacing: '0.1em' }}>
            RAZORPAY RECOVERY
          </div>
        </div>
        
        <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
          <LayoutDashboard size={16} /> Overview
        </Link>
        <Link to="/recovery-queue" className={`nav-item ${location.pathname === '/recovery-queue' || location.pathname.startsWith('/sessions/') ? 'active' : ''}`}>
          <ListFilter size={16} /> Recovery Queue
        </Link>
        <Link to="/error-intelligence" className={`nav-item ${location.pathname === '/error-intelligence' ? 'active' : ''}`}>
          <BrainCircuit size={16} /> Error Intelligence
        </Link>
        <Link to="/policy" className={`nav-item ${location.pathname === '/policy' ? 'active' : ''}`}>
          <ShieldCheck size={16} /> Policy Studio
        </Link>
        <Link to="/guardrail-tracer" className={`nav-item ${location.pathname === '/guardrail-tracer' ? 'active' : ''}`}>
          <Navigation size={16} /> Guardrail Tracer
        </Link>
        <Link to="/policy-analysis" className={`nav-item ${location.pathname === '/policy-analysis' ? 'active' : ''}`}>
          <Scale size={16} /> Policy Analysis
        </Link>
        <Link to="/compare" className={`nav-item ${location.pathname === '/compare' ? 'active' : ''}`}>
          <Scale size={16} style={{ transform: 'rotate(90deg)' }} /> Compare Sessions
        </Link>
        <Link to="/ledger" className={`nav-item ${location.pathname === '/ledger' ? 'active' : ''}`}>
          <BookOpen size={16} /> Recovery Ledger
        </Link>
        <Link to="/architecture" className={`nav-item ${location.pathname === '/architecture' ? 'active' : ''}`}>
          <Workflow size={16} /> Architecture
        </Link>
        <Link to="/audit-log" className={`nav-item ${location.pathname === '/audit-log' ? 'active' : ''}`}>
          <ScrollText size={16} /> Audit Log
        </Link>
        <Link to="/story" className={`nav-item ${location.pathname === '/story' ? 'active' : ''}`} style={{ color: 'var(--gold)', borderColor: location.pathname === '/story' ? 'var(--gold)' : 'transparent' }}>
          <BookOpen size={16} style={{ color: 'var(--gold)' }} /> Recovery Story
        </Link>
        
        <div style={{ marginTop: 'auto', paddingTop: '4rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
          <TrustBadge />
          <div className="chip sandbox" style={{ width: '100%', justifyContent: 'center' }}>
            <Activity size={12} /> Sandbox Mode
          </div>
        </div>
      </nav>
      
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
