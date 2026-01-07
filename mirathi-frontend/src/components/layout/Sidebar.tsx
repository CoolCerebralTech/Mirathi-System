// FILE: src/components/layout/Sidebar.tsx
// Modern, production-ready sidebar with actual working pages

import * as React from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Settings,
  User,
  GitBranch,
  Scale,
  ShieldCheck,
  Wallet,
  TrendingUp,
  ScrollText,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

import { Logo } from '../common/Logo';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// TYPE DEFINITIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

type NavItem = {
  to: string;
  label: string;
  icon: React.ElementType;
  end?: boolean;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  description?: string;
  subItems?: NavItem[];
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export function Sidebar() {
  const location = useLocation();
  const [expandedSection, setExpandedSection] = React.useState<string | null>(null);

  // Navigation structure - grouped by service
  const navigation: NavItem[] = React.useMemo(() => [
    {
      to: '/dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
      end: true,
      description: 'Your command center'
    },
    {
      to: '/dashboard/estate',
      label: 'Estate',
      icon: Building2,
      description: 'Assets & Net Worth',
      subItems: [
        {
          to: '/dashboard/estate',
          label: 'Dashboard',
          icon: TrendingUp,
          end: true,
        },
        {
          to: '/dashboard/estate/assets',
          label: 'Assets',
          icon: Wallet,
        },
        {
          to: '/dashboard/estate/debts',
          label: 'Debts',
          icon: FileText,
        },
        {
          to: '/dashboard/estate/will',
          label: 'Will',
          icon: ScrollText,
          badge: 'New',
          badgeVariant: 'default',
        },
      ]
    },
    {
      to: '/dashboard/family',
      label: 'Family',
      icon: Users,
      description: 'Tree & Succession',
      subItems: [
        {
          to: '/dashboard/family',
          label: 'Dashboard',
          icon: Users,
          end: true,
        },
        {
          to: '/dashboard/family/tree',
          label: 'Family Tree',
          icon: GitBranch,
        },
        {
          to: '/dashboard/family/heirs',
          label: 'Heir Analysis',
          icon: Scale,
        },
        {
          to: '/dashboard/family/guardianships',
          label: 'Guardianships',
          icon: ShieldCheck,
          badge: '0',
          badgeVariant: 'secondary',
        },
      ]
    },
    {
      to: '/dashboard/documents',
      label: 'Documents',
      icon: FileText,
      description: 'Digital vault'
    },
  ], []);

  const accountNavigation: NavItem[] = React.useMemo(() => [
    {
      to: '/dashboard/profile',
      label: 'Profile',
      icon: User,
    },
    {
      to: '/dashboard/settings',
      label: 'Settings',
      icon: Settings,
    },
  ], []);

  // Auto-expand section based on current route
  React.useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath.startsWith('/dashboard/estate')) {
      setExpandedSection('/dashboard/estate');
    } else if (currentPath.startsWith('/dashboard/family')) {
      setExpandedSection('/dashboard/family');
    }
  }, [location.pathname]);

  const toggleSection = (sectionTo: string) => {
    setExpandedSection(prev => prev === sectionTo ? null : sectionTo);
  };

  return (
    <aside className="hidden h-screen w-72 flex-col border-r border-slate-200 bg-white lg:flex shadow-sm">
      
      {/* Brand Header */}
      <div className="flex h-16 items-center px-6 border-b border-slate-200">
        <Link 
          to="/dashboard" 
          className="flex items-center gap-3 transition-opacity hover:opacity-80 group"
        >
          <Logo className="h-8 w-auto" />
          <div className="flex flex-col">
            <span className="text-lg font-bold text-slate-900 tracking-tight">Mirathi</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Estate Planning</span>
          </div>
        </Link>
      </div>

      {/* Estate Context Badge */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-[#C8A165]/10 to-[#C8A165]/5 p-3 border border-[#C8A165]/20 hover:border-[#C8A165]/40 transition-all cursor-pointer group">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#C8A165] to-[#B08E52] text-white shadow-lg group-hover:shadow-xl transition-shadow">
            <Sparkles size={18} />
          </div>
          <div className="overflow-hidden flex-1">
            <p className="truncate text-[10px] font-semibold text-[#C8A165] uppercase tracking-wider">Active Estate</p>
            <p className="truncate text-sm font-bold text-slate-900">My Estate</p>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#C8A165] transition-colors" />
        </div>
      </div>
      
      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="flex flex-col gap-1">
          <div className="px-3 pb-2">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Main
            </h3>
          </div>
          
          {navigation.map((item) => (
            <NavItem
              key={item.to}
              item={item}
              expanded={expandedSection === item.to}
              onToggle={() => item.subItems && toggleSection(item.to)}
            />
          ))}

          {/* Account Section */}
          <div className="mt-6 pt-4 border-t border-slate-200">
            <div className="px-3 pb-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Account
              </h3>
            </div>
            
            {accountNavigation.map((item) => (
              <NavItem key={item.to} item={item} />
            ))}
          </div>
        </nav>
      </div>

      {/* Footer - User Info */}
      <div className="border-t border-slate-200 p-4 bg-slate-50">
        <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-white transition-colors cursor-pointer">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#0F3D3E] to-[#0F3D3E]/80 flex items-center justify-center text-white font-semibold text-sm">
            JD
          </div>
          <div className="overflow-hidden flex-1">
            <p className="truncate text-sm font-medium text-slate-900">John Doe</p>
            <p className="truncate text-xs text-slate-500">john@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// NAV ITEM COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

interface NavItemProps {
  item: NavItem;
  expanded?: boolean;
  onToggle?: () => void;
  isSubItem?: boolean;
}

function NavItem({ item, expanded, onToggle, isSubItem = false }: NavItemProps) {
  const hasSubItems = item.subItems && item.subItems.length > 0;

  if (hasSubItems) {
    return (
      <div>
        <button
          onClick={onToggle}
          className={cn(
            "group w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
            "text-slate-700 font-medium hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <item.icon className={cn(
              "h-5 w-5 transition-colors shrink-0",
              "text-slate-400 group-hover:text-[#C8A165]"
            )} />
            
            <div className="flex flex-col items-start min-w-0 flex-1">
              <span className="truncate">{item.label}</span>
              {item.description && (
                <span className="text-[10px] text-slate-500 truncate">
                  {item.description}
                </span>
              )}
            </div>
          </div>

          <ChevronRight 
            className={cn(
              "h-4 w-4 text-slate-400 transition-transform shrink-0",
              expanded && "rotate-90"
            )} 
          />
        </button>

        {/* Sub Items */}
        {expanded && (
          <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-200 pl-2">
            {item.subItems?.map((subItem) => (
              <NavItem 
                key={subItem.to} 
                item={subItem} 
                isSubItem 
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) => cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
        isSubItem && "py-2",
        isActive
          ? "bg-gradient-to-r from-[#C8A165]/10 to-transparent text-[#C8A165] font-semibold border-l-2 border-[#C8A165] -ml-[2px] pl-[14px]"
          : "text-slate-700 font-medium hover:bg-slate-100 hover:text-slate-900 hover:pl-4"
      )}
    >
      {({ isActive }) => (
        <>
          <item.icon className={cn(
            "h-5 w-5 transition-colors shrink-0",
            isSubItem && "h-4 w-4",
            isActive ? "text-[#C8A165]" : "text-slate-400 group-hover:text-[#C8A165]"
          )} />
          
          <span className="flex-1 truncate">{item.label}</span>
          
          {item.badge && (
            <Badge 
              variant={item.badgeVariant || 'default'}
              className={cn(
                "text-[10px] px-1.5 py-0 h-5",
                item.badgeVariant === 'default' && "bg-[#C8A165] hover:bg-[#C8A165]"
              )}
            >
              {item.badge}
            </Badge>
          )}
          
          {isActive && !isSubItem && (
            <span className="h-1.5 w-1.5 rounded-full bg-[#C8A165] shadow-[0_0_8px_rgba(200,161,101,0.6)]" />
          )}
        </>
      )}
    </NavLink>
  );
}