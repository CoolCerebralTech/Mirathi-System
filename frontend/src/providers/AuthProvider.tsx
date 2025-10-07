// FILE: src/providers/AuthProvider.tsx

import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/auth.store';

// This provider's sole purpose is to sync the Zustand store with localStorage
// on initial application load.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // This effect runs once on mount.
    // It triggers the rehydration of the auth store from localStorage.
    // The `_hasHydrated` property is an internal flag from the persist middleware.
    useAuthStore.persist.rehydrate();
    
    // Once rehydration is triggered, we can mark the app as initialized.
    setIsInitialized(true);
  }, []);

  // We can optionally show a loading spinner while the store is hydrating,
  // but for auth it's usually fast enough to just render the children once initialized.
  if (!isInitialized) {
    return null; // Or a full-screen loading spinner
  }

  return <>{children}</>;
}