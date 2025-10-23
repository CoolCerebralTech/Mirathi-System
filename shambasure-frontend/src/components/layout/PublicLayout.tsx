// FILE: src/components/layout/PublicLayout.tsx
import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';


export function PublicLayout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0); 
}, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background antialiased">
      {/* Header - Sticky with elegant shadow on scroll */}
      <PublicHeader />

      {/* Main Content Area with Fade-in Animation */}
      <main
        key={location.pathname} 
        className="flex-1 animate-fade-in"
        role="main"
        aria-label="Main content"
      >
        <Outlet />
      </main>

      {/* Footer - Elegant closure with trust elements */}
      <PublicFooter />

      
    </div>
  );
}
