// FILE: src/providers/AppProviders.tsx

import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppErrorBoundary } from '../components/common/ErrorBoundary';
import { ThemeProvider } from './ThemeProvider';
import { AuthProvider } from './AuthProvider';
import { Toaster } from '../components/ui/Toaster';

const queryClient = new QueryClient();

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    // The Error Boundary should be one of the outermost providers
    <AppErrorBoundary>
      {/* BrowserRouter is required for React Router to work */}
      <BrowserRouter>
        {/* ThemeProvider manages light/dark mode */}
        <ThemeProvider>
          {/* AuthProvider syncs our auth state on load */}
          <AuthProvider>
            {/* QueryClientProvider provides the TanStack Query client to the app */}
            <QueryClientProvider client={queryClient}>
              {children}
              <Toaster richColors position="top-right" />
            </QueryClientProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}