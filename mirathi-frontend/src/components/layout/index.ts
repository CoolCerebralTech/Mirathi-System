// FILE: src/components/layouts/index.ts

/**
 * Centralized exports for all layout components
 * Import layouts like: import { DashboardLayout, AuthLayout } from '@/components/layouts'
import { AdminLayout } from './AdminLayout';
 */

// Dashboard (Protected)
export { DashboardLayout } from './DashboardLayout';
export { Sidebar } from './Sidebar';
export { Header } from './Header';

// Authentication
export { AuthLayout } from './AuthLayout';
export { AdminLayout } from './AdminLayout';

// Public (Marketing)
export { PublicLayout } from './PublicLayout';
export { PublicHeader } from './PublicHeader';
export { PublicFooter } from './PublicFooter';