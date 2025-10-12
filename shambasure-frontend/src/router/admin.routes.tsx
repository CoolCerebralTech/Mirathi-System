// FILE: src/router/admin.routes.tsx

import { RouteObject } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';

// Admin Pages
import { DashboardPage } from '../pages/admin/DashboardPage';
import { UsersPage } from '../pages/admin/UsersPage';
import { LogsPage } from '../pages/admin/LogsPage';
import { TemplatesPage } from '../pages/admin/TemplatesPage';
import { DocumentsPage } from '../pages/admin/DocumentsPage';

// ============================================================================
// ADMIN ROUTES
// ============================================================================

export const adminRoutes: RouteObject[] = [
  {
    path: '/admin',
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'users',
        element: <UsersPage />,
      },
      {
        path: 'logs',
        element: <LogsPage />,
      },
      {
        path: 'templates',
        element: <TemplatesPage />,
      },
      {
        path: 'documents',
        element: <DocumentsPage />,
      },
    ],
  },
];