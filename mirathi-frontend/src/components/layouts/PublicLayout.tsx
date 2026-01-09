// FILE: src/components/layouts/PublicLayout.tsx
import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';

export function PublicLayout() {
  const location = useLocation();

  // Scroll to top on route change (smooth, accessible)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* Header */}
      <PublicHeader />
      
      {/* Main Content */}
      <main className="flex-1 pt-[68px] lg:pt-[76px]" role="main">
        <Outlet />
      </main>
      
      {/* Footer */}
      <PublicFooter />
    </div>
  );
}