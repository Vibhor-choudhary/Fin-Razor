import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { StaggeredMenu } from './StaggeredMenu';
import { Ripple } from './Ripple';
import './Layout.css';

export function Layout({ children }: { children: React.ReactNode }) {
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Reset scroll and close menu on route change
  useEffect(() => {
    window.scrollTo(0, 0);
    setMenuOpen(false);
  }, [location.pathname]);

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

  // EXPLORE group
  const menuItems = [
    { label: 'Story', ariaLabel: 'Product Story', link: '/' },
    { label: 'Overview', ariaLabel: 'Overview Dashboard', link: '/overview' },
    { label: 'Queue', ariaLabel: 'Recovery Queue', link: '/recovery-queue' },
    { label: 'Replay', ariaLabel: 'Session Replay', link: '/replay' },
    { label: 'Lab', ariaLabel: 'Recovery Lab', link: '/lab' },
    { label: 'Decisions', ariaLabel: 'Decisions Log', link: '/decisions' },
    { label: 'Guardrails', ariaLabel: 'Policy Guardrails', link: '/guardrails' },
    { label: 'Outcomes', ariaLabel: 'Recovery Outcomes', link: '/outcomes' },
  ];

  // LEARN group (social/secondary)
  const socialItems = [
    { label: 'How It Works', link: '/how-it-works' },
    { label: 'Architecture', link: '/architecture' },
  ];

  return (
    <div className={`layout staggered-layout ${menuOpen ? 'menu-open' : ''}`}>
      <StaggeredMenu
        position="right"
        onMenuOpen={() => setMenuOpen(true)}
        onMenuClose={() => setMenuOpen(false)}
        items={menuItems}
        socialItems={socialItems}
        isFixed={true}
        closeOnClickAway={false}
        colors={['var(--divider)', 'var(--surface-raised)', 'var(--canvas)']}
        accentColor="var(--ink)"
      />
      <main className="main-content staggered-main">
        <Ripple />
        {isReadOnly && (
          <div className="demo-readonly-banner" role="status" aria-label="Public Demo Notice">
            <div className="demo-readonly-text">
              <strong style={{ color: 'var(--ink)' }}>SIMULATED DEMO DATA</strong> · No new payments or interventions can be executed here.
            </div>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
