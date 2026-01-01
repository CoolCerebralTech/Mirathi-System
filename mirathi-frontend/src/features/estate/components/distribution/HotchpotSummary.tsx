// components/distribution/HotchpotSummary.tsx

import React from 'react';
import { Plus, ArrowRight, Scale } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { MoneyDisplay } from '../shared/MoneyDisplay';
import type { Money } from '@/types/estate.types';

interface HotchpotSummaryProps {
  netEstateValue: Money;
  totalDistributablePool: Money;
}

export const HotchpotSummary: React.FC<HotchpotSummaryProps> = ({ 
  netEstateValue, 
  totalDistributablePool 
}) => {
  // Calculate the Hotchpot amount (Gifts added back)
  const hotchpotAmount = totalDistributablePool.amount - netEstateValue.amount;
  const hasHotchpot = hotchpotAmount > 0;

  return (
    <Card className="bg-slate-900 text-white border-0 shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Scale className="h-5 w-5 text-indigo-400" />
          <h3 className="font-semibold">The "Hotchpot" Calculation</h3>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          
          {/* 1. Net Estate */}
          <div className="space-y-1">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Net Estate (Cash/Assets)</p>
            <div className="text-xl font-bold">
              <MoneyDisplay amount={netEstateValue} />
            </div>
          </div>

          <Plus className="h-6 w-6 text-slate-600 hidden md:block" />

          {/* 2. Gifts Added Back */}
          <div className="space-y-1 relative">
             {hasHotchpot && (
               <span className="absolute -top-3 left-1/2 -translate-x-1/2 md:left-auto md:right-0 md:translate-x-0 bg-indigo-500 text-[10px] px-1.5 rounded text-white font-bold">
                 S.35 ADD-BACK
               </span>
             )}
            <p className="text-xs text-slate-400 uppercase tracking-wide">Gifts Inter Vivos</p>
            <div className="text-xl font-bold text-indigo-300">
              {/* Manually constructed object for display since we calculated amount locally */}
              <MoneyDisplay 
                amount={{
                    amount: hotchpotAmount,
                    currency: netEstateValue.currency,
                    formatted: '' // Formatted not strictly needed by MoneyDisplay usually if amount is number, but strictly typed it might be.
                                  // Since MoneyDisplay handles 'amount={number}' OR 'amount={object}', we can just pass the number if supported,
                                  // otherwise we construct the object. Assuming MoneyDisplay supports direct object props:
                }} 
              />
            </div>
          </div>

          <ArrowRight className="h-6 w-6 text-slate-600 hidden md:block" />

          {/* 3. Total Pool */}
          <div className="bg-white/10 p-4 rounded-lg w-full md:w-auto min-w-[180px]">
            <p className="text-xs text-emerald-400 uppercase tracking-wide font-bold">Total Distributable Pool</p>
            <div className="text-2xl font-bold text-white">
              <MoneyDisplay amount={totalDistributablePool} />
            </div>
          </div>

        </div>
        
        <p className="mt-6 text-xs text-slate-500 text-center md:text-left">
          * Under S.35, gifts given shortly before death are added back to the pool to calculate fair shares, 
          then deducted from the recipient's final payout.
        </p>
      </CardContent>
    </Card>
  );
};