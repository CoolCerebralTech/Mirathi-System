// FILE: src/components/layout/PublicHeader.tsx
// CONTEXT: Mirathi (Dark Mode, Financial/Legal Trust)

import * as React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, ArrowRight, Lock } from 'lucide-react';

import { Logo } from '../common/Logo';
import { Button } from '../ui/Button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/Sheet';

export function PublicHeader() {
  const { t } = useTranslation(['public_header', 'common']);
  const [scrolled, setScrolled] = React.useState(false);

  // Scroll detection for the "Glass" effect
  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = React.useMemo(() => [
    { labelKey: 'nav.platform', to: '/features' },
    { labelKey: 'nav.architecture', to: '/how-it-works' }, // Linked to the "Service Map"
    { labelKey: 'nav.security', to: '/security' },
    { labelKey: 'nav.pricing', to: '/pricing' },
  ], []);

  return (
    <header 
      className={`
        sticky top-0 z-50 w-full 
        transition-all duration-500 ease-out border-b
        ${scrolled 
          ? 'border-slate-800 bg-slate-950/80 shadow-lg backdrop-blur-xl' 
          : 'border-transparent bg-transparent'
        }
      `}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-24 items-center justify-between">
          
          {/* Logo Section */}
          <div className="flex items-center">
              <Logo 
                className="transition-transform duration-300 hover:scale-105"
                sizeClassName="h-14 w-auto" // Slightly larger for the detailed column icon
                showTagline={true} // Show "Succession Copilot"
              />
          </div>
          
          {/* Desktop Navigation */}
          <nav 
            className="hidden items-center space-x-2 lg:flex" 
            aria-label="Main navigation"
          >
            {navLinks.map((link) => (
              <NavLink 
                key={link.to} 
                to={link.to} 
                className={({ isActive }) => 
                  `
                    relative px-4 py-2 font-sans text-sm font-medium tracking-wide
                    transition-all duration-300 ease-out
                    ${isActive 
                      ? 'text-amber-400' 
                      : 'text-slate-300 hover:text-white'
                    }
                    after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 
                    after:h-0.5 after:w-1/2
                    after:origin-center after:scale-x-0 
                    after:bg-amber-400 after:transition-transform after:duration-300
                    ${isActive ? 'after:scale-x-100' : 'hover:after:scale-x-100'}
                  `
                }
              >
                {t(link.labelKey)}
              </NavLink>
            ))}
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden items-center space-x-6 lg:flex">
            {/* Login Link */}
            <Link 
              to="/login" 
              className="
                flex items-center gap-2 text-sm font-semibold text-slate-300
                transition-all duration-300 hover:text-amber-400
              "
            >
              <Lock className="h-4 w-4 opacity-70" />
              {t('nav.sign_in')}
            </Link>

            {/* Get Started Button */}
            <Button 
              asChild 
              className="
                bg-gradient-to-r from-amber-500 to-amber-600 
                font-sans text-sm font-bold text-slate-950 
                shadow-[0_0_20px_rgba(245,158,11,0.2)] 
                transition-all duration-300 
                hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] hover:-translate-y-0.5
                border-0 rounded-lg
              "
            >
              <Link to="/register" className="flex items-center px-6 py-2.5">
                <span>{t('nav.get_started')}</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {/* Mobile Menu */}
          <MobileNav navLinks={navLinks} />
        </div>
      </div>
    </header>
  );
}

// Refined Mobile Navigation (Dark Mode)
function MobileNav({ navLinks }: { navLinks: { labelKey: string; to: string }[] }) {
  const { t } = useTranslation(['public_header', 'common']);
  const [isOpen, setIsOpen] = React.useState(false);

  // Prevent body scroll when menu is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <div className="lg:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="
              text-slate-300 transition-colors duration-300 
              hover:bg-slate-800 hover:text-amber-400
            "
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        
        <SheetContent 
          side="right" 
          className="
            w-full max-w-sm border-l border-slate-800 
            bg-slate-950 text-slate-100
          "
        >
          <div className="flex h-full flex-col">
            
            {/* Mobile Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-6">
              <Link 
                to="/" 
                onClick={() => setIsOpen(false)}
                className="transition-opacity hover:opacity-80"
              >
                <Logo sizeClassName="h-10 w-auto" />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            {/* Mobile Navigation Links */}
            <nav 
              className="flex flex-col space-y-2 py-8" 
              aria-label="Mobile navigation"
            >
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `
                      rounded-lg px-4 py-3 font-serif text-lg font-medium
                      transition-all duration-300
                      ${isActive
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                      }
                    `
                  }
                >
                  {t(link.labelKey)}
                </NavLink>
              ))}
            </nav>
            
            {/* Mobile CTA Buttons */}
            <div className="mt-auto flex flex-col space-y-4 border-t border-slate-800 pt-8">
              <Button 
                asChild 
                size="lg" 
                className="
                  bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold
                  shadow-lg
                "
              >
                <Link to="/register" onClick={() => setIsOpen(false)}>
                  {t('nav.get_started')}
                </Link>
              </Button>
              <Button 
                variant="outline" 
                asChild 
                size="lg" 
                className="
                  border-slate-700 bg-transparent text-slate-300
                  hover:bg-slate-900 hover:text-white hover:border-slate-500
                "
              >
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  {t('nav.sign_in')}
                </Link>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}