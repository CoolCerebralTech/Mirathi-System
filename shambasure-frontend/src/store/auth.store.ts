// FILE: src/store/auth.store.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Authentication status states
 */
export type AuthStatus = 'idle' | 'authenticated' | 'unauthenticated';

/**
 * The shape of our authentication state
 */
type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: AuthStatus;
};

/**
 * Actions that can modify the authentication state
 */
type AuthActions = {
  login: (data: { user: User; accessToken: string; refreshToken: string }) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  hydrate: () => void;
};

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  status: 'idle',
};

// ============================================================================
// AUTH STORE
// ============================================================================

/**
 * Zustand store for authentication state management
 * 
 * This store handles ONLY authentication state (user, tokens, status).
 * For data fetching and caching, we use TanStack Query (React Query).
 * 
 * Why this separation?
 * - Zustand: Client-side state (auth, UI preferences)
 * - TanStack Query: Server state (API data, caching, refetching)
 */
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      // --- INITIAL STATE ---
      ...initialState,

      // --- ACTIONS ---

      /**
       * Sets authentication data after successful login/register
       */
      login: (data) => {
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          status: 'authenticated',
        });
      },

      /**
       * Clears all authentication data and logs out the user
       */
      logout: () => {
        set(initialState);
        set({ status: 'unauthenticated' });
        
        // Clear persisted storage
        localStorage.removeItem('shamba-sure-auth-session');
        
        // Optional: Clear TanStack Query cache on logout
        // queryClient.clear();
      },

      /**
       * Updates the user object (e.g., after profile update)
       * Only updates if user is currently authenticated
       */
      setUser: (user) => {
        const { status } = get();
        if (status === 'authenticated') {
          set({ user });
        }
      },

      /**
       * Updates tokens (used by token refresh interceptor)
       */
      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
      },

      /**
       * Clears authentication state without changing status
       * Useful for cleanup operations
       */
      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
        });
      },

      /**
       * Manually triggers hydration from storage
       * Useful after app initialization
       */
      hydrate: () => {
        const { accessToken, user } = get();
        if (accessToken && user) {
          set({ status: 'authenticated' });
        } else {
          set({ status: 'unauthenticated' });
        }
      },
    }),
    {
      name: 'shamba-sure-auth-session',
      storage: createJSONStorage(() => localStorage),
      
      // Only persist these fields
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        status: state.status,
      }),

      // Handle hydration on store initialization
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Set status based on whether we have valid tokens
          if (state.accessToken && state.user) {
            state.status = 'authenticated';
          } else {
            state.status = 'unauthenticated';
          }
        }
      },
    }
  )
);

// ============================================================================
// SELECTORS (Optional but recommended for performance)
// ============================================================================

/**
 * Selectors for specific parts of the auth state
 * Use these in components to prevent unnecessary re-renders
 */
export const authSelectors = {
  user: (state: AuthState & AuthActions) => state.user,
  isAuthenticated: (state: AuthState & AuthActions) => state.status === 'authenticated',
  status: (state: AuthState & AuthActions) => state.status,
  accessToken: (state: AuthState & AuthActions) => state.accessToken,
};

// ============================================================================
// HELPER HOOKS (Optional convenience hooks)
// ============================================================================

/**
 * Hook to check if user is authenticated
 */
export const useIsAuthenticated = () => 
  useAuthStore(authSelectors.isAuthenticated);

/**
 * Hook to get current user
 */
export const useCurrentUser = () => 
  useAuthStore(authSelectors.user);

/**
 * Hook to get auth status
 */
export const useAuthStatus = () => 
  useAuthStore(authSelectors.status);