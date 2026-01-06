import React from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Progress } from '@/components/ui';
import type { EstateSummaryResponse } from '@/types/estate.types';

interface NetWorthCardProps {
  summary: EstateSummaryResponse;
}

export const NetWorthCard: React.FC<NetWorthCardProps> = ({ summary }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: summary.currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate generic health ratio for progress bar
  // Simple logic: Health = (NetWorth / (Assets + 1)) * 100
  // If insolvent, it's 0.
  const totalVolume = summary.assetCount > 0 ? summary.netWorth + summary.debtCount : 1; 
  // Better viz logic: What % of assets are debt free?
  // (Assets - Debts) / Assets
  const safeRatio = summary.assetCount > 0 
    ? Math.max(0, (summary.netWorth / (summary.netWorth + 1 /* avoid div 0 in weird cases */))) * 100 
    : 0;

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Net Worth</CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatCurrency(summary.netWorth)}
        </div>
        <div className="flex items-center space-x-2 mt-4 text-sm">
           <div className="flex items-center text-green-600">
             <TrendingUp className="mr-1 h-4 w-4" />
             <span className="font-medium">{summary.assetCount} Assets</span>
           </div>
           <span className="text-gray-300">|</span>
           <div className="flex items-center text-red-600">
             <TrendingDown className="mr-1 h-4 w-4" />
             <span className="font-medium">{summary.debtCount} Debts</span>
           </div>
        </div>

        {summary.isInsolvent ? (
          <div className="mt-4 p-2 bg-red-50 text-red-800 text-xs rounded-md border border-red-100">
            <strong>Warning:</strong> Estate is Insolvent (Debts &gt; Assets).
          </div>
        ) : (
           <div className="mt-4 space-y-1">
             <div className="flex justify-between text-xs text-muted-foreground">
               <span>Solvency Ratio</span>
               <span>Healthy</span>
             </div>
             <Progress value={100} className="h-1 bg-green-100" indicatorClassName="bg-green-600" />
           </div>
        )}
      </CardContent>
    </Card>
  );
};