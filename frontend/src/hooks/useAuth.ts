// src/hooks/useAuth.ts
// ============================================================================
// Custom Hook for Authentication State
// ============================================================================
// - Provides a clean, reusable interface to access the global auth state
//   from the Zustand store.
// - Abstracting this into a hook simplifies components and centralizes the
//   way we interact with authentication data.
// - It returns the essential pieces of state (user, isAuthenticated) and
//   all available actions (setAuth, logout).
// ============================================================================

import { useAuthStore } from '../store/auth.store';

export const useAuth = () => {
  // Select the state and actions from the store
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const actions = useAuthStore((state) => state.actions);

  return {
    user,
    isAuthenticated,
    actions,
  };
};