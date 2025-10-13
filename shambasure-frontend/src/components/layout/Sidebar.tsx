// FILE: src/components/layout/Sidebar.tsx (New & Finalized)

import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, FileText, Users, FileCheck, LifeBuoy, Settings, Shield } from 'lucide-react';
import { useCurrentUser } from '../../store/auth.store';

const mainNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/assets', label: 'Assets', icon: Building2 },
  { to: '/dashboard/wills', label: 'Wills', icon: FileText },
  { to: '/dashboard/families', label: 'Families', icon: Users },
  { to: '/dashboard/documents', label: 'Documents', icon: FileCheck },
];

const adminNav = [
  { to: '/dashboard/admin', label: 'Overview', icon: LayoutDashboard },
  { to: '/dashboard/admin/users', label: 'Users', icon: Users },
  { to: '/dashboard/admin/documents', label: 'Documents', icon: FileCheck },
  
];

export function Sidebar() {
  const user = useCurrentUser();
  const navItems = user?.role === 'ADMIN' ? [...mainNav, { to: '/dashboard/admin', label: 'Admin', icon: Shield }] : mainNav;

  return (
    <aside className="hidden w-64 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col gap-1 p-2">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end // Match route exactly for dashboard home
            className={({ isActive }) => `
              flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
              ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
            `}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto p-2">
         <NavLink
            to="/dashboard/settings"
            className={({ isActive }) => `
              flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
              ${isActive ? 'bg-muted' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
            `}
          >
            <Settings className="h-4 w-4" />
            Settings
          </NavLink>
      </div>
    </aside>
  );
}