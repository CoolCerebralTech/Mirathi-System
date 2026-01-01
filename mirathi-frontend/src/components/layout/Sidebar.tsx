// FILE: src/components/layout/Sidebar.tsx

import * as React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { type TFunction } from 'i18next';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileCheck,
  Settings,
  Shield,
  Leaf
} from 'lucide-react';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// TYPE DEFINITIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

type NavItem = {
  to: string;
  labelKey: string;
  defaultLabel: string;
  icon: React.ElementType;
  end?: boolean;
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export function Sidebar() {
  const { t } = useTranslation(['sidebar', 'common']);

  // Navigation Items mapped to the AppRouter structure
  const mainNav = React.useMemo<NavItem[]>(() => [
    { 
      to: '/dashboard', 
      labelKey: 'nav.dashboard', 
      defaultLabel: 'Dashboard',
      icon: LayoutDashboard, 
      end: true 
    },
    { 
      to: '/dashboard/estates', 
      labelKey: 'nav.estates', 
      defaultLabel: 'Estates',
      icon: Building2 
    },
    { 
      to: '/dashboard/families', 
      labelKey: 'nav.families', 
      defaultLabel: 'Families',
      icon: Users 
    },
    { 
      to: '/dashboard/guardianship', 
      labelKey: 'nav.guardianship', 
      defaultLabel: 'Guardianship',
      icon: Shield 
    },
    { 
      to: '/dashboard/documents', 
      labelKey: 'nav.documents', 
      defaultLabel: 'Digital Vault',
      icon: FileCheck 
    },
  ], []);

  return (
    <aside className="hidden w-64 flex-shrink-0 flex-col border-r bg-background sm:flex">
      <div className="flex h-16 items-center border-b px-6">
        <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
          <Leaf className="h-6 w-6 text-primary" />
          <span className="text-lg tracking-tight text-slate-900">
            {t('common:app_name', 'Mirathi')}
          </span>
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <nav className="flex flex-col gap-1 p-4">
          <SidebarNav items={mainNav} t={t} />
        </nav>
      </div>

      <div className="mt-auto border-t p-4">
        <NavLink
          to="/dashboard/settings"
          className={({ isActive }) => `
            flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
            ${isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`
          }
        >
          <Settings className="h-4 w-4" />
          {t('nav.settings', 'Settings')}
        </NavLink>
      </div>
    </aside>
  );
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// CHILD COMPONENT FOR NAVIGATION LIST
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

interface SidebarNavProps {
  items: NavItem[];
  t: TFunction<['sidebar', 'common']>; // FIX: Applied correct type here
}

function SidebarNav({ items, t }: SidebarNavProps) {
  return (
    <div className="flex flex-col gap-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `
            flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors
            ${isActive
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`
          }
        >
          <item.icon className="h-4 w-4" />
          {t(item.labelKey, item.defaultLabel)}
        </NavLink>
      ))}
    </div>
  );
}