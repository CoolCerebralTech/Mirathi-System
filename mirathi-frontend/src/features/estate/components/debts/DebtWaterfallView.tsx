// components/debts/DebtWaterfallView.tsx

import React, { useState } from 'react';
import { DebtTierCard } from './DebtTierCard';
import { Progress } from '@/components/ui';
import { MoneyDisplay } from '../shared/MoneyDisplay';
import type { DebtWaterfallResponse } from '@/types/estate.types';

interface DebtWaterfallViewProps {
  data: DebtWaterfallResponse;
  estateId: string;
}

export const DebtWaterfallView: React.FC<DebtWaterfallViewProps> = ({ data, estateId }) => {
  const [openTier, setOpenTier] = useState<number | null>(data.highestPriorityOutstanding || 1);

  const totalLiability = data.totalLiabilities.amount;
  const totalPaid = data.totalPaid.amount;
  const progress = totalLiability + totalPaid > 0 
    ? (totalPaid / (totalPaid + totalLiability)) * 100 
    : (totalPaid > 0 ? 100 : 0);

  return (
    <div className="space-y-6">
      {/* Overall Progress Header */}
      <div className="bg-slate-900 text-white rounded-lg p-6 shadow-md">
        <div className="flex justify-between items-end mb-4">
          <div>
             <h2 className="text-lg font-semibold">Debt Settlement Progress</h2>
             <p className="text-slate-400 text-sm">Strict adherence to S.45 Priority Rules</p>
          </div>
          <div className="text-right">
             <div className="text-2xl font-bold"><MoneyDisplay amount={data.totalLiabilities} /></div>
             <div className="text-xs text-slate-400">Remaining Liability</div>
          </div>
        </div>
        
        <Progress 
            value={progress} 
            className="h-2 bg-slate-700 [&>*]:bg-emerald-500" 
        />
        
        <div className="flex justify-between mt-2 text-xs text-slate-400">
           <span>0% Settled</span>
           <span>{progress.toFixed(0)}% Complete</span>
        </div>
      </div>

      {/* The Waterfall Tiers */}
      <div className="space-y-3">
        <DebtTierCard 
          tierNumber={1}
          title="Funeral Expenses"
          description="Reasonable expenses for the funeral and burial."
          debts={data.tier1_FuneralExpenses}
          isExpanded={openTier === 1}
          onToggle={() => setOpenTier(openTier === 1 ? null : 1)}
          canPay={data.canPayNextTier && data.highestPriorityOutstanding === 1}
          estateId={estateId}
        />

        <DebtTierCard 
          tierNumber={2}
          title="Testamentary Expenses"
          description="Legal fees, court costs, and administration expenses."
          debts={data.tier2_Testamentary}
          isExpanded={openTier === 2}
          onToggle={() => setOpenTier(openTier === 2 ? null : 2)}
          canPay={data.canPayNextTier && data.highestPriorityOutstanding === 2}
          estateId={estateId}
        />

        <DebtTierCard 
          tierNumber={3}
          title="Secured Creditors"
          description="Mortgages and loans secured by specific assets."
          debts={data.tier3_SecuredDebts}
          isExpanded={openTier === 3}
          onToggle={() => setOpenTier(openTier === 3 ? null : 3)}
          canPay={data.canPayNextTier && data.highestPriorityOutstanding === 3}
          estateId={estateId}
        />

        <DebtTierCard 
          tierNumber={4}
          title="Taxes & Wages"
          description="KRA taxes and outstanding wages for domestic staff."
          debts={data.tier4_TaxesAndWages}
          isExpanded={openTier === 4}
          onToggle={() => setOpenTier(openTier === 4 ? null : 4)}
          canPay={data.canPayNextTier && data.highestPriorityOutstanding === 4}
          estateId={estateId}
        />

        <DebtTierCard 
          tierNumber={5}
          title="Unsecured Creditors"
          description="Personal loans, credit cards, and other unsecured debts."
          debts={data.tier5_Unsecured}
          isExpanded={openTier === 5}
          onToggle={() => setOpenTier(openTier === 5 ? null : 5)}
          canPay={data.canPayNextTier && data.highestPriorityOutstanding === 5}
          estateId={estateId}
        />
      </div>
    </div>
  );
};