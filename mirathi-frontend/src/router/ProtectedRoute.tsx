// FILE: src/router/ProtectedRoute.tsx

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { 
  useAuthStore, 
  useCurrentUser 
} from '@/store/auth.store';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { UserRole } from '../types/shared.types';

// Define the expected shape of the location state
interface LocationState {
  from?: {
    pathname: string;
  };
}

/**
 * A route guard that renders its child routes (`<Outlet />`) only if the user is authenticated.
 * It also handles role-based access control and Onboarding checks.
 */
export function ProtectedRoute({ allowedRoles }: { allowedRoles?: UserRole[] }) {
  const { status, isLoading } = useAuthStore();
  const user = useCurrentUser();
  const location = useLocation();

  // 1. Loading Check
  // While SessionProvider is fetching the user, show a spinner or nothing.
  if (isLoading || status === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <LoadingSpinner size="lg" text="Verifying session..." />
      </div>
    );
  }

  // 2. Authentication Check
  if (status === 'unauthenticated' || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Onboarding Gate (Critical Fix)
  // If the user has not completed onboarding, force them to the /onboarding page.
  // We allow access if they are already on /onboarding to prevent loops.
  if (user.status === 'PENDING_ONBOARDING' && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // 4. Reverse Onboarding Gate
  // If the user IS active but tries to visit /onboarding manually, send them to dashboard.
  if (user.status === 'ACTIVE' && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  // 5. Account Status Check (Suspended/Archived)
  // If user is suspended, we might want to show a specific page or logout.
  // For now, we assume the backend session validation handles this, but strictly:
  if (user.status === 'SUSPENDED' || user.status === 'ARCHIVED') {
    // Ideally redirect to a "Contact Support" page or auto-logout
    // For now, redirecting to login cleans up the client state usually via the API 401 interceptor
    return <Navigate to="/login" replace />; 
  }

  // 6. Role Check (RBAC)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // 7. Allow Access
  return <Outlet />;
}

/**
 * A route guard that renders its child routes (`<Outlet />`) only if the user is NOT authenticated.
 * Used for pages like Login and Register to prevent logged-in users from seeing them.
 */
export function GuestRoute() {
  const { status, isLoading } = useAuthStore();
  const user = useCurrentUser();
  const location = useLocation();
  
  const state = location.state as LocationState | null;
  const from = state?.from?.pathname || '/dashboard';

  // Wait for session check
  if (isLoading || status === 'loading') {
    return null; 
  }

  // If authenticated, redirect away from Guest pages
  if (status === 'authenticated' && user) {
    // If they are pending onboarding, send them there instead of dashboard
    if (user.status === 'PENDING_ONBOARDING') {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}