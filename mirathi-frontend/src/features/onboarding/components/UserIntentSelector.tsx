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
          "group relative cursor-pointer overflow-hidden border-2 transition-all hover:border-amber-500 hover:shadow-xl",
          "bg-gradient-to-b from-white to-amber-50/30"
        )}
      >
        <div className="p-8 flex flex-col h-full">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
            <ScrollText className="h-8 w-8" />
          </div>
          
          <h3 className="mb-2 text-2xl font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
            Plan My Legacy
          </h3>
          <p className="mb-6 text-slate-500 leading-relaxed">
            I want to create a Will, appoint guardians for my children, and ensure my assets are protected for the future.
          </p>

          <ul className="mb-8 space-y-3 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-500" /> Write a Digital Will
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-500" /> Appoint Guardians
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-500" /> Secure Assets
            </li>
          </ul>

          <div className="mt-auto flex items-center text-sm font-bold text-amber-600 group-hover:translate-x-2 transition-transform">
            Start Planning <ArrowRight className="ml-2 h-4 w-4" />
          </div>
        </div>
      </Card>

      {/* OPTION B: ESTATE ADMINISTRATION (Someone died) */}
      <Card 
        onClick={() => onSelect('EXECUTOR')}
        className={cn(
          "group relative cursor-pointer overflow-hidden border-2 transition-all hover:border-blue-500 hover:shadow-xl",
          "bg-gradient-to-b from-white to-blue-50/30"
        )}
      >
        <div className="p-8 flex flex-col h-full">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
            <Building2 className="h-8 w-8" />
          </div>
          
          <h3 className="mb-2 text-2xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
            Manage an Estate
          </h3>
          <p className="mb-6 text-slate-500 leading-relaxed">
            A loved one has passed away. I need to manage their assets, pay debts, and distribute the estate legally.
          </p>

          <ul className="mb-8 space-y-3 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" /> S.45 Debt Compliance
            </li>
            <li className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" /> Asset Inventory
            </li>
            <li className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" /> Legal Distribution
            </li>
          </ul>

          <div className="mt-auto flex items-center text-sm font-bold text-blue-600 group-hover:translate-x-2 transition-transform">
            Start Administration <ArrowRight className="ml-2 h-4 w-4" />
          </div>
        </div>
      </Card>

    </div>
  );
};