// FILE: src/components/layout/Header.tsx
// VERSION: 2.0.0 - Mirathi Estate Management System

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
  Briefcase,
  Home,
  Users,
  Scale,
  FileText,
  TrendingUp,
  Shield
} from 'lucide-react';
import { useCurrentUser } from '@/features/user/user.api';
import { useEstateSummary } from '@/features/estate/estate.api';
import { useLogout } from '@/features/auth/auth.api';

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
import { Skeleton } from '../ui/Skeleton';

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
  const { t } = useTranslation(['header', 'common']);
  const navigate = useNavigate();
  
  // Fetch current user
  const { data: user, isLoading: isLoadingUser } = useCurrentUser();
  const userId = user?.id;
  
  // Fetch estate summary for net worth display
  const { data: estateSummary, isLoading: isLoadingEstate } = useEstateSummary(
    userId || '', 
    { enabled: !!userId }
  );
  
  // Logout mutation
  const { mutate: logout } = useLogout();

  // Format currency for display
  const formatCurrency = (amount: number, currency: string = 'KES'): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getInitials = (firstName = '', lastName = '') =>
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';

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
      
      {/* 2. Logo (visible on mobile when no sidebar) */}
      <div className="lg:hidden">
        <Link to="/dashboard">
          <Logo className="h-6" />
        </Link>
      </div>

      {/* 3. Global Search */}
      <div className="flex-1 md:max-w-md">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
          <input
            type="search"
            placeholder={t('search_placeholder', 'Search assets, documents, or family...')}
            className="h-10 w-full rounded-md border border-neutral-200 bg-neutral-50 pl-9 pr-4 text-sm outline-none transition-all focus:border-[#0F3D3E] focus:ring-1 focus:ring-[#0F3D3E]"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4">

        {/* 4. Net Worth Display (Estate Service - Real Data) */}
        {isLoadingEstate ? (
          <div className="hidden md:flex items-center gap-3 rounded-full border border-neutral-100 bg-neutral-50 px-4 py-1.5">
            <Skeleton className="h-6 w-6 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-2 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ) : estateSummary ? (
          <Link 
            to="/dashboard/estate"
            className="hidden items-center gap-3 rounded-full border border-neutral-100 bg-neutral-50 px-4 py-1.5 transition-all hover:border-[#0F3D3E] hover:bg-[#0F3D3E]/5 md:flex"
          >
            <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
              estateSummary.isInsolvent 
                ? 'bg-red-100' 
                : 'bg-[#0F3D3E]/10'
            }`}>
              <Calculator className={`h-3.5 w-3.5 ${
                estateSummary.isInsolvent 
                  ? 'text-red-600' 
                  : 'text-[#0F3D3E]'
              }`} />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                {t('net_worth', 'Net Worth')}
              </span>
              <span className={`text-sm font-bold font-mono ${
                estateSummary.isInsolvent ? 'text-red-600' : 'text-[#0F3D3E]'
              }`}>
                {formatCurrency(estateSummary.netWorth, estateSummary.currency)}
              </span>
            </div>
            {/* Insolvency Warning Badge */}
            {estateSummary.isInsolvent && (
              <div className="ml-1 flex h-5 items-center rounded bg-red-100 px-1.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-red-700">
                  Insolvent
                </span>
              </div>
            )}
          </Link>
        ) : null}

        {/* 5. Notifications */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative text-neutral-600 hover:bg-neutral-100"
        >
          <Bell className="h-5 w-5" />
          {/* Badge for unread notifications */}
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          <span className="sr-only">Notifications</span>
        </Button>
        
        {/* 6. User Profile Menu */}
        {isLoadingUser ? (
          <Skeleton className="h-9 w-9 rounded-full" />
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-9 w-9 rounded-full focus:ring-0 p-0 hover:bg-[#C8A165]/10"
              >
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
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : 'User'
                    }
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                  {user?.emailVerified && (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded bg-green-100 px-2 py-1 w-fit">
                      <Shield className="h-3 w-3 text-green-600" />
                      <span className="text-[10px] uppercase font-semibold text-green-700">
                        Verified
                      </span>
                    </div>
                  )}
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
                  {t('settings', 'Settings')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout} 
                className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-700"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t('sign_out', 'Sign out')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// MOBILE NAVIGATION
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

function MobileNav() {
  useTranslation(['sidebar', 'common']);
  
  // Navigation structure matching Mirathi system
  const navigationGroups = [
    {
      title: 'Overview',
      items: [
        { 
          to: '/dashboard', 
          label: 'Dashboard', 
          icon: Home 
        },
      ]
    },
    {
      title: 'Estate Management',
      items: [
        { 
          to: '/dashboard/estate', 
          label: 'Estate Overview', 
          icon: Briefcase 
        },
        { 
          to: '/dashboard/estate/assets', 
          label: 'Assets', 
          icon: TrendingUp 
        },
        { 
          to: '/dashboard/estate/debts', 
          label: 'Debts', 
          icon: Scale 
        },
        { 
          to: '/dashboard/estate/will', 
          label: 'Will', 
          icon: FileText 
        },
      ]
    },
    {
      title: 'Family Service',
      items: [
        { 
          to: '/dashboard/family', 
          label: 'Family Tree', 
          icon: Users 
        },
        { 
          to: '/dashboard/family/heirs', 
          label: 'Heirs Analysis', 
          icon: Users 
        },
        { 
          to: '/dashboard/family/guardianships', 
          label: 'Guardianship', 
          icon: Shield 
        },
      ]
    },
    {
      title: 'Account',
      items: [
        { 
          to: '/dashboard/profile', 
          label: 'Profile', 
          icon: UserIcon 
        },
        { 
          to: '/dashboard/settings', 
          label: 'Settings', 
          icon: Settings 
        },
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
      <SheetContent 
        side="left" 
        className="w-72 p-0 bg-[#0F3D3E] text-white border-r-neutral-800"
      >
        <div className="flex h-16 items-center px-6 border-b border-white/10">
          <Logo className="h-6 text-white" />
        </div>
        
        <nav className="flex flex-col gap-6 p-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {navigationGroups.map((group) => (
            <div key={group.title} className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/40">
                {group.title}
              </h4>
              <div className="flex flex-col space-y-1">
                {group.items.map(item => {
                  const Icon = item.icon;
                  return (
                    <Link 
                      key={item.to} 
                      to={item.to} 
                      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}