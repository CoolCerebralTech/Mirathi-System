// FILE: src/components/layout/PublicHeader.tsx

import * as React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X } from 'lucide-react';

import { Logo } from '../common/Logo';
import { Button } from '../ui/Button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/Sheet';

export function PublicHeader() {
  const { t } = useTranslation(['public_header', 'common']);
  const [scrolled, setScrolled] = React.useState(false);

  // Elegant scroll detection for refined shadow effect
  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = React.useMemo(() => [
    { labelKey: 'nav.features', to: '/features' },
    { labelKey: 'nav.security', to: '/security' },
    { labelKey: 'nav.about', to: '/about' },
    { labelKey: 'nav.contact', to: '/contact' },
  ], []);

  return (
    <header 
      className={`
        sticky top-0 z-50 w-full 
        border-b transition-all duration-500 ease-out
        ${scrolled 
          ? 'border-neutral-200 bg-background/95 shadow-soft backdrop-blur-md' 
          : 'border-transparent bg-transparent'
        }
      `}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          
          {/* Logo Section */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="transition-transform duration-300 hover:scale-105"
              aria-label="Shamba Sure Home"
            >
              <Logo />
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav 
            className="hidden items-center space-x-1 lg:flex" 
            aria-label="Main navigation"
          >
            {navLinks.map((link) => (
              <NavLink 
                key={link.to} 
                to={link.to} 
                className={({ isActive }) => 
                  `
                    relative px-4 py-2 font-sans text-base font-medium tracking-relaxed
                    transition-all duration-300 ease-out
                    ${isActive 
                      ? 'text-primary' 
                      : 'text-text-subtle hover:text-primary'
                    }
                    after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 
                    after:h-0.5 after:w-1/2
                    after:origin-center after:scale-x-0 
                    after:bg-primary after:transition-transform after:duration-300
                    ${isActive ? 'after:scale-x-100' : 'hover:after:scale-x-100'}
                  `
                }
              >
                {t(link.labelKey)}
              </NavLink>
            ))}
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden items-center space-x-4 lg:flex">
            <Link 
              to="/login" 
              className="
                px-4 py-2 font-sans text-sm font-medium text-text-subtle
                transition-all duration-300 hover:text-primary
              "
            >
              {t('nav.sign_in')}
            </Link>
            <Button 
              asChild 
              className="
                bg-primary font-sans text-sm font-semibold text-primary-foreground 
                shadow-soft transition-all duration-300 
                hover:bg-primary-hover hover:shadow-lifted hover:-translate-y-0.5
    p-0
              "
            >
              <Link to="/register" className="flex items-center justify-between px-5 py-2.5">
                <span>{t('nav.get_started')}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
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

// Refined Mobile Navigation with Elegant Animations
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
              text-text transition-colors duration-300 
              hover:bg-neutral-100 hover:text-primary
            "
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        
        <SheetContent 
          side="right" 
          className="
            w-full max-w-sm border-l border-neutral-200 
            bg-background text-text
          "
        >
          <div className="flex h-full flex-col">
            
            {/* Mobile Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 pb-6">
              <Link 
                to="/" 
                onClick={() => setIsOpen(false)}
                className="transition-opacity hover:opacity-80"
              >
                <Logo />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-text-subtle hover:bg-neutral-100 hover:text-text"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            {/* Mobile Navigation Links */}
            <nav 
              className="flex flex-col space-y-1 py-8" 
              aria-label="Mobile navigation"
            >
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `
                      rounded-elegant px-4 py-3 font-serif text-lg font-medium
                      transition-all duration-300
                      ${isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-text hover:bg-neutral-100 hover:text-primary'
                      }
                    `
                  }
                >
                  {t(link.labelKey)}
                </NavLink>
              ))}
            </nav>
            
            {/* Mobile CTA Buttons */}
            <div className="mt-auto flex flex-col space-y-3 border-t border-neutral-200 pt-6">
              <Button 
                asChild 
                size="lg" 
                className="
                  bg-primary font-sans font-semibold text-primary-foreground 
                  shadow-soft transition-all duration-300 
                  hover:bg-primary-hover hover:shadow-lifted
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
                  border-neutral-300 font-sans font-medium text-text
                  transition-all duration-300 hover:border-primary 
                  hover:bg-neutral-50 hover:text-primary
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
