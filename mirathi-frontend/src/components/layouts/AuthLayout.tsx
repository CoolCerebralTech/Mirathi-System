// FILE: src/components/layouts/AuthLayout.tsx
import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck, Scale, Lock } from 'lucide-react';
import { Logo } from '../common/Logo';

// Static configuration moved outside component
const TRUST_ITEMS = [
  { icon: Lock, label: 'Bank-grade encryption (AES-256)' },
  { icon: Scale, label: 'Compliant with Law of Succession Act (Cap 160)' },
  { icon: ShieldCheck, label: 'Data Protection Act registered' },
];

export function AuthLayout() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen w-full bg-slate-50 grid lg:grid-cols-2">
      
      {/* 
        LEFT COLUMN: Form Area 
        Design Rationale: High contrast, white background, focused entirely on the input task.
      */}
      <div className="flex flex-col bg-white border-r border-slate-100 relative z-20">
        
        {/* Mobile Header - Visible only on small screens */}
        <div className="lg:hidden flex items-center justify-between border-b border-slate-100 p-6 bg-white">
          <Link to="/" aria-label="Back to home">
            <Logo className="h-8 w-auto text-slate-900" />
          </Link>
        </div>

        {/* Main Content Container */}
        <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-8 xl:px-12">
          <div className="mx-auto w-full max-w-[440px]">
            
            {/* Desktop Logo - Visible only on large screens */}
            <div className="mb-10 hidden lg:block">
              <Link to="/" aria-label="Back to home" className="inline-block focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg">
                <Logo className="h-10 w-auto text-slate-900" />
              </Link>
            </div>

            {/* THE FORM CONTENT (Login, Register, etc.) */}
            <main>
              <Outlet />
            </main>

            {/* Footer - Legal Links */}
            <footer className="mt-10 pt-6 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
                <span>© {currentYear} Mirathi Systems Ltd</span>
                <nav className="flex items-center gap-4">
                  <Link to="/legal/privacy" className="hover:text-emerald-600 hover:underline transition-colors">Privacy</Link>
                  <Link to="/legal/terms" className="hover:text-emerald-600 hover:underline transition-colors">Terms</Link>
                  <Link to="/security" className="hover:text-emerald-600 hover:underline transition-colors">Security</Link>
                </nav>
              </div>
            </footer>

          </div>
        </div>
      </div>

      {/* 
        RIGHT COLUMN: Authority Panel 
        Design Rationale: Dark "Slate-900" conveys stability and seriousness. 
        No distractions, just reinforcement of trust.
      */}
      <div className="hidden lg:relative lg:flex lg:flex-col bg-slate-900 text-white overflow-hidden">
        
        {/* Decorative Background Pattern (Subtle Architectural Grid) */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none select-none" 
          aria-hidden="true"
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` 
          }}
        />

        {/* Ambient Lighting Effect */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-[500px] w-[500px] rounded-full bg-emerald-900/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-[500px] w-[500px] rounded-full bg-blue-900/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full px-16 py-20 xl:px-24 justify-center">
          
          {/* Headline Statement */}
          <div className="max-w-lg">
            <h2 className="text-3xl font-medium tracking-tight text-white sm:text-4xl">
              Secure. Compliant. <br />
              <span className="text-emerald-400">Transparent.</span>
            </h2>
            <p className="mt-6 text-lg text-slate-300 leading-relaxed font-light">
              Mirathi supports Kenyan families and administrators through the succession process with full respect for the Law of Succession Act (Cap 160) and Data Protection regulations.
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 space-y-8">
            {TRUST_ITEMS.map((item) => (
              <div key={item.label} className="flex items-start gap-5 group">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 transition-colors duration-300">
                  <item.icon className="h-5 w-5 text-slate-300 group-hover:text-emerald-400 transition-colors" />
                </div>
                <div className="pt-2">
                  <span className="text-base font-medium text-slate-200 block">
                    {item.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Institutional Testimonial / Footnote */}
          <div className="mt-auto pt-12 border-t border-white/10">
            <blockquote className="text-sm text-slate-400 italic leading-relaxed">
              "Ensuring legal certainty for future generations."
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
}