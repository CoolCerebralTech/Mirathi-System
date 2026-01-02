import { create } from 'zustand';
import type { UserOutput } from '../types/user.types';
import { usePersistentAuthStore } from './auth-persistent';
import { useSessionAuthStore } from './auth-session';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  isLoading: boolean;

  // Actions
  login: (
    data: { user: UserOutput; isAuthenticated?: boolean },
    _rememberMe?: boolean 
  ) => void;
  
  logout: () => void;
  setUser: (user: UserOutput) => void;
  setLoading: (v: boolean) => void;
  
  // Initialization
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  isLoading: true,

  // =================================================================
  // LOGIN ACTION
  // =================================================================
  login: ({ user }, rememberMe = true) => {
    // 1. Update UI Status
    set({ status: 'authenticated', isLoading: false });

    // 2. Route data to the correct store
    // Note: We only store the User Profile for UI display.
    // The actual "Session" is held by the HttpOnly cookie in the browser.
    if (rememberMe) {
      // Save to LocalStorage
      usePersistentAuthStore.getState().setAuth({ user, isAuthenticated: true });
      // Clear Session (to avoid duplicates)
      useSessionAuthStore.getState().resetAuth();
    } else {
      // Save to Memory Only
      useSessionAuthStore.getState().setAuth({ user, isAuthenticated: true });
      // Clear Persistent
      usePersistentAuthStore.getState().resetAuth();
    }
  },

  // =================================================================
  // LOGOUT ACTION
  // =================================================================
  logout: () => {
    set({ status: 'unauthenticated' });
    // Clear BOTH stores
    usePersistentAuthStore.getState().resetAuth();
    useSessionAuthStore.getState().resetAuth();
    
    // Clear localStorage key entirely to be safe
    try {
      localStorage.removeItem('shamba-sure-auth');
    } catch (e) { console.error(e) }
  },

  // =================================================================
  // UPDATE USER (Profile Updates)
  // =================================================================
  setUser: (user) => {
    // Check which store is currently active and update it
    const pStore = usePersistentAuthStore.getState();
    const sStore = useSessionAuthStore.getState();

    if (pStore.isAuthenticated) {
      pStore.setAuth({ user });
    } else if (sStore.isAuthenticated) {
      sStore.setAuth({ user });
    }
  },

  setLoading: (v) => set({ isLoading: v }),

  // =================================================================
  // HYDRATION (Startup Check)
  // =================================================================
  hydrate: () => {
    const pAuth = usePersistentAuthStore.getState().isAuthenticated;
    const sAuth = useSessionAuthStore.getState().isAuthenticated;

    if (pAuth || sAuth) {
      set({ status: 'authenticated', isLoading: false });
    } else {
      set({ status: 'unauthenticated', isLoading: false });
    }
  },
}));

// ============================================================================
// UNIFIED SELECTORS
// ============================================================================

export const useCurrentUser = () => {
  const pUser = usePersistentAuthStore((s) => s.user);
  const sUser = useSessionAuthStore((s) => s.user);
  return pUser || sUser;
};

export const useAuthStatus = () => useAuthStore((s) => s.status);
export const useIsAuthLoading = () => useAuthStore((s) => s.isLoading);
export const useIsAuthenticated = () => {
    const status = useAuthStatus();
    return status === 'authenticated';
}

// Action exports
export const useAuthActions = () => useAuthStore((state) => ({
  login: state.login,
  logout: state.logout,
  setUser: state.setUser,
  setLoading: state.setLoading,
  hydrate: state.hydrate
}));

// Note: getAccessToken/getRefreshToken removed as they are no longer accessible
// via JavaScript (HttpOnly cookies).