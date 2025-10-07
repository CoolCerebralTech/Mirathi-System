// FILE: src/components/layouts/Sidebar.tsx

import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Landmark,
  FileText,
  Users,
  Scroll,
  LifeBuoy,
  Settings,
} from 'lucide-react';

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

// Define the navigation links
const mainNavLinks = [
  { to: '/dashboard', icon: LayoutDashboard, text: 'Dashboard' },
  { to: '/assets', icon: Landmark, text: 'Assets' },
  { to: '/wills', icon: Scroll, text: 'Wills' },
  { to: '/documents', icon: FileText, text: 'Documents' },
  { to: '/family', icon: Users, text: 'Family (HeirLink™)' },
];

const secondaryNavLinks = [
    { to: '/support', icon: LifeBuoy, text: 'Support' },
    { to: '/settings', icon: Settings, text: 'Settings' },
];

interface SidebarProps {
  isMobileOpen: boolean;
}

export function Sidebar({ isMobileOpen }: SidebarProps) {
  const navLinkClasses = 'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary';
  const activeLinkClasses = 'bg-muted text-primary';

  return (
    <aside
      className={clsx(
        'fixed inset-y-0 left-0 z-10 flex-col border-r bg-background sm:flex w-64',
        {
          'flex': isMobileOpen,      // Show on mobile if isMobileOpen is true
          'hidden': !isMobileOpen,   // Hide on mobile if isMobileOpen is false
        }
      )}
    >
        <div className="flex h-16 shrink-0 items-center border-b px-6">
            <LogoPlaceholder />
            <span className="ml-2 font-bold text-lg">Shamba Sure</span>
        </div>
        <nav className="flex flex-1 flex-col gap-4 p-4">
            <div className="flex-1">
                {mainNavLinks.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        end // Use 'end' for the Dashboard link to avoid it being always active
                        className={({ isActive }) =>
                            clsx(navLinkClasses, isActive && activeLinkClasses)
                        }
                    >
                        <link.icon className="h-4 w-4" />
                        {link.text}
                    </NavLink>
                ))}
            </div>

            {/* Separator */}
            <hr className="my-2 border-t" />

            <div>
                 {secondaryNavLinks.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                            clsx(navLinkClasses, isActive && activeLinkClasses)
                        }
                    >
                        <link.icon className="h-4 w-4" />
                        {link.text}
                    </NavLink>
                ))}
            </div>
        </nav>
    </aside>
  );
}