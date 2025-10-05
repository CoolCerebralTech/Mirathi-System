// src/stores/user.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types'; // We'll fix this path after refactoring types
interface UserState {
user: User | null;
actions: {
setUser: (user: User) => void;
clearUser: () => void;
};
}
const initialState = { user: null };
export const useUserStore = create<UserState>()(
persist(
(set) => ({
...initialState,
actions: {
setUser: (user) => set({ user }),
clearUser: () => set({ ...initialState }),
},
}),
{ name: 'shamba-sure-user-storage', partialize: (state) => ({ ...state, actions: undefined }) },
),
);
// Export standalone actions for use in other stores/services
export const { setUser, clearUser } = useUserStore.getState().actions;