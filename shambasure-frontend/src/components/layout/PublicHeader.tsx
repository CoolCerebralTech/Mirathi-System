// FILE: src/components/layout/PublicHeader.tsx

import * as React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Leaf, Menu } from 'lucide-react';

import { Button } from '../ui/Button'; // Your new, fixed Button
import { Sheet, SheetContent, SheetTrigger } from '../ui/Sheet';

export function PublicHeader() {
  const { t } = useTranslation(['public_header', 'common']);

  const navLinks = React.useMemo(() => [
    { labelKey: 'nav.features', to: '/features' },
    { labelKey: 'nav.about', to: '/about' },
    { labelKey: 'nav.contact', to: '/contact' },
  ], []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <Leaf className="h-6 w-6 text-primary" />
            <span className="font-bold">{t('common:app_name')}</span>
          </Link>
          <nav className="hidden items-center space-x-6 text-sm font-medium md:flex">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => isActive ? 'text-foreground' : 'text-muted-foreground transition-colors hover:text-foreground'}>
                {t(link.labelKey)}
              </NavLink>
            ))}
          </nav>
        </div>

        <MobileNav navLinks={navLinks} />

        <div className="hidden flex-1 items-center justify-end space-x-2 md:flex">
          {/* --- This will now work correctly --- */}
          <Button variant="ghost" asChild>
            <Link to="/login">{t('nav.sign_in')}</Link>
          </Button>
          <Button asChild>
            <Link to="/register">{t('nav.get_started')}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

// MobileNav is also corrected to use asChild again
function MobileNav({ navLinks }: { navLinks: { labelKey: string; to: string }[] }) {
  const { t } = useTranslation(['public_header', 'common']);
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="flex flex-1 justify-end md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full max-w-sm">
          <div className="p-4">
            <Link to="/" className="mb-8 flex items-center space-x-2" onClick={() => setIsOpen(false)}>
              <Leaf className="h-6 w-6 text-primary" />
              <span className="font-bold">{t('common:app_name')}</span>
            </Link>
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link key={link.to} to={link.to} className="text-lg text-muted-foreground" onClick={() => setIsOpen(false)}>
                  {t(link.labelKey)}
                </Link>
              ))}
            </nav>
            <div className="mt-8 flex flex-col space-y-2 border-t pt-6">
              <Button variant="outline" asChild size="lg"><Link to="/login" onClick={() => setIsOpen(false)}>{t('nav.sign_in')}</Link></Button>
              <Button asChild size="lg"><Link to="/register" onClick={() => setIsOpen(false)}>{t('nav.get_started')}</Link></Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
