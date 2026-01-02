// FILE: src/features/onboarding/components/UserIntentSelector.tsx

import React from 'react';
import { 
  ScrollText, 
  Building2, 
  ArrowRight, 
  CheckCircle2, 
  Shield 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui';

// Define the two paths
export type UserIntent = 'PLANNING' | 'EXECUTOR';

interface UserIntentSelectorProps {
  onSelect: (intent: UserIntent) => void;
}

export const UserIntentSelector: React.FC<UserIntentSelectorProps> = ({ onSelect }) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
      
      {/* OPTION A: ESTATE PLANNING (I am alive) */}
      <Card 
        onClick={() => onSelect('PLANNING')}
        className={cn(
          "group relative cursor-pointer overflow-hidden border border-slate-800 transition-all duration-300",
          "bg-slate-900/50 hover:bg-slate-900", // Dark transparent background
          "hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10" // Amber glow on hover
        )}
      >
        <div className="p-8 flex flex-col h-full relative z-10">
          {/* Icon */}
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-lg shadow-amber-500/5 group-hover:scale-110 transition-transform duration-300">
            <ScrollText className="h-8 w-8" />
          </div>
          
          {/* Text */}
          <h3 className="mb-3 text-2xl font-bold text-white group-hover:text-amber-400 transition-colors">
            Plan My Legacy
          </h3>
          <p className="mb-8 text-slate-400 leading-relaxed">
            I want to create a Will, appoint guardians for my children, and ensure my assets are protected for the future.
          </p>

          {/* Features List */}
          <ul className="mb-8 space-y-3 text-sm text-slate-300">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-amber-500 flex-shrink-0" /> 
              <span>Write a Digital Will</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-amber-500 flex-shrink-0" /> 
              <span>Appoint Guardians</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-amber-500 flex-shrink-0" /> 
              <span>Secure Assets</span>
            </li>
          </ul>

          {/* CTA */}
          <div className="mt-auto flex items-center text-sm font-bold text-amber-500 group-hover:translate-x-2 transition-transform">
            Start Planning <ArrowRight className="ml-2 h-4 w-4" />
          </div>
        </div>

        {/* Decorative Gradient Blob */}
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-amber-500/5 blur-3xl group-hover:bg-amber-500/10 transition-colors duration-500" />
      </Card>

      {/* OPTION B: ESTATE ADMINISTRATION (Someone died) */}
      <Card 
        onClick={() => onSelect('EXECUTOR')}
        className={cn(
          "group relative cursor-pointer overflow-hidden border border-slate-800 transition-all duration-300",
          "bg-slate-900/50 hover:bg-slate-900",
          "hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10" // Blue glow to differentiate
        )}
      >
        <div className="p-8 flex flex-col h-full relative z-10">
          {/* Icon */}
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-lg shadow-blue-500/5 group-hover:scale-110 transition-transform duration-300">
            <Building2 className="h-8 w-8" />
          </div>
          
          {/* Text */}
          <h3 className="mb-3 text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">
            Manage an Estate
          </h3>
          <p className="mb-8 text-slate-400 leading-relaxed">
            A loved one has passed away. I need to manage their assets, pay debts, and distribute the estate legally.
          </p>

          {/* Features List */}
          <ul className="mb-8 space-y-3 text-sm text-slate-300">
            <li className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-blue-500 flex-shrink-0" /> 
              <span>S.45 Debt Compliance</span>
            </li>
            <li className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-blue-500 flex-shrink-0" /> 
              <span>Asset Inventory</span>
            </li>
            <li className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-blue-500 flex-shrink-0" /> 
              <span>Legal Distribution</span>
            </li>
          </ul>

          {/* CTA */}
          <div className="mt-auto flex items-center text-sm font-bold text-blue-500 group-hover:translate-x-2 transition-transform">
            Start Administration <ArrowRight className="ml-2 h-4 w-4" />
          </div>
        </div>

        {/* Decorative Gradient Blob */}
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-blue-500/5 blur-3xl group-hover:bg-blue-500/10 transition-colors duration-500" />
      </Card>

    </div>
  );
};