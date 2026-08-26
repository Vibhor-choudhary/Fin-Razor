import { useState } from 'react';
import { Ledger } from './Ledger';
import { ErrorIntelligence } from './ErrorIntelligence';
import { Comparator } from './Comparator';

type OutcomesTab = 'ledger' | 'intelligence' | 'compare';

export function Outcomes() {
  const [tab, setTab] = useState<OutcomesTab>('ledger');

  return (
    <div className="fade-in">
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 'var(--space-1)', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--divider)', paddingBottom: '0' }}>
        {(
          [
            { id: 'ledger', label: 'Recovery Ledger' },
            { id: 'intelligence', label: 'Error Intelligence' },
            { id: 'compare', label: 'Compare Sessions' },
          ] as { id: OutcomesTab; label: string }[]
        ).map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 'var(--space-2) var(--space-4)',
              fontSize: '14px',
              fontWeight: tab === id ? 600 : 400,
              color: tab === id ? 'var(--ink)' : 'var(--text-muted)',
              borderBottom: tab === id ? '2px solid var(--ink)' : '2px solid transparent',
              marginBottom: '-1px',
              transition: 'all var(--transition-fast)',
              fontFamily: 'inherit',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'ledger' && <Ledger />}
      {tab === 'intelligence' && <ErrorIntelligence />}
      {tab === 'compare' && <Comparator />}
    </div>
  );
}
