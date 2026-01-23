import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LoginPage } from '@/features/auth'
import { DashboardPage } from '@/pages/DashboardPage'
import { CollectionsPage } from '@/pages/CollectionsPage'
import { MediaPage } from '@/pages/MediaPage'
import { UsersPage } from '@/pages/UsersPage'

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
          path: 'media',
          element: <MediaPage />,
        },
        {
          path: 'users',
          element: <UsersPage />,
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
