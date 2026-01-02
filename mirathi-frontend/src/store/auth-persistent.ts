import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserOutput } from '../types/user.types';

// Define the shape of the data we want to store
export interface AuthData {
  user: UserOutput | null;
  isAuthenticated: boolean;
}

// Define the actions available on this specific store
interface PersistentActions {
  setAuth: (data: Partial<AuthData>) => void;
  resetAuth: () => void;
}

export const usePersistentAuthStore = create<AuthData & PersistentActions>()(
  persist(
    (set) => ({
      // INITIAL STATE
      user: null,
      isAuthenticated: false,

      // ACTIONS
      setAuth: (data) => set((state) => ({ ...state, ...data })),
      resetAuth: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'shamba-sure-auth', // Key in localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);