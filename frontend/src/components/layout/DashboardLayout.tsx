// FILE: src/components/layouts/DashboardLayout.tsx

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function DashboardLayout() {
  // 1. This state controls the visibility of the sidebar on mobile screens.
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // 2. This function is passed down to the Header component.
  //    The Header will call it when the mobile menu button is clicked.
  const handleMobileNavToggle = () => {
    setIsMobileNavOpen((prev) => !prev);
  };

  return (
    <div className="grid min-h-screen w-full sm:grid-cols-[256px_1fr]">
      {/* --- SIDEBAR --- */}
      {/* The sidebar's visibility on mobile is controlled by our state. */}
      <Sidebar isMobileOpen={isMobileNavOpen} />

      <div className="flex flex-col sm:pl-64">
        {/* --- HEADER --- */}
        {/* We pass the toggle function down to the header. */}
        <Header onMobileNavToggle={handleMobileNavToggle} />
        
        {/* --- MAIN CONTENT AREA --- */}
        <main className="flex-1 overflow-auto p-6 bg-muted/40">
            {/* The Outlet from React Router renders the actual page component
                (e.g., DashboardPage, AssetsPage, etc.) here. */}
            <Outlet />
        </main>
      </div>
    </div>
  );
}