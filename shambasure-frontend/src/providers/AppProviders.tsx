// FILE: src/providers/AppProviders.tsx

import * as React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { ThemeProvider } from './ThemeProvider';
import { AuthProvider } from './AuthProvider';
import { QueryProvider } from './QueryProvider';
import { I18nProvider } from './I18nProvider';
import { Toaster } from '../components/common/Toaster';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <I18nProvider>
          <ThemeProvider>
            <QueryProvider>
              <AuthProvider>
                {children}
                <Toaster />
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </I18nProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}