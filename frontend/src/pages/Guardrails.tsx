import { useState } from 'react';
import { GuardrailTracer } from './GuardrailTracer';
import { Policy } from './Policy';
import { PolicyAnalysis } from './PolicyAnalysis';

type GuardrailsTab = 'tracer' | 'policy' | 'analysis';

export function Guardrails() {
  const [tab, setTab] = useState<GuardrailsTab>('tracer');

  return (
    <div className="fade-in">
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 'var(--space-1)', marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--divider)', paddingBottom: '0' }}>
        {(
          [
            { id: 'tracer', label: 'Guardrail Tracer' },
            { id: 'policy', label: 'Policy Rules' },
            { id: 'analysis', label: 'Policy Analysis' },
          ] as { id: GuardrailsTab; label: string }[]
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
      {tab === 'tracer' && <GuardrailTracer />}
      {tab === 'policy' && <Policy />}
      {tab === 'analysis' && <PolicyAnalysis />}
    </div>
  );
}
