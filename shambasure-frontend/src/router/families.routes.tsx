// FILE: src/router/families.routes.tsx

import { RouteObject } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { FamiliesPage } from '../pages/FamiliesPage';
import { FamilyPage } from '../pages/FamilyPage';

// ============================================================================
// FAMILIES ROUTES
// ============================================================================

export const familiesRoutes: RouteObject[] = [
  {
    path: '/families',
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <FamiliesPage />,
      },
      {
        path: ':id',
        element: <FamilyPage />,
      },
    ],
  },
];