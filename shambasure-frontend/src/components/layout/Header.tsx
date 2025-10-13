// FILE: src/components/layout/Header.tsx

import { Link } from 'react-router-dom';
import { LogOut, User as UserIcon, Settings } from 'lucide-react';
import { useCurrentUser, useAuthActions } from '../../store/auth.store';
import { Button } from '../ui/Button';
import { Avatar } from '../common/Avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/DropdownMenu';

export function Header() {
  const user = useCurrentUser();
  const { logout } = useAuthActions();

  const getInitials = (firstName = '', lastName = '') => `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-6">
      <div className="flex-1">
        {/* Can add Breadcrumbs or a global search here later */}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar fallback={getInitials(user?.firstName, user?.lastName)} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild><Link to="/dashboard/profile"><UserIcon className="mr-2 h-4 w-4" />Profile</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link to="/dashboard/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link></DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => logout()}><LogOut className="mr-2 h-4 w-4" />Sign Out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}