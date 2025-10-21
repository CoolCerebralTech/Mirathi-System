// FILE: src/components/layout/PublicLayout.tsx
import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';

/**
 * The main layout for all public-facing pages.
 * Provides a consistent header and footer around the routed content.
 * 
 * Features:
 * - Smooth page transitions with fade-in animation
 * - Scroll restoration on route change
 * - Elegant old money aesthetic with warm background
 * - Flexible main content area with proper semantic HTML
 */
export function PublicLayout() {
  const location = useLocation();

  // Smooth scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background antialiased">
      {/* Header - Sticky with elegant shadow on scroll */}
      <PublicHeader />

      {/* Main Content Area with Fade-in Animation */}
      <main 
        className="flex-1 animate-fade-in"
        role="main"
        aria-label="Main content"
      >
        <Outlet />
      </main>

      {/* Footer - Elegant closure with trust elements */}
      <PublicFooter />

      {/* Subtle decorative gradient overlay for depth (optional) */}
      <div 
        className="pointer-events-none fixed inset-0 bg-gradient-to-b from-transparent via-transparent to-neutral-50/30 mix-blend-overlay" 
        aria-hidden="true"
      />
    </div>
  );
}
