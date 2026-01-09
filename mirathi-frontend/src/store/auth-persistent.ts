import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserResponse as User } from '../types/user.types';

// Define the shape of the data we want to store
export interface AuthData {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
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
      accessToken: null,
      refreshToken: null,

      // ACTIONS (Internal use mostly)
      setAuth: (data) => set((state) => ({ ...state, ...data })),
      resetAuth: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: 'mirathi-auth', // Key in localStorage
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);