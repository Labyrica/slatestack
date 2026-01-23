import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { LoginPage } from '@/features/auth'
import { DashboardPage } from '@/features/dashboard'
import { CollectionsPage } from '@/features/collections'
import { EntriesPage } from '@/features/entries'
import { MediaPage } from '@/features/media'
import { MetricsPage } from '@/features/metrics'
import { UsersPage } from '@/features/users'

const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <LoginPage />,
    },
    {
      path: '/',
      element: <ProtectedRoute />,
      children: [
        {
          index: true,
          element: <DashboardPage />,
        },
        {
          path: 'collections',
          element: <CollectionsPage />,
        },
        {
          path: 'collections/:collectionId/entries',
          element: <EntriesPage />,
        },
        {
          path: 'media',
          element: <MediaPage />,
        },
        {
          path: 'metrics',
          element: <MetricsPage />,
        },
        {
          path: 'users',
          element: (
            <AdminRoute>
              <UsersPage />
            </AdminRoute>
          ),
        },
      ],
    },
  ],
  {
    basename: '/admin',
  }
)

function App() {
  return <RouterProvider router={router} />
}

export default App
