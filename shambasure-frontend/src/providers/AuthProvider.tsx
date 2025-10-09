// FILE: src/providers/AuthProvider.tsx

import * as React from 'react';
import { useAuthStore } from '../store/auth.store';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    // Trigger Zustand persist rehydration
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    // Manually trigger hydration
    useAuthStore.getState().hydrate();

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
