// src/router/AdminRoute.tsx
// ============================================================================
// Admin-Only Protected Route Component
// ============================================================================
// - A specialized route guard that ensures only users with the 'ADMIN' role
//   can access a specific route.
// - It first verifies if the user is authenticated.
// - If authenticated, it then checks the user's role from the `useAuthStore`.
// - If the user is not an admin, they are redirected to the main dashboard,
//   preventing unauthorized access to sensitive admin areas.
// ============================================================================

import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const AdminRoute = ({ children }: AdminRouteProps) => {
  // 1. Get the full user object from our global store.
  const user = useAuthStore((state) => state.user);

  // 2. Check if the user is authenticated AND has the 'ADMIN' role.
  const isAdmin = user?.role === 'ADMIN';

  // 3. If the user is not an admin, redirect them to the dashboard.
  //    This provides a better user experience than showing an error page.
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // 4. If they are an admin, render the requested admin page.
  return <>{children}</>;
};