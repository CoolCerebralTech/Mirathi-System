// FILE: src/router/ProtectedRoute.tsx

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { 
  useAuthStatus, 
  useCurrentUser 
} from '../store/auth.store';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import type { UserRole } from '../types/shared.types';

interface LocationState {
  from?: {
    pathname: string;
  };
}

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: UserRole[] }) {
  const status = useAuthStatus();
  const user = useCurrentUser();
  const location = useLocation();

  // 1. Loading Check
  if (status === 'loading') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" text="Verifying session..." />
      </div>
    );
  }

  // 2. Authentication Check
  if (status === 'unauthenticated' || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Active Status Check
  // We only check isActive because isDeleted is not in the frontend type definition
  if (!user.isActive) {
    return <Navigate to="/login" replace />;
  }

  // 4. Role Check (RBAC)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // 5. Allow Access
  return <Outlet />;
}

export function GuestRoute() {
  const status = useAuthStatus();
  const location = useLocation();
  
  const state = location.state as LocationState | null;
  const from = state?.from?.pathname || '/dashboard';

  if (status === 'authenticated') {
    return <Navigate to={from} replace />;
  }

  return <Outlet />;
}