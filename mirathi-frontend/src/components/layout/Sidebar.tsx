// FILE: src/components/layout/Sidebar.tsx

import * as React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Building2,
  FileText,
  Users,
  FileCheck,
  Settings,
  Shield,
  Leaf,
  BarChart3
} from 'lucide-react';
import { useCurrentUser } from '../../store/auth.store';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// TYPE DEFINITIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

type NavItem = {
  to: string;
  labelKey: string;
  icon: React.ElementType;
  end?: boolean;
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

/**
 * The main sidebar navigation for the authenticated application dashboard.
 * It displays different navigation items based on the user's role.
 */
export function Sidebar() {
  const { t } = useTranslation(['sidebar', 'common']);
  const user = useCurrentUser();

  // Memoize navigation arrays to re-calculate only when language changes
  const mainNav = React.useMemo<NavItem[]>(() => [
    { to: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard, end: true },
    { to: '/assets', labelKey: 'nav.assets', icon: Building2 },
    { to: '/wills', labelKey: 'nav.wills', icon: FileText },
    { to: '/families', labelKey: 'nav.families', icon: Users },
    { to: '/documents', labelKey: 'nav.documents', icon: FileCheck },
  ], []);

  const adminNav = React.useMemo<NavItem[]>(() => [
    { to: '/admin', labelKey: 'nav.admin_overview', icon: Shield, end: true },
    { to: '/admin/users', labelKey: 'nav.admin_users', icon: Users },
    { to: '/admin/documents', labelKey: 'nav.admin_documents', icon: FileCheck },
    { to: '/admin/auditing', labelKey: 'nav.admin_auditing', icon: BarChart3 },
  ], []);

  return (
    <aside className="hidden w-64 flex-shrink-0 flex-col border-r bg-background sm:flex">
      <div className="flex h-16 items-center border-b px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Leaf className="h-6 w-6 text-primary" />
          <span>{t('common:app_name')}</span>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="flex flex-col gap-1 p-4">
          <SidebarNav items={mainNav} t={t} />
          {user?.role === 'ADMIN' && (
            <div className="mt-4">
               <h3 className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                  {t('admin_section_title')}
                </h3>
              <SidebarNav items={adminNav} t={t} />
            </div>
          )}
        </nav>
      </div>
      <div className="mt-auto border-t p-4">
        <NavLink
          to="/settings"
          className={({ isActive }) => `
            flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
            ${isActive ? 'bg-muted' : 'text-muted-foreground hover:bg-muted/50'}`
          }
        >
          <Settings className="h-4 w-4" />
          {t('nav.settings')}
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
  t: (key: string) => string;
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
            flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors
            ${isActive
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`
          }
        >
          <item.icon className="h-4 w-4" />
          {t(item.labelKey)}
        </NavLink>
      ))}
    </div>
  );
}
