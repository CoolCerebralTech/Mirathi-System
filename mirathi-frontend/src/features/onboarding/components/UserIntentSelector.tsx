// FILE: src/features/onboarding/components/UserIntentSelector.tsx
// CONTEXT: The "Fork in the Road" - Separating Living (Wills) from Deceased (Probate)

import React from 'react';
import { 
  ScrollText, 
  Scale, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card'; // Assuming standard Shadcn/UI Card

// Define the two paths
export type UserIntent = 'PLANNING' | 'EXECUTOR';

interface UserIntentSelectorProps {
  onSelect: (intent: UserIntent) => void;
}

export const UserIntentSelector: React.FC<UserIntentSelectorProps> = ({ onSelect }) => {
  return (
    <div className="grid gap-8 md:grid-cols-2 max-w-5xl mx-auto">
      
      {/* ================================================================== */}
      {/* OPTION A: ESTATE PLANNING (I am alive)                             */}
      {/* THEME: Gold/Amber (Hope, Future, Legacy)                           */}
      {/* ================================================================== */}
      <Card 
        onClick={() => onSelect('PLANNING')}
        className={cn(
          "group relative cursor-pointer overflow-hidden border-2 border-transparent transition-all duration-300",
          "hover:border-[#C8A165] hover:shadow-2xl hover:shadow-[#C8A165]/10",
          "bg-white"
        )}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C8A165]/40 to-[#C8A165]" />
        
        <div className="p-8 flex flex-col h-full">
          {/* Icon Badge */}
          <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#C8A165]/10 text-[#C8A165] ring-1 ring-[#C8A165]/20 group-hover:scale-110 transition-transform duration-300">
            <ScrollText className="h-8 w-8" />
          </div>
          
          <h3 className="mb-3 text-2xl font-serif font-bold text-[#0F3D3E]">
            Plan My Legacy
          </h3>
          <p className="mb-8 text-neutral-600 leading-relaxed">
            I want to create a deterministic Will, appoint guardians for my children, and structure my assets to prevent future disputes.
          </p>

          <div className="flex-1">
             <h4 className="text-xs font-bold uppercase tracking-wider text-[#C8A165] mb-4">
               Included Features
             </h4>
             <ul className="space-y-4 text-sm text-neutral-600">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#C8A165] flex-shrink-0" /> 
                <span>Create a <strong>Digital Will</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#C8A165] flex-shrink-0" /> 
                <span>Appoint <strong>Legal Guardians</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#C8A165] flex-shrink-0" /> 
                <span>Secure Asset Inventory</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-neutral-100 flex items-center font-bold text-[#C8A165] group-hover:gap-2 transition-all">
            Start Planning <ArrowRight className="ml-2 h-4 w-4" />
          </div>
        </div>
      </Card>

      {/* ================================================================== */}
      {/* OPTION B: ESTATE ADMINISTRATION (Someone died)                     */}
      {/* THEME: Deep Green (Authority, Duty, Law)                           */}
      {/* ================================================================== */}
      <Card 
        onClick={() => onSelect('EXECUTOR')}
        className={cn(
          "group relative cursor-pointer overflow-hidden border-2 border-transparent transition-all duration-300",
          "hover:border-[#0F3D3E] hover:shadow-2xl hover:shadow-[#0F3D3E]/10",
          "bg-white"
        )}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0F3D3E]/40 to-[#0F3D3E]" />

        <div className="p-8 flex flex-col h-full">
          {/* Icon Badge */}
          <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0F3D3E]/5 text-[#0F3D3E] ring-1 ring-[#0F3D3E]/10 group-hover:scale-110 transition-transform duration-300">
            <Scale className="h-8 w-8" />
          </div>
          
          <h3 className="mb-3 text-2xl font-serif font-bold text-[#0F3D3E]">
            Manage an Estate
          </h3>
          <p className="mb-8 text-neutral-600 leading-relaxed">
            A loved one has passed away. I need to act as the Administrator, verify assets, pay debts, and obtain the Grant of Probate.
          </p>

          <div className="flex-1">
             <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F3D3E] mb-4">
               The Digital Copilot
             </h4>
             <ul className="space-y-4 text-sm text-neutral-600">
              <li className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-[#0F3D3E] flex-shrink-0" /> 
                <span><strong>S.45 Compliance</strong> (Debt Priority)</span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-[#0F3D3E] flex-shrink-0" /> 
                <span>Generate <strong>Court Forms</strong> (P&A 80)</span>
              </li>
              <li className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-[#0F3D3E] flex-shrink-0" /> 
                <span>Track <strong>Solvency & Distribution</strong></span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-neutral-100 flex items-center font-bold text-[#0F3D3E] group-hover:gap-2 transition-all">
            Start Administration <ArrowRight className="ml-2 h-4 w-4" />
          </div>
        </div>
      </Card>

    </div>
  );
};