// src/stores/auth.store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setUser, clearUser } from './user.store'; // We'll call actions from the other store

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  actions: {
    setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
    clearTokens: () => void;
  };
}

const initialState = {
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,
      actions: {
        setTokens: (tokens) => set({ ...tokens, isAuthenticated: true }),
        clearTokens: () => set({ ...initialState }),
      },
    }),
    { name: 'shamba-sure-auth-storage', partialize: (state) => ({ ...state, actions: undefined }) },
  ),
);

// Helper functions that combine actions from both stores for clean API calls
export const loginUser = (data: any) => {
    useAuthStore.getState().actions.setTokens(data);
    setUser(data.user);
};

export const logoutUser = () => {
    useAuthStore.getState().actions.clearTokens();
    clearUser();
};