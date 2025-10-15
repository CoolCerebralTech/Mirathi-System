// FILE: src/providers/AuthProvider.tsx

import * as React from 'react';
import { useAuthStore } from '../store/auth.store';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

// ============================================================================
// AUTH PROVIDER
// ============================================================================

/**
 * Ensures that the authentication store is hydrated before rendering children.
 * - Uses Zustand's persist middleware to rehydrate state from storage.
 * - Displays a full‑screen loading spinner until hydration completes.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    // Subscribe to Zustand persist hydration completion
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    return unsubscribe;
  }, []);

  // Show loading spinner while hydrating auth state
  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }

  return <>{children}</>;
}
