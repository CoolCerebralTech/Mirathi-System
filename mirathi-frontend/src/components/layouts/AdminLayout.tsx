// FILE: src/components/layout/AdminLayout.tsx

import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

/**
 * The main layout for the administrator-only section of the application.
 * It reuses the standard Sidebar and Header components, which will automatically
 * display admin-specific navigation links for an authenticated admin user.
 */
export function AdminLayout() {
  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[256px_1fr]">
      <Sidebar />
      <div className="flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto bg-muted/40 p-4 sm:p-6">
          {/* All admin pages will be rendered here */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}