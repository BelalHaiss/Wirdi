import { Navigate, createBrowserRouter } from 'react-router-dom';
import { LoginView } from '@/modules/auth';
import { UsersView, UserProfileView } from '@/modules/users';
import { LearnersView } from '@/modules/learners';
import { RouteErrorElement } from '@/modules/observability';
import { ProtectedLayout } from '@/components/ProtectedLayout';

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
        element: <LearnersView />,
      },
      {
        path: 'users',
        element: <UsersView />,
      },
      {
        path: 'learners',
        element: <LearnersView />,
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
