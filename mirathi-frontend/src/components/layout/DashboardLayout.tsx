// FILE: src/components/layout/DashboardLayout.tsx

import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

/**
 * The main layout for the authenticated part of the application.
 * It combines a persistent sidebar for navigation, a header for user actions,
 * and a main content area where all the feature pages will be rendered.
 * This layout is fully responsive.
 */
export function DashboardLayout() {
  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[256px_1fr]">
      {/* --- Sidebar (Visible on large screens) --- */}
      <Sidebar />

      {/* --- Main Content Area --- */}
      <div className="flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/40 p-4 sm:p-6">
          {/* All authenticated pages will be rendered here */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
