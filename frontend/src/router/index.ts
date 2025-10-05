// src/router/index.tsx

import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '../components/layout/DashboardLayout'; // Import the layout

// Pages
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import ProfilePage from '../pages/ProfilePage';
import HomePage from '../pages/HomePage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import { AdminRoute } from './AdminRoute'; // Import the new guard
import AdminUsersPage from '../pages/AdminUsersPage'; // Import the new page
import { DocumentsPage } from '../pages/documents/DocumentsPage';
import { AssetsPage } from '../pages/assets/AssetsPage'; 
import { FamiliesPage } from '../pages/families/FamiliesPage';
import { FamilyDetailPage } from '../pages/families/FamilyDetailPage';
import { WillsPage } from '../pages/wills/WillsPage';
import { WillDetailPage } from '../pages/wills/WillDetailPage';

export const router = createBrowserRouter([
  // --- Public Routes ---
  { path: '/', element: <HomePage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> }, // Add this
  { path: '/reset-password', element: <ResetPasswordPage /> }, // Add this

  // --- Protected Routes ---
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      // --- Admin-Only Child Route ---
      {
        path: 'admin/users',
        element: (
          <AdminRoute> {/* Wrap the page with our new AdminRoute guard */}
            <AdminUsersPage />
          </AdminRoute>
        ),
      },
    ],
  },
]);