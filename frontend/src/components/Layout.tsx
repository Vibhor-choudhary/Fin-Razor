import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ListFilter, ScrollText, Activity } from 'lucide-react';

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
        <Link to="/audit-log" className={`nav-item ${location.pathname === '/audit-log' ? 'active' : ''}`}>
          <ScrollText size={16} /> Audit Log
        </Link>
        
        <div style={{ marginTop: 'auto', paddingTop: '4rem', paddingLeft: '1rem' }}>
          <div className="chip sandbox">
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
