// FILE: src/components/layouts/DashboardLayout.tsx

import * as React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { Toaster } from '../common/Toaster';

export function DashboardLayout() {
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false);
  const status = useAuthStore((state) => state.status);

  const handleMobileNavToggle = () => {
    setIsMobileNavOpen((prev) => !prev);
  };

  const handleCloseMobileNav = () => {
    setIsMobileNavOpen(false);
  };

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  // Show loading state while checking auth
  if (status === 'idle') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar 
        isMobileOpen={isMobileNavOpen} 
        onClose={handleCloseMobileNav}
      />

      {/* Main Content Area */}
      <div className="sm:pl-64">
        {/* Header */}
        <Header onMobileNavToggle={handleMobileNavToggle} />

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)] bg-muted/40 p-4 sm:p-6 lg:p-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}