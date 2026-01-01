// components/dashboard/EstateSummaryCards.tsx

import React from 'react';
import { 
  Scale, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { MoneyDisplay } from '../shared/MoneyDisplay';
import { cn } from '@/lib/utils';
import type { EstateDashboardResponse } from '@/types/estate.types';

interface EstateSummaryCardsProps {
  data: EstateDashboardResponse;
}

export const EstateSummaryCards: React.FC<EstateSummaryCardsProps> = ({ data }) => {
  // Safe destructuring with defaults conforming to Money interface
  const { 
    netWorth = { amount: 0, currency: 'KES', formatted: 'KES 0.00' }, 
    grossAssets = { amount: 0, currency: 'KES', formatted: 'KES 0.00' }, 
    totalLiabilities = { amount: 0, currency: 'KES', formatted: 'KES 0.00' }, 
    solvencyRatio = 0,
    daysSinceDeath = 0
  } = data;

  const isInsolvent = solvencyRatio < 1;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Net Worth Card */}
      <Card className={cn(
        "border-l-4 shadow-sm",
        isInsolvent ? "border-l-red-500" : "border-l-emerald-500"
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">
            Net Worth
          </CardTitle>
          <Scale className={cn("h-4 w-4", isInsolvent ? "text-red-600" : "text-emerald-600")} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <MoneyDisplay amount={netWorth} colored />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-muted-foreground">
              Ratio: <span className="font-medium text-slate-900">{(solvencyRatio * 100).toFixed(0)}%</span>
            </p>
            {isInsolvent && (
              <span className="flex items-center gap-1 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                <AlertCircle className="h-3 w-3" /> Insolvent
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gross Assets Card */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">
            Gross Assets
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            <MoneyDisplay amount={grossAssets} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Administered over {daysSinceDeath} days
          </p>
        </CardContent>
      </Card>

      {/* Liabilities Card */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-600">
            Total Liabilities
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-slate-900">
            <MoneyDisplay amount={totalLiabilities} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Includes debts & tax arrears
          </p>
        </CardContent>
      </Card>
    </div>
  );
};