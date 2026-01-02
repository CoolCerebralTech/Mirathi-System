// FILE: src/components/common/UserMenu.tsx

import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';

import { useLogout } from '../../features/auth/auth.api';
import { Avatar } from './Avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { Button } from '../ui/Button';
import { usePersistentAuthStore } from '../../store/auth-persistent';

/**
 * A reusable user menu dropdown component, typically placed in the application header.
 * It displays the current user's information and provides links to profile, settings, and logout.
 */
export function UserMenu() {
  const { t } = useTranslation(['header', 'auth']);
  const user = usePersistentAuthStore((state) => state.user);
  const { mutate: logout, isPending } = useLogout();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        // Redirect to login page after successful logout
        navigate('/login');
      },
    });
  };

  if (!user) {
    // This component should only be rendered for authenticated users,
    // so this is a safe fallback.
    return null;
  }

  const fullName = `${user.firstName} ${user.lastName}`;
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 h-auto px-2 py-1.5 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Avatar fallback={initials} />
          <div className="hidden text-left md:block">
            <p className="text-sm font-medium">{fullName}</p>
            <p className="text-xs text-muted-foreground">
              {t(`auth:role_${user.role.toLowerCase()}`)}
            </p>
          </div>
          <ChevronDown className="hidden h-4 w-4 text-muted-foreground md:block" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{fullName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link to="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>{t('profile')}</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>{t('settings')}</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleLogout} 
          disabled={isPending}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isPending ? t('logging_out') : t('sign_out')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
