import { useApp } from '@/contexts/AppContext';
import { LearnerRequestsView } from './LearnerRequestsView';
import { AdminRequestsView } from './AdminRequestsView';

export function RequestsView() {
  const { user } = useApp();

  if (!user) return null;

  return user.role === 'STUDENT' ? <LearnerRequestsView /> : <AdminRequestsView />;
}
