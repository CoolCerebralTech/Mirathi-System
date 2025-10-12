// FILE: src/router/ProtectedRoute.tsx

import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStatus, useCurrentUser } from '../store/auth.store';
import { UserRole } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const status = useAuthStatus();
  const user = useCurrentUser();
  const location = useLocation();

  // 1. While the store is rehydrating, show a loading state.
  // This prevents a "flash" of the login page for an already authenticated user.
  if (status === 'idle') {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // 2. If the user is not authenticated, redirect them to the login page.
  // We pass the current location in `state` so we can redirect them back after login.
  if (status !== 'authenticated' || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. If the route requires specific roles, check if the user has one.
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // The user is logged in but doesn't have the required permission.
    // Redirect to a dedicated "Unauthorized" page.
    return <Navigate to="/unauthorized" replace />;
  }

  // 4. If all checks pass, render the nested child routes.
  return <Outlet />;
}