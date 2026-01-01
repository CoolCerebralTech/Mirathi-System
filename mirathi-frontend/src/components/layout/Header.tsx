// FILE: src/components/layout/Header.tsx

import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, User as UserIcon, Settings, Menu, Leaf } from 'lucide-react';
import { useCurrentUser } from '../../store/auth.store';
import { useLogout } from '../../features/auth/auth.api';

import { Button } from '../ui/Button';
import { Avatar, AvatarFallback } from '../common/Avatar'; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { Sheet, SheetContent, SheetTrigger } from '../ui/Sheet';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export function Header() {
  const user = useCurrentUser();
  const { mutate: logout } = useLogout();
  const { t } = useTranslation(['header', 'common']);
  const navigate = useNavigate();

  // Helper to generate initials string
  const getInitials = (firstName = '', lastName = '') =>
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => navigate('/login'),
    });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <MobileNav />
      
      <div className="flex-1">
        {/* Breadcrumbs or global search can be added here */}
      </div>
      
      <div className="flex items-center gap-4">
        
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full focus:ring-0 p-0">
              {/* FIX: Use Compound Component Pattern */}
              <Avatar className="h-9 w-9">
                {/* Optional: Add AvatarImage here if user has a photoUrl */}
                {/* <AvatarImage src={user?.photoUrl} alt="User" /> */}
                <AvatarFallback>
                  {getInitials(user?.firstName, user?.lastName)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{`${user?.firstName} ${user?.lastName}`}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/dashboard/profile">
                <UserIcon className="mr-2 h-4 w-4" />
                {t('profile', 'Profile')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/dashboard/settings">
                <Settings className="mr-2 h-4 w-4" />
                {t('settings', 'Settings')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              {t('sign_out', 'Sign out')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// CHILD COMPONENTS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function MobileNav() {
  const { t } = useTranslation(['sidebar', 'common']);
  
  // Navigation matching Sidebar.tsx
  const mobileNav = [
    { to: '/dashboard', labelKey: 'nav.dashboard', defaultLabel: 'Dashboard' },
    { to: '/dashboard/estates', labelKey: 'nav.estates', defaultLabel: 'Estates' },
    { to: '/dashboard/families', labelKey: 'nav.families', defaultLabel: 'Families' },
    { to: '/dashboard/guardianship', labelKey: 'nav.guardianship', defaultLabel: 'Guardianship' },
    { to: '/dashboard/documents', labelKey: 'nav.documents', defaultLabel: 'Digital Vault' },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="sm:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <nav className="flex flex-col gap-1 p-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold mb-6 px-3">
             <Leaf className="h-6 w-6 text-primary" />
             <span className="text-lg">{t('common:app_name', 'Mirathi')}</span>
          </Link>
          {mobileNav.map(item => (
            <Link 
              key={item.to} 
              to={item.to} 
              className="rounded-md px-3 py-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {t(item.labelKey, item.defaultLabel)}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}