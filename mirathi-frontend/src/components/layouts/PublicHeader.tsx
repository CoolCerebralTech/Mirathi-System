// FILE: src/components/layouts/PublicHeader.tsx
import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '../ui/Sheet'; // Added SheetTitle for accessibility
import { Logo } from '../common/Logo';

const NAV_LINKS = [
  { label: 'How it Works', to: '/how-it-works' },
  { label: 'Resources', to: '/resources' },
];

export function PublicHeader() {
  useTranslation(['header', 'common']);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Optimization: Simple throttle logic is usually handled by browser optimization 
  // for simple boolean flips, but keeping it clean is key.
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10 && !isScrolled) setIsScrolled(true);
      if (window.scrollY <= 10 && isScrolled) setIsScrolled(false);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isScrolled]);

  return (
    <header 
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out border-b
        ${isScrolled 
          ? 'bg-white/95 backdrop-blur-xl shadow-sm border-slate-200/50 py-3' 
          : 'bg-white/0 border-transparent py-4'
        }
      `}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center" aria-label="Home">
              <Logo className="h-8 w-auto text-slate-900" />
            </Link>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <NavLink 
                key={link.to} 
                to={link.to}
                className={({ isActive }) =>
                  `relative text-sm font-medium transition-colors py-1 hover:text-emerald-600
                  ${isActive ? 'text-slate-900' : 'text-slate-600'}
                  after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-full after:h-0.5 
                  after:bg-emerald-500 after:transition-transform after:duration-300
                  ${isActive ? 'after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-50'}
                  `
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-900/10 font-semibold"
            >
              <Link to="/register" className="flex items-center gap-1.5">
                Get Started <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          {/* Mobile Menu */}
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}

function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 text-slate-900" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] p-0 border-l-slate-200 bg-white sm:max-w-xs">
        {/* Accessible Title for Screen Readers */}
        <SheetTitle className="sr-only">Mobile Navigation Menu</SheetTitle>
        
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <Logo className="h-8 w-auto text-slate-900" />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-slate-500 hover:text-slate-900"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close menu</span>
              </Button>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-6 space-y-6">
            <div className="flex flex-col space-y-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block text-lg font-medium text-slate-600 hover:text-emerald-600 hover:pl-2 transition-all duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>

          {/* Actions */}
          <div className="p-6 pt-0 border-t border-slate-200 space-y-3 bg-slate-50/50">
            <Link to="/login" className="block w-full">
              <Button variant="outline" className="w-full h-11 border-slate-300 font-semibold text-slate-700">
                Sign In
              </Button>
            </Link>
            <Link to="/register" className="block w-full">
              <Button className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}