// FILE: src/components/layouts/PublicHeader.tsx

import { NavLink, Link } from 'react-router-dom';
import { Button } from '../ui/Button';

// A simple SVG for a logo placeholder.
const LogoPlaceholder = () => (
    <svg 
        className="h-8 w-auto text-primary" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z" />
    </svg>
);

const publicNavLinks = [
    { to: '/', text: 'Home' },
    { to: '/about', text: 'About Us' },
    { to: '/contact', text: 'Contact' },
];

export function PublicHeader() {
    const navLinkClasses = 'text-sm font-medium text-muted-foreground transition-colors hover:text-primary';
    const activeLinkClasses = 'text-primary';

    return (
        <header className="sticky top-0 z-40 w-full border-b bg-background">
            <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
                <div className="flex gap-6 md:gap-10">
                    <Link to="/" className="flex items-center space-x-2">
                        <LogoPlaceholder />
                        <span className="inline-block font-bold">Shamba Sure</span>
                    </Link>
                    <nav className="hidden gap-6 md:flex">
                        {publicNavLinks.map(link => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                end={link.to === '/'}
                                className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}
                            >
                                {link.text}
                            </NavLink>
                        ))}
                    </nav>
                </div>

                <div className="flex flex-1 items-center justify-end space-x-4">
                    <Button asChild>
                        <Link to="/login">Sign In</Link>
                    </Button>
                </div>
            </div>
        </header>
    );
}