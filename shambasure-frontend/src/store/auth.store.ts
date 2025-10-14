// FILE: src/store/auth.store.ts

import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import type { User } from '../types';

// ============================================================================
// STATE & ACTION INTERFACE
// ============================================================================

/**
 * Defines the possible authentication statuses:
 * - 'loading': The store is initializing and checking persisted state.
 * - 'authenticated': The user is logged in, and the token is valid.
 * - 'unauthenticated': The user is not logged in, or the token is invalid/expired.
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  /** The currently authenticated user object, or null if not logged in. */
  user: User | null;
  /** The JWT access token for API requests. */
  accessToken: string | null;
  /** The token used to refresh the access token. */
  refreshToken: string | null;
  /** The current authentication status. */
  status: AuthStatus;
  /** A flag to indicate if an auth-related async operation is in progress. */
  isLoading: boolean;

  // --- Actions ---
  /**
   * Logs the user in, persisting their session.
   * @param data - The authentication response data from the API.
   * @param {boolean} [rememberMe=false] - If true, persists the session in localStorage. Otherwise, uses sessionStorage.
   */
  login: (
    data: { user: User; accessToken: string; refreshToken: string },
    rememberMe?: boolean,
  ) => void;
  /** Logs the user out and clears all session data. */
  logout: () => void;
  /**
   * Updates the user object in the store.
   * Useful for updating profile information without a full re-login.
   */
  setUser: (user: User) => void;
  /**
   * Updates the access and refresh tokens.
   * Typically used after a token refresh operation.
   */
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
}

// ============================================================================
// HELPER: Decode JWT Expiry
// ============================================================================

/**
 * Checks if a JWT token is expired.
 * @param token - The JWT token string.
 * @returns {boolean} True if the token is expired or invalid, false otherwise.
 */
function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // `exp` is in seconds, Date.now() is in milliseconds.
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true; // Invalid token format
  }
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: Omit<AuthState, 'login' | 'logout' | 'setUser' | 'setTokens'> = {
  user: null,
  accessToken: null,
  refreshToken: null,
  status: 'loading', // Start in a loading state until hydration is complete
  isLoading: false,
};

// ============================================================================
// AUTH STORE
// ============================================================================

// A variable to hold the storage type, controlled by the `login` action.
let storage: StateStorage = sessionStorage;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      login: ({ user, accessToken, refreshToken }, rememberMe = false) => {
        // Set the storage type for the current session based on "remember me"
        storage = rememberMe ? localStorage : sessionStorage;

        set({
          user,
          accessToken,
          refreshToken,
          status: 'authenticated',
          isLoading: false,
        });
      },

      logout: () => {
        // Clear all session state and reset to unauthenticated
        set({
          ...initialState,
          status: 'unauthenticated',
          isLoading: false,
        });
      },

      setUser: (user) => {
        // Only update the user if they are already authenticated
        if (get().status === 'authenticated') {
          set({ user });
        }
      },

      setTokens: ({ accessToken, refreshToken }) => {
        set({ accessToken, refreshToken });
      },
    }),
    {
      name: 'shamba-sure-auth-session',
      // Dynamically use the storage type set during login
      storage: createJSONStorage(() => storage),
      // Only persist these specific fields to storage
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      // This hook runs after the store has been rehydrated from storage
      onRehydrateStorage: () => (state?: AuthState) => {
        if (!state) {
          // Nothing in storage → unauthenticated
          useAuthStore.setState({ status: 'unauthenticated' });
          return;
        }

        if (isTokenExpired(state.accessToken)) {
          // Expired token → reset to unauthenticated
          useAuthStore.setState({
            ...initialState,
            status: 'unauthenticated',
          });
        } else {
          // Valid token → authenticated
          useAuthStore.setState({ status: 'authenticated' });
        }
      },
    },
  ),
);

// ============================================================================
// SELECTORS & CONVENIENCE HOOKS
// ============================================================================

/** Hook to get the current user object. */
export const useCurrentUser = () => useAuthStore((state) => state.user);
/** Hook to get the current authentication status. */
export const useAuthStatus = () => useAuthStore((state) => state.status);
/** Hook to check if an auth operation is in progress. */
export const useIsAuthLoading = () => useAuthStore((state) => state.isLoading);
/** Hook that returns true only if the user is fully authenticated. */
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.status === 'authenticated');
