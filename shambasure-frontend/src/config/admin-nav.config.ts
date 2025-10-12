// FILE: src/config/admin-nav.config.ts

import { 
  LayoutDashboard,
  Users,
  FileCheck,
  Activity,
  Bell,
  Settings,
  LucideIcon
} from 'lucide-react';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  roles?: Array<'ADMIN' | 'LAND_OWNER' | 'HEIR'>;
}

// ============================================================================
// ADMIN NAVIGATION CONFIGURATION
// ============================================================================

export const adminNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    roles: ['ADMIN'],
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
    roles: ['ADMIN'],
  },
  {
    title: 'Documents',
    href: '/admin/documents',
    icon: FileCheck,
    roles: ['ADMIN'],
  },
  {
    title: 'Audit Logs',
    href: '/admin/logs',
    icon: Activity,
    roles: ['ADMIN'],
  },
  {
    title: 'Templates',
    href: '/admin/templates',
    icon: Bell,
    roles: ['ADMIN'],
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    roles: ['ADMIN'],
  },
];

/**
 * Filter navigation items based on user role
 */
export const filterNavByRole = (
  items: NavItem[],
  userRole?: 'ADMIN' | 'LAND_OWNER' | 'HEIR'
): NavItem[] => {
  if (!userRole) return [];
  return items.filter((item) => !item.roles || item.roles.includes(userRole));
};