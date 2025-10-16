// FILE: src/store/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: AuthStatus;
  isLoading: boolean;

  login: (
    data: { user: User; accessToken: string; refreshToken: string },
    rememberMe?: boolean
  ) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
}

const initialState: Omit<AuthState, 'login' | 'logout' | 'setUser' | 'setTokens'> = {
  user: null,
  accessToken: null,
  refreshToken: null,
  status: 'loading',
  isLoading: false,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      login: ({ user, accessToken, refreshToken }, rememberMe = false) => {
        set({
          user,
          accessToken,
          refreshToken,
          status: 'authenticated',
          isLoading: false,
        });

        // If "remember me" is false, clear storage on tab close
        if (!rememberMe) {
          window.addEventListener('beforeunload', () => {
            localStorage.removeItem('shamba-sure-auth-session');
          });
        }
      },

      logout: () => {
        set({
          ...initialState,
          status: 'unauthenticated',
          isLoading: false,
        });
        localStorage.removeItem('shamba-sure-auth-session');
      },

      setUser: (user) => {
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
      // Always use localStorage for stability
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state?: AuthState) => {
        if (!state) {
          useAuthStore.setState({ status: 'unauthenticated' });
          return;
        }

        // Simple expiry check
        const expired = !state.accessToken || isTokenExpired(state.accessToken);
        useAuthStore.setState({
          ...state,
          status: expired ? 'unauthenticated' : 'authenticated',
        });
      },
    }
  )
);

// === Helpers ===
function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}
