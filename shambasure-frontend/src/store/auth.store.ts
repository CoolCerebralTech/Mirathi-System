// FILE: src/store/auth.store.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../types'; 

// ============================================================================
// STATE & ACTION INTERFACE
// ============================================================================

export type AuthStatus = 'idle' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: AuthStatus;
  actions: {
    login: (data: { user: User; accessToken: string; refreshToken: string }) => void;
    logout: () => void;
    setUser: (user: User) => void;
    setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
    setStatus: (status: AuthStatus) => void;
  };
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  status: 'idle' as AuthStatus, // Start in 'idle' to handle hydration
};

// ============================================================================
// AUTH STORE
// ============================================================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,
      actions: {
        login: (data) => {
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            status: 'authenticated',
          });
        },
        logout: () => {
          // ARCHITECTURAL UPGRADE: Resetting to initial state is cleaner.
          // The persist middleware will handle clearing the storage.
          set(initialState);
          // Immediately set status to unauthenticated for instant UI feedback.
          set({ status: 'unauthenticated' });
        },
        setUser: (user) => {
          // This logic is good, only update if authenticated.
          if (get().status === 'authenticated') {
            set({ user });
          }
        },
        // BUG FIX: The signature now matches what the apiClient expects.
        setTokens: ({ accessToken, refreshToken }) => {
          set({ accessToken, refreshToken });
        },
        setStatus: (status) => {
          set({ status });
        },
      },
    }),
    {
      name: 'shamba-sure-auth-session',
      // ARCHITECTURAL UPGRADE: Allow dynamic storage
      storage: createJSONStorage(() => {
        // Check a flag in localStorage to decide which storage to use.
        const storageType = localStorage.getItem('shamba-sure-storage-type');
        return storageType === 'local' ? localStorage : sessionStorage;
      }),
        partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      // SIMPLIFICATION: Removed complex onRehydrateStorage.
      // The initial status check is now handled gracefully in the UI layer (see App.tsx example).
    }
  )
);

// ============================================================================
// SELECTORS & CONVENIENCE HOOKS
// ============================================================================

// Selectors for state data
export const useCurrentUser = () => useAuthStore((state) => state.user);
export const useAuthStatus = () => useAuthStore((state) => state.status);
export const useIsAuthenticated = () => useAuthStore((state) => state.status === 'authenticated');

// A dedicated hook for actions prevents components from re-rendering when state changes.
export const useAuthActions = () => useAuthStore((state) => state.actions);
