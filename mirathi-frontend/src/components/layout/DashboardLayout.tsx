// FILE: src/components/layout/DashboardLayout.tsx
// VERSION: 1.1.0 - The Command Center Shell

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar'; 
import { Header } from './Header';     
import { X } from 'lucide-react';
import { cn } from '@/lib/utils'; 

/**
 * DASHBOARD LAYOUT
 * 
 * The persistent shell for the authenticated user.
 * It manages the responsive state of the navigation and provides
 * the context for the "Digital Copilot".
 */
export function DashboardLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      {/* Accessibility: Skip Link */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-black">
        Skip to main content
      </a>

      {/* ================================================================== */}
      {/* 1. DESKTOP SIDEBAR (Fixed Left)                                    */}
      {/* ================================================================== */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <Sidebar />
      </div>

      {/* ================================================================== */}
      {/* 2. MOBILE SIDEBAR (Drawer/Overlay)                                 */}
      {/* ================================================================== */}
      {/* Overlay Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/80 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Slide-out Drawer */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 transform bg-[#0F3D3E] transition-transform duration-300 ease-in-out lg:hidden",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center justify-between px-6">
           <span className="text-white font-bold tracking-wider">MIRATHI</span>
           <button onClick={() => setIsMobileMenuOpen(false)} className="text-white hover:text-[#C8A165]">
             <X size={24} />
           </button>
        </div>
        <Sidebar /> {/* Reusing the same component */}
      </div>

      {/* ================================================================== */}
      {/* 3. MAIN CONTENT AREA                                               */}
      {/* ================================================================== */}
      <div className="lg:pl-72 flex flex-col min-h-screen transition-all duration-300">
        
        {/* Sticky Header */}
        <Header 
          onMobileMenuClick={() => setIsMobileMenuOpen(true)} 
        />

        {/* The Workspace */}
        <main id="main-content" className="flex-1 py-8">
          <div className="px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
            
            {/* Context: This renders the specific page (Dashboard, Assets, Family) */}
            <div className="animate-fade-in">
               <Outlet />
            </div>

          </div>
        </main>
      </div>

    </div>
  );
}