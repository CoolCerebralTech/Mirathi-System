// FILE: src/components/layouts/PublicLayout.tsx
import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';

export function PublicLayout() {
  const location = useLocation();

  // Scroll to top on route change (accessible behavior)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' }); // 'instant' is better for page loads than 'auto'
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white font-sans">
      
      <PublicHeader />
      
      {/* 
        Main Content Area
        pt-[80px] accounts for the fixed header height (roughly 72-80px depending on state)
        to prevent content from being hidden underneath it.
      */}
      <main className="flex-1 pt-[80px]" role="main" id="main-content">
        <Outlet />
      </main>
      
      <PublicFooter />
    </div>
  );
}