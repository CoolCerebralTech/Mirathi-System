// FILE: src/components/layout/Header.tsx
// VERSION: 1.1.0 - Mirathi Command Center HUD

import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LogOut, 
  User as UserIcon, 
  Settings, 
  Menu, 
  Bell, 
  Search, 
  Calculator, 
  Briefcase 
} from 'lucide-react';
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
import { Logo } from '../common/Logo';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// TYPES
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

interface HeaderProps {
  /** 
   * Optional trigger for the parent layout's sidebar.
   * If provided, overrides the internal Sheet menu.
   */
  onMobileMenuClick?: () => void;
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export function Header({ onMobileMenuClick }: HeaderProps) {
  const user = useCurrentUser();
  const { mutate: logout } = useLogout();
  const { t } = useTranslation(['header', 'common']);
  const navigate = useNavigate();

  // Mock Data for "Economic Truth" (Replace with React Query hook: useEstateSummary)
  const estateSummary = {
    netWorth: "KES 14,500,000",
    status: "SOLVENT", // or "INSOLVENT"
    currency: "KES"
  };

  const getInitials = (firstName = '', lastName = '') =>
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => navigate('/login'),
    });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-neutral-200 bg-white px-4 shadow-sm sm:px-6">
      
      {/* 1. Mobile Trigger */}
      <div className="lg:hidden">
        {onMobileMenuClick ? (
          <Button variant="ghost" size="icon" onClick={onMobileMenuClick}>
            <Menu className="h-5 w-5 text-neutral-600" />
          </Button>
        ) : (
          <MobileNav />
        )}
      </div>
      
      {/* 2. Global Search (The Knowledge Base) */}
      <div className="flex-1 md:max-w-md">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="search"
            placeholder={t('search_placeholder', 'Search assets, heirs, or legal forms...')}
            className="h-10 w-full rounded-md border border-neutral-200 bg-neutral-50 pl-9 pr-4 text-sm outline-none transition-all focus:border-[#0F3D3E] focus:ring-1 focus:ring-[#0F3D3E]"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4">

        {/* 3. The Economic Truth Ticker (Estate Service) */}
        <div className="hidden items-center gap-3 rounded-full border border-neutral-100 bg-neutral-50 px-4 py-1.5 md:flex">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0F3D3E]/10">
            <Calculator className="h-3.5 w-3.5 text-[#0F3D3E]" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              {t('net_worth', 'Net Worth')}
            </span>
            <span className={`text-sm font-bold font-mono ${
              estateSummary.status === 'SOLVENT' ? 'text-[#0F3D3E]' : 'text-red-600'
            }`}>
              {estateSummary.netWorth}
            </span>
          </div>
        </div>

        {/* 4. Notifications (Event-Driven Updates) */}
        <Button variant="ghost" size="icon" className="relative text-neutral-600 hover:bg-neutral-100">
          <Bell className="h-5 w-5" />
          {/* Badge for unread notifications */}
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          <span className="sr-only">Notifications</span>
        </Button>
        
        {/* 5. User Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full focus:ring-0 p-0 hover:bg-[#C8A165]/10">
              <Avatar className="h-9 w-9 border border-neutral-200">
                <AvatarFallback className="bg-[#0F3D3E] text-[#C8A165] font-medium">
                  {getInitials(user?.firstName, user?.lastName)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold leading-none text-[#0F3D3E]">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded bg-neutral-100 px-2 py-1">
                  <Briefcase className="h-3 w-3 text-neutral-500" />
                  <span className="text-[10px] uppercase font-semibold text-neutral-600">Estate Administrator</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/dashboard/profile" className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4 text-neutral-500" />
                {t('profile', 'My Profile')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/dashboard/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4 text-neutral-500" />
                {t('settings', 'System Settings')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700">
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
// MOBILE NAVIGATION (Fallback)
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function MobileNav() {
  useTranslation(['sidebar', 'common']);
  
  // Updated to match the Microservice Domain Architecture
  const navigationGroups = [
    {
      title: 'The Facts',
      items: [
        { to: '/dashboard/family', label: 'Heirs & Family' },
        { to: '/dashboard/guardianship', label: 'Guardianship' },
      ]
    },
    {
      title: 'The Truth',
      items: [
        { to: '/dashboard/assets', label: 'Asset Inventory' },
        { to: '/dashboard/documents', label: 'Document Vault' },
      ]
    },
    {
      title: 'The Law',
      items: [
        { to: '/dashboard/succession', label: 'Succession Roadmap' },
      ]
    }
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 bg-[#0F3D3E] text-white border-r-neutral-800">
        <div className="flex h-16 items-center px-6 border-b border-white/10">
          <Logo className="h-6 text-white" />
        </div>
        
        <nav className="flex flex-col gap-6 p-6 overflow-y-auto">
          {/* Dashboard Link */}
          <Link 
            to="/dashboard" 
            className="flex items-center gap-2 text-sm font-semibold text-[#C8A165]"
          >
             <Briefcase className="h-4 w-4" />
             Command Center
          </Link>

          {/* Grouped Links */}
          {navigationGroups.map((group) => (
            <div key={group.title} className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/40">
                {group.title}
              </h4>
              <div className="flex flex-col space-y-1">
                {group.items.map(item => (
                  <Link 
                    key={item.to} 
                    to={item.to} 
                    className="block rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}