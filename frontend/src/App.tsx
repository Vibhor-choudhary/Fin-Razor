import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
// Primary pages
import { Story } from './pages/Story';
import { Overview } from './pages/Overview';
import { Queue } from './pages/Queue';
import { Replay } from './pages/Replay';
import { Lab } from './pages/Lab';
import { AuditLog } from './pages/AuditLog';
import { Guardrails } from './pages/Guardrails';
import { Outcomes } from './pages/Outcomes';
import { HowItWorks } from './pages/HowItWorks';
import { Architecture } from './pages/Architecture';
// Redirect helpers
import { SessionRedirect } from './pages/SessionRedirect';
import { ReplayRedirect } from './pages/ReplayRedirect';
// Legacy standalone pages (kept for direct access/compatibility)
import { GuardrailTracer } from './pages/GuardrailTracer';
import { Policy } from './pages/Policy';
import { PolicyAnalysis } from './pages/PolicyAnalysis';
import { ErrorIntelligence } from './pages/ErrorIntelligence';
import { Ledger } from './pages/Ledger';
import { Comparator } from './pages/Comparator';
import { SessionDetail } from './pages/SessionDetail';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* ── Primary routes ───────────────────────────────────────── */}
          <Route path="/" element={<Story />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/recovery-queue" element={<Queue />} />
          <Route path="/replay" element={<ReplayRedirect />} />
          <Route path="/replay/:id" element={<Replay />} />
          <Route path="/lab" element={<Lab />} />
          <Route path="/decisions" element={<AuditLog />} />
          <Route path="/guardrails" element={<Guardrails />} />
          <Route path="/outcomes" element={<Outcomes />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/architecture" element={<Architecture />} />

          {/* ── Legacy redirects ─────────────────────────────────────── */}
          <Route path="/story" element={<Navigate to="/" replace />} />
          <Route path="/sessions/:id" element={<SessionRedirect />} />
          <Route path="/audit-log" element={<Navigate to="/decisions" replace />} />
          <Route path="/guardrail-tracer" element={<Navigate to="/guardrails" replace />} />
          <Route path="/policy" element={<Navigate to="/guardrails" replace />} />
          <Route path="/policy-analysis" element={<Navigate to="/guardrails" replace />} />
          <Route path="/error-intelligence" element={<Navigate to="/outcomes" replace />} />
          <Route path="/ledger" element={<Navigate to="/outcomes" replace />} />
          <Route path="/compare" element={<Navigate to="/outcomes" replace />} />

          {/* ── Preserved standalone (still importable for deep links) ── */}
          {/* These render their own component; no redirect needed         */}
          <Route path="/_guardrail-tracer" element={<GuardrailTracer />} />
          <Route path="/_policy" element={<Policy />} />
          <Route path="/_policy-analysis" element={<PolicyAnalysis />} />
          <Route path="/_error-intelligence" element={<ErrorIntelligence />} />
          <Route path="/_ledger" element={<Ledger />} />
          <Route path="/_compare" element={<Comparator />} />
          <Route path="/_sessions/:id" element={<SessionDetail />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

