// FILE: src/components/layout/PublicLayout.tsx
import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';

export function PublicLayout() {
  const location = useLocation();

  // Scroll to top whenever the route changes (Standard UX)
  useEffect(() => {
    window.scrollTo(0, 0); 
  }, [location.pathname]);

  return (
    // Background: A sophisticated off-white/grey, not stark white.
    <div className="flex min-h-screen flex-col bg-[#F8F9FA] font-sans antialiased text-neutral-900 selection:bg-[#C8A165] selection:text-white">
      
      {/* Navigation */}
      <PublicHeader />

      {/* Main Content */}
      <main
        className="flex-1 pt-16" // pt-16 accounts for the fixed header height
        role="main"
      >
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>

      {/* Site Footer */}
      <PublicFooter />
      
    </div>
  );
}