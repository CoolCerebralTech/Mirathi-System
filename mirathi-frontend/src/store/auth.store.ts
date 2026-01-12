import { create } from 'zustand';
import type { UserResponse as User } from '@/types/user.types';
import { usePersistentAuthStore } from './auth-persistent';
import { useSessionAuthStore } from './auth-session';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  isLoading: boolean;

  // Actions
  login: (
    data: { user: User; accessToken: string; refreshToken: string },
    _rememberMe?: boolean // Underscore to ignore unused warning if logic dictates
  ) => void;
  
  logout: () => void;
  setUser: (user: User) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
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
  login: ({ user, accessToken, refreshToken }, rememberMe = true) => {
    // 1. Update UI Status
    set({ status: 'authenticated', isLoading: false });

    // 2. Route data to the correct store
    if (rememberMe) {
      // Save to LocalStorage
      usePersistentAuthStore.getState().setAuth({ user, accessToken, refreshToken });
      // Clear Session (to avoid duplicates)
      useSessionAuthStore.getState().resetAuth();
    } else {
      // Save to Memory Only
      useSessionAuthStore.getState().setAuth({ user, accessToken, refreshToken });
      // Clear Persistent
      usePersistentAuthStore.getState().resetAuth();
    }
  },

  // =================================================================
  // LOGOUT ACTION
  // =================================================================
  logout: () => {
    set({ status: 'unauthenticated' });
    // Clear BOTH stores to be safe
    usePersistentAuthStore.getState().resetAuth();
    useSessionAuthStore.getState().resetAuth();
    
    try {
      localStorage.removeItem('shamba-sure-auth');
    } catch (e) { console.error(e) }
  },

  // =================================================================
  // UPDATE USER (Profile Updates)
  // =================================================================
  setUser: (user) => {
    // We need to check which store is currently active and update that one
    const pStore = usePersistentAuthStore.getState();
    const sStore = useSessionAuthStore.getState();

    if (pStore.accessToken) {
      pStore.setAuth({ user });
    } else if (sStore.accessToken) {
      sStore.setAuth({ user });
    }
  },

  // =================================================================
  // UPDATE TOKENS (Refreshes)
  // =================================================================
  setTokens: ({ accessToken, refreshToken }) => {
    const pStore = usePersistentAuthStore.getState();
    const sStore = useSessionAuthStore.getState();

    if (pStore.accessToken) {
      pStore.setAuth({ accessToken, refreshToken });
    } else if (sStore.accessToken) {
      sStore.setAuth({ accessToken, refreshToken });
    }
  },

  setLoading: (v) => set({ isLoading: v }),

  // =================================================================
  // HYDRATION (Startup Check)
  // =================================================================
  hydrate: () => {
    const pUser = usePersistentAuthStore.getState().user;
    const sUser = useSessionAuthStore.getState().user;

    if (pUser || sUser) {
      set({ status: 'authenticated', isLoading: false });
    } else {
      set({ status: 'unauthenticated', isLoading: false });
    }
  },
}));

// ============================================================================
// UNIFIED SELECTORS (The "Magic" Part)
// ============================================================================
// These hooks automatically look in BOTH stores.
// This allows your components to just say "give me the token" without caring about storage.

export const useAccessToken = () => {
  const pToken = usePersistentAuthStore((s) => s.accessToken);
  const sToken = useSessionAuthStore((s) => s.accessToken);
  return pToken || sToken;
};

export const useRefreshToken = () => {
  const pToken = usePersistentAuthStore((s) => s.refreshToken);
  const sToken = useSessionAuthStore((s) => s.refreshToken);
  return pToken || sToken;
};

export const useCurrentUser = () => {
  const pUser = usePersistentAuthStore((s) => s.user);
  const sUser = useSessionAuthStore((s) => s.user);
  return pUser || sUser;
};

export const useAuthStatus = () => useAuthStore((s) => s.status);
export const useIsAuthLoading = () => useAuthStore((s) => s.isLoading);

// Action exports
export const useAuthActions = () => useAuthStore((state) => ({
  login: state.login,
  logout: state.logout,
  setUser: state.setUser,
  setTokens: state.setTokens,
  setLoading: state.setLoading,
  hydrate: state.hydrate
}));

export const getAccessToken = () => {
  return usePersistentAuthStore.getState().accessToken || useSessionAuthStore.getState().accessToken;
};

export const getRefreshToken = () => {
  return usePersistentAuthStore.getState().refreshToken || useSessionAuthStore.getState().refreshToken;
};
