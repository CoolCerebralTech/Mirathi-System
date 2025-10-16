// FILE: src/components/layout/PublicLayout.tsx
import { Outlet } from 'react-router-dom';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';

/**
 * The main layout for all public-facing pages.
 * Provides a consistent header and footer around the routed content.
 */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header>
        <PublicHeader />
      </header>

      {/* Routed page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer>
        <PublicFooter />
      </footer>
    </div>
  );
}
