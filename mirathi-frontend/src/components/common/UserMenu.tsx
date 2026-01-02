// FILE: src/components/common/UserMenu.tsx

import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Settings, LogOut, ChevronDown, Shield } from 'lucide-react';

import { useLogout } from '@/features/auth/auth.api';
import { useCurrentUser } from '../../store/auth.store';
import { Avatar, AvatarFallback, AvatarImage } from './Avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { Button } from '../ui/Button';

/**
 * A reusable user menu dropdown component.
 * Displays current user info (from Store) and navigation links.
 */
export function UserMenu() {
  const { t } = useTranslation(['header', 'auth', 'common']);
  const user = useCurrentUser();
  const { mutate: logout, isPending } = useLogout();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        navigate('/login');
      },
    });
  };

  if (!user) {
    return null;
  }

  // --- Data Extraction (GraphQL Schema Adapter) ---
  
  // Profile might be null if onboarding isn't complete, so we fallback to displayName
  const firstName = user.profile?.firstName || user.displayName?.split(' ')[0] || 'User';
  const lastName = user.profile?.lastName || '';
  const fullName = user.profile?.fullName || user.displayName || 'User';
  
  // Initials for Avatar
  const initials = `${firstName.charAt(0)}${lastName.charAt(0) || ''}`.toUpperCase();

  // Email is now in identities array (Google Auth)
  const email = user.identities?.find(id => id.provider === 'GOOGLE')?.email 
    || user.identities?.[0]?.email 
    || 'No Email';

  const isVerified = user.role === 'VERIFIER' || user.role === 'ADMIN';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 h-auto px-2 py-1.5 hover:bg-slate-800/50 focus-visible:ring-amber-500 rounded-full md:rounded-md pr-1 md:pr-3"
        >
          {/* ✅ FIXED AVATAR */}
          <Avatar className="h-8 w-8 border border-slate-700">
            <AvatarImage
              src={user.profile?.avatarUrl || undefined}
              alt={fullName}
            />
            <AvatarFallback>
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="hidden text-left md:block">
            <p className="text-sm font-medium text-slate-200 leading-none">
              {fullName}
            </p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              {isVerified && (
                <Shield className="h-3 w-3 text-amber-500" />
              )}
              {t(`auth:role_${user.role.toLowerCase()}`, user.role)}
            </p>
          </div>

          <ChevronDown className="hidden h-4 w-4 text-slate-500 md:block ml-1" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 bg-slate-950 border-slate-800 text-slate-200">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-white">{fullName}</p>
            <p className="text-xs leading-none text-slate-500 truncate">{email}</p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="bg-slate-800" />
        
        <DropdownMenuItem asChild className="focus:bg-slate-800 focus:text-white cursor-pointer">
          <Link to="/dashboard/profile">
            <User className="mr-2 h-4 w-4 text-amber-500" />
            <span>{t('header:profile', 'My Profile')}</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild className="focus:bg-slate-800 focus:text-white cursor-pointer">
          <Link to="/dashboard/settings">
            <Settings className="mr-2 h-4 w-4 text-amber-500" />
            <span>{t('header:settings', 'Settings')}</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-slate-800" />
        
        <DropdownMenuItem 
          onClick={handleLogout} 
          disabled={isPending}
          className="cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-950/20"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isPending ? t('common:processing', 'Processing...') : t('auth:sign_out', 'Sign Out')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}