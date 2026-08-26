
import { PageHeader } from '../components/PageHeader';
import { Link } from 'react-router-dom';

export function HowItWorks() {
  return (
    <div className="fade-in">
      <PageHeader 
        title="How It Works" 
        description="An editorial explanation of the product flow and safety model."
      />
      <div className="panel" style={{ maxWidth: '800px' }}>
        <h2 className="title-section" style={{ marginBottom: 'var(--space-4)' }}>The Recovery Flow</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: 'var(--space-2)' }}>1. Agent Proposal</h3>
            <p className="text-secondary">
              When a checkout fails, the Recovery Agent analyzes the payload and proposes a recovery action (e.g., `retry`, `nudge`, or `abstain`).
            </p>
          </div>
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: 'var(--space-2)' }}>2. Deterministic Guardrails</h3>
            <p className="text-secondary">
              The agent's proposal is intercepted by strict deterministic guardrails. These rules evaluate the context against safety invariant bounds. If any rule fails, the action is forcefully overridden to `abstain`.
            </p>
          </div>
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: 'var(--space-2)' }}>3. One Controlled Action</h3>
            <p className="text-secondary">
              If guardrails pass, the single approved action is executed. The system never executes loops or multiple automated attempts.
            </p>
          </div>
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: 'var(--space-2)' }}>4. Outcomes</h3>
            <p className="text-secondary">
              The final outcome is recorded immutably with a clear provenance label (Verified Sandbox, Simulated, or Guardrail Abstained).
            </p>
          </div>
        </div>
        
        <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--divider)' }}>
          <Link to="/" className="btn btn-secondary">
            View visual storyboard
          </Link>
        </div>
      </div>
    </div>
  );
}
