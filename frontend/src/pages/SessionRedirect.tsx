import { useParams, Navigate } from 'react-router-dom';

/** Compatibility wrapper: /sessions/:id → /replay/:id */
export function SessionRedirect() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/recovery-queue" replace />;
  return <Navigate to={`/replay/${id}`} replace />;
}
