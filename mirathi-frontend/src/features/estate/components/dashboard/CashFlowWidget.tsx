// components/dashboard/CashFlowWidget.tsx

import React from 'react';
import { Wallet, LockKeyhole } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Progress } from '@/components/ui';
import { MoneyDisplay } from '../shared/MoneyDisplay';
import type { EstateDashboardResponse } from '@/types/estate.types';

interface CashFlowWidgetProps {
  data: EstateDashboardResponse;
}

export const CashFlowWidget: React.FC<CashFlowWidgetProps> = ({ data }) => {
  const { 
    cashOnHand = { amount: 0, currency: 'KES', formatted: 'KES 0.00' }, 
    cashReserved = { amount: 0, currency: 'KES', formatted: 'KES 0.00' }, 
    availableCash = { amount: 0, currency: 'KES', formatted: 'KES 0.00' } 
  } = data;

  const totalCash = cashOnHand.amount || 0;
  const reservedAmount = cashReserved.amount || 0;
  
  // Calculate percentage safe from NaN
  const reservedPercentage = totalCash > 0 
    ? Math.min((reservedAmount / totalCash) * 100, 100) 
    : 0;

  return (
    <Card className="shadow-sm h-full flex flex-col justify-between">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Wallet className="h-5 w-5 text-slate-500" />
          Liquidity Position
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Main Available Figure */}
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-500">Available for Distribution/Debts</p>
          <div className="text-3xl font-bold tracking-tight text-emerald-600">
            <MoneyDisplay amount={availableCash} />
          </div>
        </div>

        {/* Visualization */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Utilization</span>
            <span>{reservedPercentage.toFixed(1)}% Reserved</span>
          </div>
          {/* Using Tailwind child selector for color */}
          <Progress 
            value={reservedPercentage} 
            className="h-2 bg-slate-100 [&>*]:bg-amber-500" 
          />
        </div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1 rounded-md bg-slate-50 p-3 border border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Wallet className="h-3.5 w-3.5" />
              Total Cash
            </div>
            <p className="font-semibold text-slate-900">
              <MoneyDisplay amount={cashOnHand} />
            </p>
          </div>

          <div className="space-y-1 rounded-md bg-amber-50 p-3 border border-amber-100">
            <div className="flex items-center gap-1.5 text-xs text-amber-700">
              <LockKeyhole className="h-3.5 w-3.5" />
              Reserved
            </div>
            <p className="font-semibold text-amber-900">
              <MoneyDisplay amount={cashReserved} />
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};