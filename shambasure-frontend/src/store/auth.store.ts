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
  /**
   * Sets the loading state for async operations.
   */
  setLoading: (isLoading: boolean) => void;
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

const initialState: Pick<AuthState, 'user' | 'accessToken' | 'refreshToken' | 'status' | 'isLoading'> = {
  user: null,
  accessToken: null,
  refreshToken: null,
  status: 'loading', // Start in a loading state until hydration is complete
  isLoading: false,
};

// ============================================================================
// CUSTOM STORAGE WRAPPER
// ============================================================================

/**
 * Custom storage wrapper that allows dynamic switching between localStorage and sessionStorage.
 * This enables the "Remember Me" functionality.
 */
class DynamicStorage implements StateStorage {
  private currentStorage: Storage = sessionStorage;

  setStorage(storage: Storage) {
    this.currentStorage = storage;
  }

  getItem(name: string): string | null {
    // Try both storages when reading (in case user switches devices/browsers)
    return localStorage.getItem(name) || sessionStorage.getItem(name);
  }

  setItem(name: string, value: string): void {
    this.currentStorage.setItem(name, value);
  }

  removeItem(name: string): void {
    // Remove from both storages to ensure clean logout
    localStorage.removeItem(name);
    sessionStorage.removeItem(name);
  }
}

const dynamicStorage = new DynamicStorage();

// ============================================================================
// AUTH STORE
// ============================================================================

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      login: ({ user, accessToken, refreshToken }, rememberMe = false) => {
        // Set the storage type based on "remember me" preference
        dynamicStorage.setStorage(rememberMe ? localStorage : sessionStorage);

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
      name: 'shamba-sure-auth-session',
      storage: createJSONStorage(() => dynamicStorage),
      // Only persist these specific fields to storage
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      // This hook runs after the store has been rehydrated from storage
      onRehydrateStorage: () => (state) => {
        // TypeScript fix: explicitly check if state exists and is of correct type
        if (!state) {
          return;
        }

        // After loading from storage, check if the token is still valid
        if (isTokenExpired(state.accessToken)) {
          // If expired, log the user out to clear invalid state
          state.logout();
        } else if (state.accessToken) {
          // If valid token exists, set the status to authenticated
          state.status = 'authenticated';
        } else {
          // No token found, set status to unauthenticated
          state.status = 'unauthenticated';
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

/** Hook to get the access token. */
export const useAccessToken = () => useAuthStore((state) => state.accessToken);

/** Hook to get the refresh token. */
export const useRefreshToken = () => useAuthStore((state) => state.refreshToken);

/** Hook to get all auth-related actions. */
export const useAuthActions = () =>
  useAuthStore((state) => ({
    login: state.login,
    logout: state.logout,
    setUser: state.setUser,
    setTokens: state.setTokens,
    setLoading: state.setLoading,
  }));
  