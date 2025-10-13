// FILE: src/config/nav.config.ts

import { 
  LayoutDashboard,
  Users,
  FileCheck,
  Activity,
  Bell,
  Settings,
  FileText,
  Building2,
  UsersRound,
  LucideIcon
} from 'lucide-react';
import type { UserRole } from '../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  roles?: UserRole[];
  description?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

// ============================================================================
// ADMIN NAVIGATION
// ============================================================================

export const adminNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    roles: ['ADMIN'],
    description: 'Admin overview',
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
    roles: ['ADMIN'],
    description: 'Manage users',
  },
  {
    title: 'Documents',
    href: '/admin/documents',
    icon: FileCheck,
    roles: ['ADMIN'],
    description: 'Review documents',
  },
  {
    title: 'Audit Logs',
    href: '/admin/logs',
    icon: Activity,
    roles: ['ADMIN'],
    description: 'System activity',
  },
  {
    title: 'Templates',
    href: '/admin/templates',
    icon: Bell,
    roles: ['ADMIN'],
    description: 'Notification templates',
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    roles: ['ADMIN'],
    description: 'System settings',
  },
];

// ============================================================================
// USER NAVIGATION
// ============================================================================

export const userNavSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        description: 'Your overview',
      },
    ],
  },
  {
    title: 'Estate Planning',
    items: [
      {
        title: 'Assets',
        href: '/assets',
        icon: Building2,
        description: 'Manage your property',
      },
      {
        title: 'Wills',
        href: '/wills',
        icon: FileText,
        description: 'Create testaments',
      },
      {
        title: 'Families',
        href: '/families',
        icon: UsersRound,
        description: 'Organize heirs',
      },
    ],
  },
  {
    title: 'Documents',
    items: [
      {
        title: 'My Documents',
        href: '/documents',
        icon: FileCheck,
        description: 'Secure vault',
      },
    ],
  },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Filter navigation items based on user role
 */
export const filterNavByRole = (
  items: NavItem[],
  userRole?: UserRole
): NavItem[] => {
  if (!userRole) return [];
  return items.filter((item) => !item.roles || item.roles.includes(userRole));
};

/**
 * Get all navigation items flattened
 */
export const getAllUserNavItems = (): NavItem[] => {
  return userNavSections.flatMap(section => section.items);
};

/**
 * Check if a path is active
 */
export const isPathActive = (currentPath: string, itemPath: string): boolean => {
  if (itemPath === '/dashboard') {
    return currentPath === itemPath;
  }
  return currentPath.startsWith(itemPath);
};