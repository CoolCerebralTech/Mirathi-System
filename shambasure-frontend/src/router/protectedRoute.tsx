// FILE: src/router/ProtectedRoute.tsx

import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { DashboardLayout } from '../components/layouts/DashboardLayout';

/**
 * This component protects routes that require a user to be authenticated.
 * It renders the full DashboardLayout and the page content via <Outlet />.
 * If the user is not authenticated, it redirects them to the /login page.
 */
export function ProtectedRoute() {
  const { status } = useAuthStore();
  const isAuthenticated = status === 'authenticated';

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to. This allows us to redirect them back to that page after they log in.
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the main DashboardLayout which contains its own <Outlet />
  // for the specific page content.
  return <DashboardLayout />;
}