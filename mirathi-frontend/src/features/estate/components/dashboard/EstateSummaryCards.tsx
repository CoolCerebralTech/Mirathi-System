import React from 'react';
import { TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { Card, CardContent } from '../../../../components/ui';
import { MoneyDisplay } from '../shared/MoneyDisplay';
import { type EstateDashboardResponse } from '../../../../types/estate.types';

interface EstateSummaryCardsProps {
  data: EstateDashboardResponse;
}

export const EstateSummaryCards: React.FC<EstateSummaryCardsProps> = ({ data }) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* 1. Net Worth */}
      <Card className="border-l-4 border-l-primary shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Est. Net Worth</p>
              <div className="text-2xl font-bold">
                <MoneyDisplay amount={data.netWorth} colored />
              </div>
            </div>
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <Scale className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Gross Assets */}
      <Card className="border-l-4 border-l-green-500 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Gross Assets</p>
              <div className="text-2xl font-bold text-green-600">
                <MoneyDisplay amount={data.grossAssets} />
              </div>
            </div>
            <div className="rounded-full bg-green-100 p-3 text-green-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Total Liabilities */}
      <Card className="border-l-4 border-l-amber-500 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Liabilities</p>
              <div className="text-2xl font-bold text-amber-600">
                <MoneyDisplay amount={data.totalLiabilities} />
              </div>
            </div>
            <div className="rounded-full bg-amber-100 p-3 text-amber-600">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};