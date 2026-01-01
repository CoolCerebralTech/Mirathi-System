// FILE: src/router/ProtectedRoute.tsx

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { 
  useAuthStatus, 
  useCurrentUser 
} from '../store/auth.store';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { UserRole } from '../types/shared.types';

// Define the expected shape of the location state
interface LocationState {
  from?: {
    pathname: string;
  };
}

/**
 * A route guard that renders its child routes (`<Outlet />`) only if the user is authenticated.
 * It also handles role-based access control and verification checks.
 */
export function ProtectedRoute({ allowedRoles }: { allowedRoles?: UserRole[] }) {
  const status = useAuthStatus();
  const user = useCurrentUser();
  const location = useLocation();

  // 1. Loading Check
  if (status === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <LoadingSpinner size="lg" text="Verifying session..." />
      </div>
    );
  }

  // 2. Authentication Check
  if (status === 'unauthenticated' || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Verification Check
  // If the user is logged in but not active/verified, force them to the verification page.
  // We check location.pathname to avoid infinite redirect loops if they are already there.
  if (
    (!user.isActive || user.deletedAt) && 
    location.pathname !== '/pending-verification'
  ) {
    return <Navigate to="/pending-verification" replace />;
  }

  // 4. Role Check (RBAC)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the main dashboard if role is not authorized
    return <Navigate to="/dashboard" replace />;
  }

  // 5. Allow Access
  return <Outlet />;
}

/**
 * A route guard that renders its child routes (`<Outlet />`) only if the user is NOT authenticated.
 * Used for pages like Login and Register.
 */
export function GuestRoute() {
  const status = useAuthStatus();
  const location = useLocation();
  
  // FIX: Type the state variable safely instead of using 'any'
  const state = location.state as LocationState | null;
  const from = state?.from?.pathname || '/dashboard';

  if (status === 'authenticated') {
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}