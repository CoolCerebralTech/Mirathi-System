// src/components/providers/AppProviders.tsx

import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // Import
import { router } from '../../router';
import { ErrorBoundary } from '../common/ErrorBoundary';

// Create a client
const queryClient = new QueryClient();

export const AppProviders = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}> {/* Wrap the app */}
        <Toaster position="top-right" toastOptions={/* ... */} />
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
};