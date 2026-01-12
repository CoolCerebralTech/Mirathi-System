// FILE: src/providers/AppProviders.tsx

import * as React from 'react';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { ThemeProvider } from './ThemeProvider';
import { QueryProvider } from './QueryProvider';
import { Toaster } from 'sonner';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary>
      {/* AuthProvider is now removed. Zustand handles auth globally. */}
        <ThemeProvider>
          <QueryProvider>
            {children}
            {/* Using sonner directly for simplicity */}
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </ThemeProvider>
    </ErrorBoundary>
  );
}