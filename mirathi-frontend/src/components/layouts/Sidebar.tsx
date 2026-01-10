import * as React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  GitBranch,
  Scale,
  ShieldCheck,
  Wallet,
  TrendingUp,
  ScrollText,
  ChevronRight,
  BookOpen,
  Briefcase
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { useCurrentUser } from '@/features/user/user.api';
import { Logo } from '@/components/common/Logo';

// --- Configuration ---

type NavItemConfig = {
  to: string;
  label: string;
  icon: React.ElementType;
  end?: boolean;
  badge?: string;
  subItems?: NavItemConfig[];
};

// Simplified, flat, and professional structure
const NAV_ITEMS: { group?: string; items: NavItemConfig[] }[] = [
  {
    items: [
      {
        to: '/dashboard',
        label: 'Overview',
        icon: LayoutDashboard,
        end: true,
      }
    ]
  },
  {
    group: 'Estate Affairs',
    items: [
      {
        to: '/dashboard/estate',
        label: 'Estate Inventory',
        icon: Briefcase, // Changed to Briefcase for professional feel
        subItems: [
          { to: '/dashboard/estate', label: 'Net Worth Summary', icon: TrendingUp, end: true },
          { to: '/dashboard/estate/assets', label: 'Assets Registry', icon: Wallet },
          { to: '/dashboard/estate/debts', label: 'Liabilities & Debts', icon: FileText },
          { to: '/dashboard/estate/will', label: 'Will & Testament', icon: ScrollText, badge: 'Legal' },
        ]
      },
      {
        to: '/dashboard/documents',
        label: 'Document Vault',
        icon: FileText,
      },
    ]
  },
  {
    group: 'Succession',
    items: [
      {
        to: '/dashboard/family',
        label: 'Family & Beneficiaries',
        icon: Users,
        subItems: [
          { to: '/dashboard/family', label: 'Family Tree', icon: GitBranch, end: true },
          { to: '/dashboard/family/heirs', label: 'Legal Heirs', icon: Scale },
          { to: '/dashboard/family/guardianships', label: 'Dependents', icon: ShieldCheck },
        ]
      }
    ]
  }
];

// --- Component ---

interface SidebarProps {
  className?: string;
  onLinkClick?: () => void;
}

export function Sidebar({ className, onLinkClick }: SidebarProps) {
  const { data: user, isLoading } = useCurrentUser();
  const location = useLocation();

  return (
    <div className={cn("flex h-full flex-col bg-slate-50 border-r border-slate-200", className)}>
      
      {/* 1. Header & Logo */}
      <div className="flex h-16 items-center px-6 border-b border-slate-200 bg-white">
        <Logo className="h-7 w-auto text-slate-900" />
      </div>

      {/* 2. Static Case Context (Non-interactive, Informational) */}
      {/* This mimics a physical file folder label */}
      <div className="px-6 py-6">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Case Reference
          </span>
          {isLoading ? (
             <Skeleton className="h-5 w-32" />
          ) : (
            <h2 className="text-sm font-bold text-slate-900 leading-tight">
              {user?.lastName ? `Estate of ${user.lastName}` : 'Unregistered Estate'}
            </h2>
          )}
          <div className="mt-1 flex items-center gap-2">
             <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
               Active
             </span>
             <span className="text-[10px] text-slate-400 font-mono">
               #EST-{new Date().getFullYear()}-001
             </span>
          </div>
        </div>
      </div>

      {/* 3. Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
        <nav className="flex flex-col gap-6">
          {NAV_ITEMS.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {section.group && (
                <h3 className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400/80">
                  {section.group}
                </h3>
              )}
              {section.items.map((item) => (
                <NavGroup 
                  key={item.to} 
                  item={item} 
                  currentPath={location.pathname} 
                  onLinkClick={onLinkClick}
                />
              ))}
            </div>
          ))}
        </nav>
      </div>

      {/* 4. Footer: Help/Resources (Replaces User Profile) */}
      <div className="p-4 border-t border-slate-200 bg-white/50">
        <a 
          href="/dashboard/help" 
          className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-slate-600 hover:bg-white hover:text-emerald-700 hover:shadow-sm transition-all border border-transparent hover:border-slate-100"
        >
          <BookOpen className="h-4 w-4" />
          <div className="flex flex-col">
            <span className="leading-none">Legal Resources</span>
            <span className="text-[10px] text-slate-400 font-normal mt-1">Cap 160 Guidelines</span>
          </div>
        </a>
      </div>
    </div>
  );
}

// --- Internal: Recursive Nav Item ---

const NavGroup = React.memo(({ 
  item, 
  currentPath,
  onLinkClick 
}: { 
  item: NavItemConfig; 
  currentPath: string;
  onLinkClick?: () => void;
}) => {
  const isActive = item.to === currentPath || (item.end && currentPath === item.to) || (!item.end && currentPath.startsWith(item.to));
  const [isExpanded, setIsExpanded] = React.useState(isActive);
  
  React.useEffect(() => {
    if (isActive) setIsExpanded(true);
  }, [isActive]);

  const hasChildren = item.subItems && item.subItems.length > 0;

  if (hasChildren) {
    return (
      <div className="mb-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            "group flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all select-none",
            isActive 
              ? "text-slate-900 bg-white shadow-sm ring-1 ring-slate-200" 
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          <div className="flex items-center gap-3">
            <item.icon className={cn(
              "h-4 w-4 transition-colors",
              isActive ? "text-[#0F3D3E]" : "text-slate-400 group-hover:text-slate-600"
            )} />
            <span>{item.label}</span>
          </div>
          <ChevronRight 
            className={cn(
              "h-3.5 w-3.5 text-slate-400 transition-transform duration-200",
              isExpanded && "rotate-90"
            )} 
          />
        </button>

        <div className={cn(
          "grid transition-all duration-300 ease-in-out",
          isExpanded ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
        )}>
          <div className="overflow-hidden">
            <div className="ml-5 space-y-0.5 border-l border-slate-200 pl-3 py-1">
              {item.subItems!.map((sub) => (
                <NavLink
                  key={sub.to}
                  to={sub.to}
                  end={sub.end}
                  onClick={onLinkClick}
                  className={({ isActive: isSubActive }) => cn(
                    "flex items-center gap-3 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                    isSubActive
                      ? "text-[#0F3D3E] bg-slate-100/80"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  {({ isActive: isSubActive }) => (
                    <>
                      <span className="flex-1">{sub.label}</span>
                      {isSubActive && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[#C8A165]" />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Simple Link
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onLinkClick}
      className={({ isActive }) => cn(
        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all mb-0.5",
        isActive 
          ? "bg-[#0F3D3E] text-white shadow-md" 
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      {({ isActive }) => (
        <>
          <item.icon className={cn(
            "h-4 w-4 transition-colors",
            isActive ? "text-[#C8A165]" : "text-slate-400 group-hover:text-slate-600"
          )} />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  );
});