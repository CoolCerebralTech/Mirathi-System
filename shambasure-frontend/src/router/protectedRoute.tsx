// FILE: src/router/ProtectedRoute.tsx

import * as React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import type { UserRole } from '../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProtectedRoute({ 
  children, 
  allowedRoles,
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const location = useLocation();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  // Show loading state while checking auth
  if (status === 'idle') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// ============================================================================
// ADMIN ROUTE GUARD
// ============================================================================

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      {children}
    </ProtectedRoute>
  );
}

// ============================================================================
// GUEST ROUTE (Only for unauthenticated users)
// ============================================================================

interface GuestRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function GuestRoute({ children, redirectTo = '/dashboard' }: GuestRouteProps) {
  const status = useAuthStore((state) => state.status);

  if (status === 'authenticated') {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}