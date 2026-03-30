import { Navigate, createBrowserRouter } from 'react-router-dom';
import { LoginView } from '@/modules/auth';
import { UsersView, UserProfileView } from '@/modules/users';
import { LearnersView } from '@/modules/learners';
import { GroupsView, GroupDetailView } from '@/modules/groups';
import { RouteErrorElement } from '@/modules/observability';
import { ProtectedLayout } from '@/components/ProtectedLayout';
import { withRole } from '@/hoc/withRole';

const ProtectedUsersView = withRole(UsersView, ['ADMIN', 'MODERATOR']);
const ProtectedLearnersView = withRole(LearnersView, ['ADMIN', 'MODERATOR']);

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginView />,
    errorElement: <RouteErrorElement />,
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    errorElement: <RouteErrorElement />,
    children: [
      {
        index: true,
        element: <GroupsView />,
      },
      {
        path: 'users',
        element: <ProtectedUsersView />,
      },
      {
        path: 'learners',
        element: <ProtectedLearnersView />,
      },
      {
        path: 'groups',
        element: <GroupsView />,
      },
      {
        path: 'groups/:id',
        element: <GroupDetailView />,
      },
      {
        path: 'profile',
        element: <UserProfileView />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to='/' replace />,
  },
]);
