// FILE: src/router/wills.routes.tsx

import { RouteObject } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { WillsPage } from '../pages/WillsPage';
import { WillDetailPage } from '../pages/WillDetailPage';

// ============================================================================
// WILLS ROUTES
// ============================================================================

export const willsRoutes: RouteObject[] = [
  {
    path: '/wills',
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <WillsPage />,
      },
      {
        path: ':id',
        element: <WillDetailPage />,
      },
    ],
  },
];