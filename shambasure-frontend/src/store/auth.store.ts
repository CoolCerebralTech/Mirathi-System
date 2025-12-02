// FILE: src/store/auth.store.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserResponse as User } from '../types/user.types';

// ============================================================================
// STATE & ACTION INTERFACE
// ============================================================================

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: AuthStatus;
  isLoading: boolean;

  login: (
    data: { user: User; accessToken: string; refreshToken: string },
    rememberMe?: boolean,
  ) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  setLoading: (isLoading: boolean) => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: Pick<AuthState, 'user' | 'accessToken' | 'refreshToken' | 'status' | 'isLoading'> = {
  user: null,
  accessToken: null,
  refreshToken: null,
  status: 'loading', // Start loading while we check storage
  isLoading: false,
};

// ============================================================================
// AUTH STORE
// ============================================================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      login: ({ user, accessToken, refreshToken }) => {
        set({
          user,
          accessToken,
          refreshToken,
          status: 'authenticated',
          isLoading: false,
        });
      },

      logout: () => {
        // Clear everything
        set({
          ...initialState,
          status: 'unauthenticated',
        });
        
        // Force clear local storage just in case
        localStorage.removeItem('shamba-sure-auth');
      },

      setUser: (user) => {
        const currentState = get();
        if (currentState.status === 'authenticated') {
          set({ user });
        }
      },

      setTokens: ({ accessToken, refreshToken }) => {
        set({ accessToken, refreshToken });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },
    }),
    {
      name: 'shamba-sure-auth', // Key in localStorage
      storage: createJSONStorage(() => localStorage), // Keep it simple: use localStorage
      
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),

      // --- HYDRATION FIX ---
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        // If we have a refresh token, we assume we are authenticated.
        // The API Client will handle 401s if the token is actually invalid.
        if (state.refreshToken && state.user) {
          state.status = 'authenticated';
        } else {
          state.status = 'unauthenticated';
        }
        
        state.isLoading = false;
      },
    },
  ),
);

// ============================================================================
// SELECTORS
// ============================================================================

export const useCurrentUser = () => useAuthStore((state) => state.user);
export const useAuthStatus = () => useAuthStore((state) => state.status);
export const useIsAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useIsAuthenticated = () => useAuthStore((state) => state.status === 'authenticated');
export const useAccessToken = () => useAuthStore((state) => state.accessToken);
export const useRefreshToken = () => useAuthStore((state) => state.refreshToken);

export const useAuthActions = () =>
  useAuthStore((state) => ({
    login: state.login,
    logout: state.logout,
    setUser: state.setUser,
    setTokens: state.setTokens,
    setLoading: state.setLoading,
  }));