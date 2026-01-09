// FILE: src/components/layouts/PublicHeader.tsx
import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/Sheet';
import { Logo } from '../common/Logo';

export function PublicHeader() {
  useTranslation(['header', 'common']);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'How it Works', to: '/how-it-works' },
    { label: 'Resources', to: '/resources' },
  ];

  return (
    <header className={`
      fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out
      ${isScrolled 
        ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-slate-200/50 py-3' 
        : 'bg-transparent py-4'
      }
    `}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <Logo className={`h-8 w-auto transition-all ${isScrolled ? 'text-slate-900' : 'text-slate-900'}`} />
            </Link>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink 
                key={link.to} 
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors group ${
                    isActive 
                      ? 'text-slate-900 border-b-2 border-emerald-500' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              to="/login" 
              className="text-sm font-semibold text-slate-900 hover:text-emerald-600 transition-colors"
            >
              Sign In
            </Link>
            <Button 
              asChild 
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200/50 font-semibold"
            >
              <Link to="/register" className="flex items-center gap-1.5">
                Get Started <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
          </div>

          {/* Mobile Menu */}
          <MobileMenu navLinks={navLinks} />
        </div>
      </div>
    </header>
  );
}

function MobileMenu({ navLinks }: { navLinks: { label: string; to: string }[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="ml-2 h-9 w-9 text-slate-900">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] p-0 border-l-slate-200 bg-white">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <Logo className="h-8 w-auto text-slate-900" />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-6 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className="block text-lg font-medium text-slate-900 hover:text-emerald-600 hover:pl-3 transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="p-6 pt-0 border-t border-slate-200 space-y-3">
            <Link to="/login" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full h-11">
                Sign In
              </Button>
            </Link>
            <Link to="/register" onClick={() => setIsOpen(false)}>
              <Button className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}