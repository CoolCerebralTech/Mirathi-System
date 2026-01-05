// FILE: src/components/layout/Sidebar.tsx
// CONTEXT: The Command Center Navigation (Mirathi Dark Theme)

import * as React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { type TFunction } from 'i18next';
import {
  LayoutDashboard,
  Building2,     // Estates/Inventory
  Users,         // Families/Heirs
  FileCheck,     // Documents/Vault
  Settings,
  ScrollText,    // Wills
  Gavel,         // Probate
  ClipboardCheck,// Readiness
  Map,           // Roadmap
  Briefcase
} from 'lucide-react';

import { Logo } from '../common/Logo';
import { cn } from '@/lib/utils'; // Shadcn utility

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

type NavGroup = {
  title: string;
  items: NavItem[];
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export function Sidebar() {
  const { t } = useTranslation(['sidebar', 'common']);

  // Navigation Logic: Grouped by Microservice Domain
  const navigationGroups = React.useMemo<NavGroup[]>(() => [
    {
      title: "Overview",
      items: [
        { 
          to: '/dashboard', 
          labelKey: 'nav.dashboard', 
          defaultLabel: 'Command Center',
          icon: LayoutDashboard, 
          end: true 
        },
      ]
    },
    {
      title: "Estate Planning (Living)",
      items: [
        { 
          to: '/dashboard/wills', 
          labelKey: 'nav.wills', 
          defaultLabel: 'My Wills',
          icon: ScrollText 
        },
      ]
    },
    {
      title: "Succession (Deceased)",
      items: [
        { 
          to: '/dashboard/roadmap', 
          labelKey: 'nav.roadmap', 
          defaultLabel: 'Executor Roadmap',
          icon: Map 
        },
        { 
          to: '/dashboard/readiness', 
          labelKey: 'nav.readiness', 
          defaultLabel: 'Readiness Audit',
          icon: ClipboardCheck 
        },
        { 
          to: '/dashboard/probate', 
          labelKey: 'nav.probate', 
          defaultLabel: 'Probate Filing',
          icon: Gavel 
        },
      ]
    },
    {
      title: "Data Layers",
      items: [
        { 
          to: '/dashboard/estates', 
          labelKey: 'nav.estates', 
          defaultLabel: 'Asset Inventory',
          icon: Building2 
        },
        { 
          to: '/dashboard/families', 
          labelKey: 'nav.families', 
          defaultLabel: 'Family & Heirs',
          icon: Users 
        },
        { 
          to: '/dashboard/documents', 
          labelKey: 'nav.documents', 
          defaultLabel: 'Digital Vault',
          icon: FileCheck 
        },
      ]
    }
  ], []);

  return (
    <aside className="hidden h-screen w-72 flex-col border-r border-[#0F3D3E] bg-[#0F3D3E] text-white lg:flex shadow-2xl">
      
      {/* 1. Brand Header */}
      <div className="flex h-20 items-center px-6 border-b border-white/10">
        <Link to="/dashboard" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <Logo className="h-8 w-auto" />
        </Link>
      </div>

      {/* 2. Context Switcher (Optional: If managing multiple estates) */}
      <div className="px-4 pt-6">
        <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#C8A165] text-[#0F3D3E] shadow-lg">
            <Briefcase size={20} />
          </div>
          <div className="overflow-hidden">
            <p className="truncate text-xs font-medium text-[#C8A165] uppercase tracking-wider">Current Context</p>
            <p className="truncate text-sm font-bold text-white">Kamau Estate</p>
          </div>
        </div>
      </div>
      
      {/* 3. Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <nav className="flex flex-col gap-8">
          {navigationGroups.map((group, index) => (
            <div key={index}>
              <h3 className="mb-2 px-4 text-[10px] font-bold uppercase tracking-widest text-white/40">
                {group.title}
              </h3>
              <SidebarNav items={group.items} t={t} />
            </div>
          ))}
        </nav>
      </div>

      {/* 4. Footer / Settings */}
      <div className="border-t border-white/10 p-4 bg-[#0A2A2B]">
        <NavLink
          to="/dashboard/settings"
          className={({ isActive }) => cn(
            "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200",
            isActive 
              ? "bg-[#C8A165] text-[#0F3D3E] font-bold" 
              : "text-neutral-400 hover:bg-white/5 hover:text-white"
          )}
        >
          <Settings className="h-5 w-5" />
          {t('nav.settings', 'System Settings')}
        </NavLink>
        
        {/* Logout (Optional placement here or in Header) */}
        {/* <button className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors">
          <LogOut className="h-5 w-5" />
          Sign Out
        </button> */}
      </div>
    </aside>
  );
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// CHILD COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

interface SidebarNavProps {
  items: NavItem[];
  t: TFunction<['sidebar', 'common']>;
}

function SidebarNav({ items, t }: SidebarNavProps) {
  return (
    <div className="flex flex-col gap-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => cn(
            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
            isActive
              ? "bg-white/10 text-[#C8A165] font-bold shadow-sm border border-white/5"
              : "text-neutral-300 font-medium hover:bg-white/5 hover:text-white hover:pl-4"
          )}
        >
          {({ isActive }) => (
            <>
              {/* FIX: We now calculate the class string HERE, then pass it to the icon */}
              <item.icon className={cn(
                "h-5 w-5 transition-colors",
                isActive ? "text-[#C8A165]" : "text-neutral-500 group-hover:text-white"
              )} />
              
              <span>{t(item.labelKey, item.defaultLabel)}</span>
              
              {/* Optional: Add the active dot indicator back if you want it */}
              {isActive && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#C8A165] shadow-[0_0_8px_rgba(200,161,101,0.6)]" />
              )}
            </>
          )}
        </NavLink>
      ))}
    </div>
  );
}