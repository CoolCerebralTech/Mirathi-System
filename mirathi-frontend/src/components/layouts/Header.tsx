import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LogOut, 
  User as UserIcon, 
  Settings, 
  Menu, 
  Calculator,
  Scale
} from 'lucide-react';

import { useCurrentUser } from '@/features/user/user.api';
import { useEstateSummary } from '@/features/estate/estate.api';
import { useLogout } from '@/features/auth/auth.api';

import { Button } from '@/components/ui/Button';
import { Avatar, AvatarFallback } from '@/components/common/Avatar'; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Skeleton } from '@/components/ui/Skeleton';

interface HeaderProps {
  onMobileMenuClick: () => void;
}

export function Header({ onMobileMenuClick }: HeaderProps) {
  const { t } = useTranslation(['header', 'common']);
  const navigate = useNavigate();
  
  // Data Fetching
  const { data: user, isLoading: isLoadingUser } = useCurrentUser();
  const { data: estateSummary, isLoading: isLoadingEstate } = useEstateSummary(
    user?.id || '', 
    { enabled: !!user?.id }
  );
  
  const { mutate: logout } = useLogout();

  // Handlers
  const handleLogout = () => {
    logout(undefined, { onSuccess: () => navigate('/login') });
  };

  const overview = estateSummary?.overview;
  const initials = user ? `${(user.firstName?.[0] || '').toUpperCase()}${(user.lastName?.[0] || '').toUpperCase()}` : 'U';

  // Currency Formatter
  const formatCurrency = (amount: number, currency: string = 'KES') => 
    new Intl.NumberFormat('en-KE', { 
      style: 'currency', 
      currency, 
      minimumFractionDigits: 0 
    }).format(amount);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6 lg:px-8">
      
      {/* 1. Mobile Trigger (Left) */}
      <div className="flex items-center lg:hidden">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onMobileMenuClick} 
          className="text-slate-500 hover:text-slate-900 -ml-2"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Open sidebar</span>
        </Button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* 2. Right Actions */}
      <div className="flex items-center gap-3 sm:gap-6">
        
        {/* A. Net Worth Indicator (Visible on Desktop) */}
        {/* This acts as a 'Status Monitor' for the user's primary goal: The Estate */}
        <div className="hidden md:block">
          {isLoadingEstate ? (
            <div className="flex items-center gap-3 px-4 py-1.5 rounded-full border border-slate-100 bg-slate-50">
              <Skeleton className="h-4 w-24" />
            </div>
          ) : overview ? (
            <Link
              to="/dashboard/estate"
              className="group flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-1.5 transition-all hover:border-[#C8A165]/50 hover:shadow-sm"
            >
              <div className={
                `flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold 
                ${overview.isInsolvent ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`
              }>
                <Calculator className="h-3.5 w-3.5" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#C8A165] transition-colors">
                  Current Net Worth
                </span>
                <span className={`text-sm font-bold ${overview.isInsolvent ? 'text-red-600' : 'text-slate-900'}`}>
                  {formatCurrency(overview.netWorth, overview.currency)}
                </span>
              </div>
            </Link>
          ) : null}
        </div>

        {/* B. User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 hover:bg-slate-100 focus:ring-2 focus:ring-[#0F3D3E] focus:ring-offset-2">
              {isLoadingUser ? (
                <Skeleton className="h-9 w-9 rounded-full" />
              ) : (
                <Avatar className="h-9 w-9 border border-slate-200">
                  <AvatarFallback className="bg-[#0F3D3E] text-white font-medium text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-slate-900 leading-none">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-slate-500 leading-none truncate">
                  {user?.email}
                </p>
                {user?.role && (
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      <Scale className="h-3 w-3" />
                      {user.role}
                    </span>
                  </div>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/dashboard/profile" className="cursor-pointer">
                <UserIcon className="mr-2 h-4 w-4 text-slate-500" />
                {t('profile', 'Profile')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/dashboard/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4 text-slate-500" />
                {t('settings', 'Settings')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="text-red-600 focus:bg-red-50 focus:text-red-700 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t('sign_out', 'Sign out')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}