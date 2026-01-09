// FILE: src/components/layout/AuthLayout.tsx
// VERSION: 1.1.0 - Mirathi "Old Money" Edition

import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Lock, Scale, Building2 } from 'lucide-react'; // Changed icons to be more legal/institutional
import { Logo } from '../common/Logo';

/**
 * MIRATHI AUTH LAYOUT
 * 
 * A split-screen experience designed to instill immediate confidence.
 * Left Side: The "Digital Copilot" Intake (Functional, Clean).
 * Right Side: The "Legacy" Promise (Emotional, Authority).
 */
export function AuthLayout() {
  useTranslation(['auth', 'common']);

  // Trust Indicators specific to High-Value Estate Management
  const trustIndicators = [
    { icon: Lock, label: 'Bank-Grade Encryption (AES-256)', key: 'trust.encryption' },
    { icon: Scale, label: 'Kenyan Law of Succession Compliant', key: 'trust.compliance' },
    { icon: ShieldCheck, label: 'ISO 27001 Data Protection', key: 'trust.protection' },
  ];

  return (
    <div className="grid min-h-screen w-full bg-[#F8F9FA] lg:grid-cols-2">
      
      {/* ================================================================== */}
      {/* LEFT PANEL: The Functional Gate (Forms) */}
      {/* ================================================================== */}
      <div className="flex flex-col relative bg-white">
        
        {/* Mobile Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 p-6 lg:hidden">
          <Logo className="h-8 w-auto text-[#0F3D3E]" aria-label="Mirathi Home" />
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-[440px] animate-fade-in-up">
            
            {/* Desktop Logo */}
            <div className="mb-10 hidden lg:block">
              <Logo className="h-10 w-auto text-[#0F3D3E]" />
            </div>

            {/* THE FORM INJECTION POINT */}
            <div className="relative z-10">
              <Outlet />
            </div>

            {/* Legal Footer */}
            <div className="mt-10 border-t border-neutral-100 pt-6 text-center text-xs text-neutral-500">
              <p className="mb-3 font-medium">
                Protected by Mirathi Active Intelligence™
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                <Link to="/privacy" className="hover:text-[#0F3D3E] hover:underline">Privacy</Link>
                <span>•</span>
                <Link to="/terms" className="hover:text-[#0F3D3E] hover:underline">Terms</Link>
                <span>•</span>
                <Link to="/security" className="hover:text-[#0F3D3E] hover:underline">Security</Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* RIGHT PANEL: The Authority & Legacy Builder */}
      {/* ================================================================== */}
      <div className="relative hidden overflow-hidden bg-[#0F3D3E] lg:flex lg:flex-col lg:justify-between text-white">
        
        {/* 1. Background Pattern (Subtle Topographic Lines representing Land) */}
        <div className="absolute inset-0 opacity-[0.05]" 
             style={{ 
               backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C8A165' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
             }} 
        />
        
        {/* 2. Gradient Overlay for Depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#051F20] to-transparent opacity-80" />

        {/* 3. Top Section: The Promise */}
        <div className="relative z-10 px-16 pt-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#C8A165]/30 bg-[#C8A165]/10 px-4 py-1.5 backdrop-blur-md">
            <Building2 className="h-4 w-4 text-[#C8A165]" />
            <span className="text-xs font-semibold tracking-wider text-[#C8A165] uppercase">
              Kenyan Law of Succession (Cap 160)
            </span>
          </div>
          
          <h1 className="mt-8 font-serif text-5xl font-medium leading-tight tracking-tight text-[#F8F9FA]">
            Turn the chaos of loss <br />
            into a <span className="text-[#C8A165] italic">clear path forward.</span>
          </h1>
          
          <p className="mt-6 max-w-md text-lg text-neutral-300 leading-relaxed">
            Mirathi acts as your digital executor—guiding you from the funeral to the final distribution of assets with legal precision.
          </p>
        </div>

        {/* 4. Middle Section: Trust Stack */}
        <div className="relative z-10 px-16">
          <div className="space-y-4">
            {trustIndicators.map((item) => (
              <div key={item.key} className="group flex items-center gap-4 transition-transform duration-300 hover:translate-x-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10 group-hover:bg-[#C8A165] group-hover:text-[#0F3D3E] transition-colors">
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-neutral-200 group-hover:text-white">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Bottom Section: Social Proof */}
        <div className="relative z-10 border-t border-white/10 bg-black/20 p-10 backdrop-blur-sm">
          <blockquote className="space-y-4">
            <p className="font-serif text-xl italic leading-relaxed text-neutral-200">
              "The process of obtaining the Grant of Probate was overwhelming until we used Mirathi. It automatically generated the P&A 80 forms and flagged a missing signature that would have delayed us by months."
            </p>
            <footer className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-[#C8A165] flex items-center justify-center text-[#0F3D3E] font-bold">
                JM
              </div>
              <div>
                <div className="font-semibold text-white">John Maina</div>
                <div className="text-xs text-[#C8A165] uppercase tracking-wider">Estate Administrator, Nairobi</div>
              </div>
            </footer>
          </blockquote>
        </div>

      </div>
    </div>
  );
}