import { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar'; 
import { Header } from './Header';     
import { X } from 'lucide-react';
import { cn } from '@/lib/utils'; 

/**
 * DASHBOARD LAYOUT
 * 
 * Implements the "App Shell" pattern.
 * - Desktop: Fixed Sidebar (Left), Sticky Header (Top), Scrollable Content.
 * - Mobile: Hidden Sidebar (Drawer), Sticky Header (Top), Scrollable Content.
 */
export function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Performance: Stable callback for closing menu
  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]"> {/* Slate-50 equivalent but slightly cooler */}
      
      {/* Accessibility Skip Link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-[#0F3D3E] focus:text-white focus:rounded-md"
      >
        Skip to main content
      </a>

      {/* ================================================================== */}
      {/* 1. DESKTOP SIDEBAR (Visible lg+)                                   */}
      {/* ================================================================== */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <Sidebar />
      </aside>

      {/* ================================================================== */}
      {/* 2. MOBILE SIDEBAR (Visible < lg)                                   */}
      {/* ================================================================== */}
      
      {/* Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-[2px] transition-opacity lg:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Off-canvas Menu */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation Menu"
      >
        {/* Close Button specific to mobile */}
        <button 
          onClick={closeMobileMenu} 
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F3D3E] rounded-md z-50"
          aria-label="Close menu"
        >
          <X size={20} />
        </button>

        {/* Reusing Sidebar Component */}
        <Sidebar onLinkClick={closeMobileMenu} />
      </div>

      {/* ================================================================== */}
      {/* 3. MAIN WORKSPACE                                                  */}
      {/* ================================================================== */}
      <div className="lg:pl-72 flex flex-col min-h-screen transition-all duration-300">
        
        {/* Header */}
        <Header onMobileMenuClick={() => setIsMobileMenuOpen(true)} />

        {/* Content Area */}
        <main id="main-content" className="flex-1 py-8 focus:outline-none">
          <div className="px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto w-full">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}