// FILE: src/components/layout/Sidebar.tsx
import * as React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  MoreVertical
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge, Skeleton, Button } from '@/components/ui';
import { useCurrentUser } from '@/features/user/user.api';

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
// MAIN COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export function Sidebar() {
  const location = useLocation();
  const [expandedSection, setExpandedSection] = React.useState<string | null>(null);

  // 1. Get Real User Data
  const { data: user, isLoading: isUserLoading } = useCurrentUser();

  // 2. Navigation Structure
  const navigation: NavItem[] = React.useMemo(() => [
    {
      to: '/dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
      end: true,
      description: 'Command Center'
    },
    {
      to: '/dashboard/estate',
      label: 'Estate & Assets',
      icon: Building2,
      description: 'Inventory & Net Worth',
      subItems: [
        { to: '/dashboard/estate', label: 'Dashboard', icon: TrendingUp, end: true },
        { to: '/dashboard/estate/assets', label: 'Assets Registry', icon: Wallet },
        { to: '/dashboard/estate/debts', label: 'Liabilities', icon: FileText },
        { 
          to: '/dashboard/estate/will', 
          label: 'Will & Testament', 
          icon: ScrollText,
          badge: 'Legal',
          badgeVariant: 'default',
        },
      ]
    },
    {
      to: '/dashboard/family',
      label: 'Family & Heirs',
      icon: Users,
      description: 'Succession Planning',
      subItems: [
        { to: '/dashboard/family', label: 'Dashboard', icon: Users, end: true },
        { to: '/dashboard/family/tree', label: 'Family Tree', icon: GitBranch },
        { to: '/dashboard/family/heirs', label: 'Beneficiaries', icon: Scale },
        { 
          to: '/dashboard/family/guardianships', 
          label: 'Guardianships', 
          icon: ShieldCheck,
        },
      ]
    },
    {
      to: '/dashboard/documents',
      label: 'Digital Vault',
      icon: FileText,
      description: 'Storage'
    },
  ], []);

  const accountNavigation: NavItem[] = React.useMemo(() => [
    { to: '/dashboard/profile', label: 'My Profile', icon: User },
    { to: '/dashboard/settings', label: 'System Settings', icon: Settings },
  ], []);

  // 3. Auto-expand section logic
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

  // Helper to get initials
  const getInitials = () => {
    if (!user) return 'U';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  return (
    <aside className="hidden h-full min-h-screen w-72 flex-col border-r border-slate-200 bg-slate-50/50 lg:flex">
      
      {/* SECTION A: Context Switcher (Top) */}
      <div className="p-4 pt-6">
        <div className="group relative overflow-hidden rounded-xl bg-white border border-slate-200 p-3 shadow-sm transition-all hover:shadow-md hover:border-[#C8A165]/30 cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0F3D3E] text-white">
              <Sparkles size={18} className="text-[#C8A165]" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Active Context
              </p>
              <p className="truncate text-sm font-bold text-[#0F3D3E]">
                {isUserLoading ? <Skeleton className="h-4 w-20" /> : `${user?.lastName || 'My'} Estate`}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
      
      {/* SECTION B: Main Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
        <nav className="flex flex-col gap-6">
          
          {/* Main Group */}
          <div>
            <div className="px-2 pb-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Platform
              </h3>
            </div>
            <div className="space-y-1">
              {navigation.map((item) => (
                <NavItemComponent
                  key={item.to}
                  item={item}
                  expanded={expandedSection === item.to}
                  onToggle={() => item.subItems && toggleSection(item.to)}
                />
              ))}
            </div>
          </div>

          {/* Account Group */}
          <div>
            <div className="px-2 pb-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Configuration
              </h3>
            </div>
            <div className="space-y-1">
              {accountNavigation.map((item) => (
                <NavItemComponent key={item.to} item={item} />
              ))}
            </div>
          </div>
        </nav>
      </div>

      {/* SECTION C: User Footer */}
      <div className="p-4 border-t border-slate-200 bg-white">
        {isUserLoading ? (
           <div className="flex items-center gap-3">
             <Skeleton className="h-10 w-10 rounded-full" />
             <div className="space-y-1">
               <Skeleton className="h-3 w-24" />
               <Skeleton className="h-3 w-32" />
             </div>
           </div>
        ) : (
          <div className="group flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50 transition-colors cursor-pointer relative">
            {/* Avatar */}
            <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-[#C8A165] to-[#B08E52] flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white">
              {getInitials()}
            </div>
            
            {/* Info */}
            <div className="flex-1 overflow-hidden min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="truncate text-xs text-slate-500 font-medium">
                {user?.email}
              </p>
            </div>

            {/* Action */}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// NAV ITEM COMPONENT (Internal Helper)
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

interface NavItemProps {
  item: NavItem;
  expanded?: boolean;
  onToggle?: () => void;
  isSubItem?: boolean;
}

function NavItemComponent({ item, expanded, onToggle, isSubItem = false }: NavItemProps) {
  const hasSubItems = item.subItems && item.subItems.length > 0;

  // 1. Parent Item with Dropdown
  if (hasSubItems) {
    const isChildActive = item.subItems?.some(child => location.pathname === child.to);
    
    return (
      <div className="mb-1">
        <button
          onClick={onToggle}
          className={cn(
            "group w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 select-none",
            "text-slate-600 font-medium hover:bg-white hover:shadow-sm hover:text-[#0F3D3E]",
            (expanded || isChildActive) && "bg-white text-[#0F3D3E] shadow-sm font-semibold"
          )}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <item.icon className={cn(
              "h-5 w-5 shrink-0 transition-colors",
              (expanded || isChildActive) ? "text-[#C8A165]" : "text-slate-400 group-hover:text-[#C8A165]"
            )} />
            
            <div className="flex flex-col items-start min-w-0 flex-1">
              <span className="truncate">{item.label}</span>
            </div>
          </div>

          <ChevronRight 
            className={cn(
              "h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0",
              expanded && "rotate-90 text-[#C8A165]"
            )} 
          />
        </button>

        {/* Animated Dropdown */}
        <div 
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            expanded ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="ml-5 space-y-1 border-l border-slate-200 pl-3 py-1">
              {item.subItems?.map((subItem) => (
                <NavItemComponent 
                  key={subItem.to} 
                  item={subItem} 
                  isSubItem 
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Standard Link Item
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) => cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
        isSubItem ? "text-slate-500 text-[13px]" : "text-slate-600 font-medium",
        isActive
          ? "bg-[#0F3D3E]/5 text-[#0F3D3E] font-semibold"
          : "hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      {({ isActive }) => (
        <>
          <item.icon className={cn(
            "shrink-0 transition-colors",
            isSubItem ? "h-4 w-4" : "h-5 w-5",
            isActive ? "text-[#0F3D3E]" : "text-slate-400 group-hover:text-[#0F3D3E]"
          )} />
          
          <span className="flex-1 truncate">{item.label}</span>
          
          {/* Badge Logic */}
          {item.badge && (
            <Badge 
              variant={item.badgeVariant || 'default'}
              className={cn(
                "text-[10px] px-1.5 py-0 h-5 font-medium border-0",
                item.badgeVariant === 'default' && "bg-[#C8A165] hover:bg-[#b08d55] text-white",
                item.badgeVariant === 'secondary' && "bg-slate-200 text-slate-700"
              )}
            >
              {item.badge}
            </Badge>
          )}
          
          {/* Active Dot indicator for subitems */}
          {isActive && isSubItem && (
            <span className="h-1.5 w-1.5 rounded-full bg-[#C8A165]" />
          )}
        </>
      )}
    </NavLink>
  );
}