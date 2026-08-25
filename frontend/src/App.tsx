import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Overview } from './pages/Overview';
import { Queue } from './pages/Queue';
import { SessionDetail } from './pages/SessionDetail';
import { AuditLog } from './pages/AuditLog';
import { Replay } from './pages/Replay';
import { Policy } from './pages/Policy';
import { ErrorIntelligence } from './pages/ErrorIntelligence';
import { Architecture } from './pages/Architecture';
import { GuardrailTracer } from './pages/GuardrailTracer';
import { PolicyAnalysis } from './pages/PolicyAnalysis';
import { Comparator } from './pages/Comparator';
import { Ledger } from './pages/Ledger';
import { Story } from './pages/Story';
import { Lab } from './pages/Lab';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/recovery-queue" element={<Queue />} />
          <Route path="/lab" element={<Lab />} />
          <Route path="/sessions/:id" element={<SessionDetail />} />
          <Route path="/replay/:id" element={<Replay />} />
          <Route path="/error-intelligence" element={<ErrorIntelligence />} />
          <Route path="/policy" element={<Policy />} />
          <Route path="/guardrail-tracer" element={<GuardrailTracer />} />
          <Route path="/policy-analysis" element={<PolicyAnalysis />} />
          <Route path="/compare" element={<Comparator />} />
          <Route path="/ledger" element={<Ledger />} />
          <Route path="/story" element={<Story />} />
          <Route path="/architecture" element={<Architecture />} />
          <Route path="/audit-log" element={<AuditLog />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
