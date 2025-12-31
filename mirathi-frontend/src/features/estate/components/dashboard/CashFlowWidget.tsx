import React from 'react';
import { Wallet, PiggyBank, LockKeyhole } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Separator } from '../../../../components/ui';
import { MoneyDisplay } from '../shared/MoneyDisplay';
import { type EstateDashboardResponse } from '../../../../types/estate.types';

interface CashFlowWidgetProps {
  data: EstateDashboardResponse;
}

export const CashFlowWidget: React.FC<CashFlowWidgetProps> = ({ data }) => {
  // Calculate percentage of cash that is reserved
  const totalCash = data.cashOnHand.amount;
  const reserved = data.cashReserved.amount;
  
  // Avoid division by zero
  const reservedPercentage = totalCash > 0 ? (reserved / totalCash) * 100 : 0;
  const availablePercentage = 100 - reservedPercentage;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blue-600" />
            Liquidity Position
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-6">
        
        {/* The Big Number */}
        <div className="space-y-1">
            <span className="text-sm text-muted-foreground font-medium">Net Available Cash</span>
            <div className="text-3xl font-bold tracking-tight text-blue-700">
                <MoneyDisplay amount={data.availableCash} />
            </div>
            <p className="text-xs text-muted-foreground">
                Free to distribute or use for immediate expenses.
            </p>
        </div>

        {/* Visual Breakdown */}
        <div className="space-y-2">
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100">
                <div 
                    className="bg-blue-500 transition-all duration-500" 
                    style={{ width: `${availablePercentage}%` }} 
                    title="Available"
                />
                <div 
                    className="bg-amber-400 transition-all duration-500 striped-bg" 
                    style={{ width: `${reservedPercentage}%` }} 
                    title="Reserved"
                />
            </div>
            <div className="flex justify-between text-xs font-medium">
                <span className="text-blue-600">Available ({Math.round(availablePercentage)}%)</span>
                <span className="text-amber-600">Reserved ({Math.round(reservedPercentage)}%)</span>
            </div>
        </div>

        <Separator />

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <PiggyBank className="h-3.5 w-3.5" /> Total Cash
                </div>
                <div className="font-semibold">
                    <MoneyDisplay amount={data.cashOnHand} />
                </div>
            </div>

            <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-amber-600">
                    <LockKeyhole className="h-3.5 w-3.5" /> Reserved
                </div>
                <div className="font-semibold text-amber-700">
                    <MoneyDisplay amount={data.cashReserved} />
                </div>
            </div>
        </div>

      </CardContent>
    </Card>
  );
};