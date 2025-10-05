// src/router/ProtectedRoute.tsx
// ============================================================================
// Protected Route Component
// ============================================================================
// - Acts as a gatekeeper for routes that require authentication.
// - It wraps around a page component (passed as `children`).
// - It checks the global `useAuthStore` for the user's authentication status.
// - If the user is authenticated, it renders the requested page.
// - If the user is NOT authenticated, it redirects them to the /login page,
//   preserving the location they were trying to access, so they can be
//   redirected back after a successful login.
// ============================================================================

import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  // 1. Get the authentication status from our global store.
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  // 2. Check if the user is authenticated.
  if (!isAuthenticated) {
    // 3. If not, redirect them to the login page.
    //    - `replace` prevents the user from using the "back" button to return
    //      to the protected route they were just kicked out of.
    //    - `state` stores the original path they tried to visit, so we can
    //      send them there after they log in.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 4. If they are authenticated, render the page they requested.
  return <>{children}</>;
};