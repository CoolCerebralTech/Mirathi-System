import { create } from 'zustand';
import type { AuthData } from './auth-persistent'; // Reuse the interface

interface SessionActions {
  setAuth: (data: Partial<AuthData>) => void;
  resetAuth: () => void;
}

export const useSessionAuthStore = create<AuthData & SessionActions>((set) => ({
  // INITIAL STATE
  user: null,
  accessToken: null,
  refreshToken: null,

  // ACTIONS
  setAuth: (data) => set((state) => ({ ...state, ...data })),
  resetAuth: () => set({ user: null, accessToken: null, refreshToken: null }),
}));
