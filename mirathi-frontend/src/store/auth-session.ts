import { create } from 'zustand';
import type { AuthData } from './auth-persistent';

interface SessionActions {
  setAuth: (data: Partial<AuthData>) => void;
  resetAuth: () => void;
}

export const useSessionAuthStore = create<AuthData & SessionActions>((set) => ({
  // INITIAL STATE
  user: null,
  isAuthenticated: false,

  // ACTIONS
  setAuth: (data) => set((state) => ({ ...state, ...data })),
  resetAuth: () => set({ user: null, isAuthenticated: false }),
}));