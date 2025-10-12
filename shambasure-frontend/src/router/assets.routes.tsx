// FILE: src/router/assets.routes.tsx

import { RouteObject } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { AssetsPage } from '../pages/AssetsPage';

// ============================================================================
// ASSETS ROUTES
// ============================================================================

export const assetsRoutes: RouteObject[] = [
  {
    path: '/assets',
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <AssetsPage />,
      },
    ],
  },
];