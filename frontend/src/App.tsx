import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Overview } from './pages/Overview';
import { Queue } from './pages/Queue';
import { SessionDetail } from './pages/SessionDetail';
import { AuditLog } from './pages/AuditLog';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/recovery-queue" element={<Queue />} />
          <Route path="/sessions/:id" element={<SessionDetail />} />
          <Route path="/audit-log" element={<AuditLog />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
