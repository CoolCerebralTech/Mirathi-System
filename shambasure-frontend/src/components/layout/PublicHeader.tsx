// FILE: src/components/layout/PublicHeader.tsx

import { Link, NavLink } from 'react-router-dom';
import { Button } from '../ui/Button';

const navLinks = [
  { label: 'Features', to: '/features' },
  { label: 'About Us', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">Shamba Sure</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navLinks.map(link => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => 
                isActive ? "text-foreground" : "text-muted-foreground transition-colors hover:text-foreground"
              }>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button variant="ghost" asChild>
            <Link to="/auth/login">Sign In</Link>
          </Button>
          <Button asChild>
            <Link to="/auth/register">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}