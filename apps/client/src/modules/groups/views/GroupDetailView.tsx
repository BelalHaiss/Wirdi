import { lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';

const AdminGroupDetailView = lazy(() => import('./AdminGroupDetailView'));
const LearnerGroupDetailView = lazy(() => import('./LearnerGroupDetailView'));

export default function GroupDetailView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useApp();

  return (
    <Suspense
      fallback={
        <div className='flex items-center justify-center py-20 text-muted-foreground gap-2'>
          <Loader2 className='h-5 w-5 animate-spin' />
        </div>
      }
    >
      {user?.role === 'STUDENT' ? (
        <LearnerGroupDetailView groupId={id!} />
      ) : (
        <AdminGroupDetailView groupId={id!} />
      )}
    </Suspense>
  );
}
