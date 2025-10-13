// FILE: src/components/layout/DashboardLayout.tsx 

import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function DashboardLayout() {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[256px_1fr]">
      <Sidebar isMobileOpen={false} />
      <div className="flex flex-col">
        <Header onMobileNavToggle={function (): void {
          throw new Error('Function not implemented.');
        } } />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}