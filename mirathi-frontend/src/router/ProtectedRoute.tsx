// FILE: src/router/ProtectedRoute.tsx

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import type { UserRole } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

/**
 * A route guard that renders its child routes (`<Outlet />`) only if the user is authenticated.
 * It also handles role-based access control.
 */
export function ProtectedRoute({ allowedRoles }: { allowedRoles?: UserRole[] }) {
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (status === 'loading') {
    return <div className="flex h-screen w-full items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles are specified, check if the user has one of them
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to the main dashboard if role is not authorized
    return <Navigate to="/dashboard" replace />;
  }

  // If all checks pass, render the nested routes
  return <Outlet />;
}

/**
 * A route guard that renders its child routes (`<Outlet />`) only if the user is NOT authenticated.
 * Used for pages like Login and Register.
 */
export function GuestRoute() {
  const status = useAuthStore((state) => state.status);

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}