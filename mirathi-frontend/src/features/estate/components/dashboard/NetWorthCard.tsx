// ============================================================================
// FILE: NetWorthCard.tsx
// ============================================================================

import React from 'react';
import { TrendingUp, TrendingDown, Wallet, DollarSign, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Progress, Badge } from '@/components/ui';
import type { EstateSummaryResponse } from '@/types/estate.types';

interface NetWorthCardProps {
  summary: EstateSummaryResponse;
}

export const NetWorthCard: React.FC<NetWorthCardProps> = ({ summary }) => {
  // 1. DESTRUCTURE HERE
  const { overview, stats } = summary;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: overview.currency, // Use overview.currency
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const healthPercentage = overview.isInsolvent ? 0 : 100;

  const getHealthColor = (isInsolvent: boolean): string => {
    return isInsolvent ? 'bg-red-600' : 'bg-green-600';
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow border-t-4 border-t-blue-600">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Estate Net Worth
        </CardTitle>
        <div className="p-2 bg-blue-100 rounded-full">
          <Wallet className="h-4 w-4 text-blue-600" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Net Worth Display */}
        <div>
          <div className="text-3xl font-bold text-foreground">
            {formatCurrency(overview.netWorth)} {/* Use overview.netWorth */}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {overview.currency} • Kenyan Shillings
          </p>
        </div>

        {/* Asset & Debt Breakdown */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span className="font-semibold">{stats.assetCount}</span> {/* Use stats.assetCount */}
            </div>
            <span className="text-muted-foreground">Asset{stats.assetCount !== 1 ? 's' : ''}</span>
          </div>
          
          <div className="h-4 w-px bg-border" />
          
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1 text-red-600">
              <TrendingDown className="h-4 w-4" />
              <span className="font-semibold">{stats.debtCount}</span> {/* Use stats.debtCount */}
            </div>
            <span className="text-muted-foreground">Debt{stats.debtCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Solvency Status */}
        {overview.isInsolvent ? ( /* Use overview.isInsolvent */
          <div className="p-3 bg-red-50 border-2 border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-red-900">
                  Estate is Insolvent
                </p>
                <p className="text-xs text-red-800">
                  Total liabilities exceed total assets. Creditors must be paid first 
                  according to Section 45 priority before any distribution.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground font-medium">Estate Health</span>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                <DollarSign className="h-3 w-3 mr-1" />
                Solvent
              </Badge>
            </div>
            <Progress 
              value={healthPercentage} 
              className="h-2" 
              indicatorClassName={getHealthColor(overview.isInsolvent)}
            />
            <p className="text-xs text-muted-foreground">
              Estate has positive net worth and can distribute to beneficiaries
            </p>
          </div>
        )}

        {/* Quick Stats Footer */}
        <div className="pt-3 border-t grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Total Items</p>
            <p className="font-semibold text-foreground">
              {stats.assetCount + stats.debtCount} Records
            </p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground">Currency</p>
            <p className="font-semibold text-foreground">{overview.currency}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};