// FILE: src/components/layout/Header.tsx

import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, User as UserIcon, Settings, Bell, Menu, Leaf } from 'lucide-react';
import { useCurrentUser } from '../../store/auth.store';
import { useLogout } from '../../features/auth/auth.api';
import { useNotifications, useNotificationStats } from '../../features/notifications/notifications.api';

import { Button } from '../ui/Button';
import { Avatar } from '../common/Avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { Sheet, SheetContent, SheetTrigger } from '../ui/Sheet';
import { Badge } from '../ui/Badge';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export function Header() {
  const user = useCurrentUser();
  const { mutate: logout } = useLogout();
  const { t } = useTranslation(['header', 'common']);
  const navigate = useNavigate();

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
        <NotificationMenu />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar fallback={getInitials(user?.firstName, user?.lastName)} />
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
              <Link to="/profile"><UserIcon className="mr-2 h-4 w-4" />{t('profile')}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings"><Settings className="mr-2 h-4 w-4" />{t('settings')}</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              {t('sign_out')}
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

function NotificationMenu() {
  const { t } = useTranslation(['header']);
  const { data: stats } = useNotificationStats();
  const { data: notifications } = useNotifications({ limit: 5 });
  const unreadCount = stats?.unreadCount ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel>{t('notifications')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {notifications?.data && notifications.data.length > 0 ? (
            notifications.data.map((n) => (
              <DropdownMenuItem key={n.id} asChild>
                <Link to={n.link || '#'} className="flex flex-col items-start !whitespace-normal">
                  <p className="font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.body}</p>
                </Link>
              </DropdownMenuItem>
            ))
          ) : (
            <p className="p-4 text-center text-sm text-muted-foreground">{t('no_notifications')}</p>
          )}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/notifications" className="justify-center text-sm text-primary">
            {t('view_all_notifications')}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileNav() {
  const { t } = useTranslation(['sidebar']);
  // We can re-use the same nav config from the main Sidebar
  // For simplicity here, we'll define a minimal version
  const mobileNav = [
    { to: '/', labelKey: 'nav.dashboard' },
    { to: '/assets', labelKey: 'nav.assets' },
    { to: '/wills', labelKey: 'nav.wills' },
    { to: '/families', labelKey: 'nav.families' },
    { to: '/documents', labelKey: 'nav.documents' },
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
          <Link to="/" className="flex items-center gap-2 font-semibold mb-4 px-3">
             <Leaf className="h-6 w-6 text-primary" />
             <span className="text-lg">{t('common:app_name')}</span>
          </Link>
          {mobileNav.map(item => (
            <Link key={item.to} to={item.to} className="rounded-md px-3 py-2 text-muted-foreground hover:bg-muted">
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
