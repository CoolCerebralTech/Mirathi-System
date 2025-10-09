// FILE: src/components/layouts/Sidebar.tsx

import * as React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/auth.store';
import {
  LayoutDashboard,
  Landmark,
  FileText,
  Users,
  ScrollText,
  LifeBuoy,
  Settings,
  Shield,
  Bell,
  FileBarChart,
  X,
} from 'lucide-react';
import { Button } from '../ui/Button';

// Logo Component
const Logo = () => (
  <div className="flex items-center gap-2">
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
      <Landmark className="h-5 w-5" />
    </div>
    <span className="font-bold text-lg">Shamba Sure</span>
  </div>
);

// Navigation Link Configuration
const navigationConfig = {
  main: [
    { to: '/dashboard', icon: LayoutDashboard, text: 'Dashboard', end: true },
    { to: '/dashboard/assets', icon: Landmark, text: 'Assets' },
    { to: '/dashboard/wills', icon: ScrollText, text: 'Wills' },
    { to: '/dashboard/documents', icon: FileText, text: 'Documents' },
    { to: '/dashboard/families', icon: Users, text: 'Family' },
  ],
  secondary: [
    { to: '/dashboard/notifications', icon: Bell, text: 'Notifications' },
    { to: '/dashboard/support', icon: LifeBuoy, text: 'Support' },
    { to: '/dashboard/settings', icon: Settings, text: 'Settings' },
  ],
  admin: [
    { to: '/dashboard/admin/users', icon: Users, text: 'Users' },
    { to: '/dashboard/admin/audit-logs', icon: FileBarChart, text: 'Audit Logs' },
    { to: '/dashboard/admin/templates', icon: FileText, text: 'Templates' },
  ],
};

interface SidebarProps {
  isMobileOpen: boolean;
  onClose?: () => void;
}

export function Sidebar({ isMobileOpen, onClose }: SidebarProps) {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'ADMIN';

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 sm:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-background transition-transform duration-300 sm:translate-x-0 sm:z-10',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Logo />
          {/* Mobile Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
          {/* Main Navigation */}
          <div className="space-y-1">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Main
            </p>
            {navigationConfig.main.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )
                }
              >
                <link.icon className="h-4 w-4 shrink-0" />
                <span>{link.text}</span>
              </NavLink>
            ))}
          </div>

          {/* Admin Navigation */}
          {isAdmin && (
            <div className="mt-4 space-y-1">
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Shield className="mr-1 inline-block h-3 w-3" />
                Admin
              </p>
              {navigationConfig.admin.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )
                  }
                >
                  <link.icon className="h-4 w-4 shrink-0" />
                  <span>{link.text}</span>
                </NavLink>
              ))}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Secondary Navigation */}
          <div className="space-y-1 border-t pt-4">
            {navigationConfig.secondary.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )
                }
              >
                <link.icon className="h-4 w-4 shrink-0" />
                <span>{link.text}</span>
              </NavLink>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}