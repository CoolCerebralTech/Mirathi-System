// FILE: src/components/layout/PublicHeader.tsx
// CONTEXT: Mirathi (Clean, Professional, Trustworthy)

import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, ArrowRight } from 'lucide-react';

import { Logo } from '../common/Logo';
import { Button } from '../ui/Button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/Sheet';

export function PublicHeader() {
  useTranslation(['header', 'common']);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect for the "Glass" header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Solutions', to: '/solutions' },
    { label: 'How it Works', to: '/how-it-works' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Resources', to: '/resources' },
  ];

  return (
    <header 
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${isScrolled 
          ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-neutral-200/50 py-2' 
          : 'bg-transparent py-4'
        }
      `}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* 1. Logo Section */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center gap-2 group">
              <Logo className="h-10 w-auto text-[#0F3D3E]" />
            </Link>
          </div>
          
          {/* 2. Desktop Navigation */}
          <nav className="hidden md:flex md:gap-x-8">
            {navLinks.map((link) => (
              <NavLink 
                key={link.to} 
                to={link.to} 
                className={({ isActive }) => 
                  `text-sm font-medium transition-colors hover:text-[#C8A165] 
                   ${isActive ? 'text-[#0F3D3E] font-bold' : 'text-neutral-600'}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* 3. Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link 
              to="/login" 
              className="text-sm font-semibold text-[#0F3D3E] hover:text-[#C8A165] transition-colors"
            >
              Sign in
            </Link>
            <Button 
              asChild 
              className="bg-[#0F3D3E] hover:bg-[#0F3D3E]/90 text-white border-none shadow-lg shadow-[#0F3D3E]/20"
            >
              <Link to="/register" className="flex items-center gap-2">
                Start My Plan <ArrowRight className="h-4 w-4 text-[#C8A165]" />
              </Link>
            </Button>
          </div>

          {/* 4. Mobile Menu Trigger */}
          <div className="md:hidden">
            <MobileMenu navLinks={navLinks} />
          </div>
        </div>
      </div>
    </header>
  );
}

// Sub-component: Mobile Menu
function MobileMenu({ navLinks }: { navLinks: { label: string; to: string }[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-[#0F3D3E]">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[300px] border-l-[#C8A165]/20 bg-[#F8F9FA]">
        <div className="flex flex-col gap-8 mt-6">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
            <Logo className="h-8 w-auto text-[#0F3D3E]" />
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className="text-lg font-medium text-neutral-800 hover:text-[#C8A165] hover:pl-2 transition-all"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-3 mt-auto border-t border-neutral-200 pt-6">
            <Link to="/login" onClick={() => setIsOpen(false)}>
              <Button variant="outline" className="w-full justify-start">
                Sign In
              </Button>
            </Link>
            <Link to="/register" onClick={() => setIsOpen(false)}>
              <Button className="w-full bg-[#0F3D3E] text-white hover:bg-[#0F3D3E]/90">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}