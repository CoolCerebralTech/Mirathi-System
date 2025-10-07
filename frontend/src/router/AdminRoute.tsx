// FILE: src/router/AdminRoute.tsx

import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { UserRoleSchema } from '../types'; // Import our Zod enum for type safety

/**
 * This component protects routes that require a user to be an ADMIN.
 * It checks for authentication first, then checks the user's role.
 * If either check fails, it redirects the user appropriately.
 */
export function AdminRoute() {
  const { status, user } = useAuthStore();
  const isAuthenticated = status === 'authenticated';
  const isAdmin = user?.role === UserRoleSchema.enum.ADMIN;

  if (!isAuthenticated) {
    // If not logged in at all, redirect to the login page.
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    // If logged in but NOT an admin, redirect to their main dashboard.
    // This prevents regular users from even seeing a "not found" page for admin routes.
    return <Navigate to="/dashboard" replace />;
  }

  // If authenticated AND an admin, render the requested admin page via <Outlet />.
  // It will be rendered within the DashboardLayout because of how our router is structured.
  return <Outlet />;
}