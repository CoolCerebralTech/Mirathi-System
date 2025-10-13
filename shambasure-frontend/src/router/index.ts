// FILE: src/router/index.tsx

import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PublicLayout } from '../components/layout/PublicLayout';
import { AuthLayout } from '../components/layout/AuthLayout';

// Import route modules
import { adminRoutes } from './admin.routes';
import { documentsRoutes } from './documents.routes';
import { assetsRoutes } from './assets.routes';
import { willsRoutes } from './wills.routes';
import { familiesRoutes } from './families.routes';

// Auth pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';

// User pages
import { DashboardHomePage } from '../pages/DashboardHomePage';
import { ProfilePage } from '../pages/ProfilePage';
import { SettingsPage } from '../pages/SettingsPage';

// Public pages
import { HomePage } from '../pages/public/HomePage';
import { FeaturesPage } from '../pages/public/FeaturesPage';
import { PricingPage } from '../pages/public/PricingPage';
import { AboutPage } from '../pages/public/AboutPage';
import { ContactPage } from '../pages/public/ContactPage';

// Error pages
import { NotFoundPage } from '../pages/NotFoundPage';

// ============================================================================
// ROUTER CONFIGURATION
// ============================================================================

export const router = createBrowserRouter([
  // ============================================================================
  // PUBLIC ROUTES
  // ============================================================================
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'features',
        element: <FeaturesPage />,
      },
      {
        path: 'pricing',
        element: <PricingPage />,
      },
      {
        path: 'about',
        element: <AboutPage />,
      },
      {
        path: 'contact',
        element: <ContactPage />,
      },
    ],
  },

  // ============================================================================
  // AUTH ROUTES (With AuthLayout)
  // ============================================================================
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: 'reset-password',
        element: <ResetPasswordPage />,
      },
    ],
  },

  // ============================================================================
  // AUTHENTICATED USER ROUTES
  // ============================================================================
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <DashboardHomePage />,
      },
    ],
  },

  {
    path: '/profile',
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <ProfilePage />,
      },
    ],
  },

  {
    path: '/settings',
    element: <DashboardLayout />,
    children: [
      {
        index: true,
        element: <SettingsPage />,
      },
    ],
  },

  // ============================================================================
  // FEATURE ROUTES (Spread individual route modules)
  // ============================================================================
  
  // Admin Routes
  ...adminRoutes,

  // Documents Routes
  ...documentsRoutes,

  // Assets Routes
  ...assetsRoutes,

  // Wills Routes
  ...willsRoutes,

  // Families Routes
  ...familiesRoutes,

  // ============================================================================
  // ERROR ROUTES
  // ============================================================================
  {
    path: '/404',
    element: <NotFoundPage />,
  },
  {
    path: '*',
    element: <Navigate to="/404" replace />,
  },
]);

// ============================================================================
// EXPORTS
// ============================================================================

export default router;