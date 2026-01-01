// components/assets/ValuationHistory.tsx

import React from 'react';
import { format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Badge } from '@/components/ui';
import { MoneyDisplay } from '../shared/MoneyDisplay';
import { ValuationSource, type Money } from '@/types/estate.types';

// We define a local type for the history record as it wasn't in the main API types
// but would be expected in a real-world usage of the system.
export interface ValuationRecord {
  id: string;
  date: string; // ISO Date
  amount: Money;
  source: ValuationSource;
  reason?: string;
}

interface ValuationHistoryProps {
  history: ValuationRecord[];
}

export const ValuationHistory: React.FC<ValuationHistoryProps> = ({ history }) => {
  // Sort history by date descending
  const sortedHistory = [...history].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <History className="h-5 w-5 text-slate-500" />
          Valuation History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedHistory.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No valuation history recorded.
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:h-full before:w-0.5 before:bg-slate-200">
            {sortedHistory.map((record, index) => {
              // Determine trend if not the last item
              let TrendIcon = Minus;
              let trendColor = "text-slate-400";
              
              if (index < sortedHistory.length - 1) {
                const prev = sortedHistory[index + 1];
                if (record.amount.amount > prev.amount.amount) {
                  TrendIcon = TrendingUp;
                  trendColor = "text-emerald-500";
                } else if (record.amount.amount < prev.amount.amount) {
                  TrendIcon = TrendingDown;
                  trendColor = "text-red-500";
                }
              }

              return (
                <div key={record.id} className="relative pl-8">
                  {/* Dot on timeline */}
                  <div className="absolute left-0 top-1.5 h-5 w-5 rounded-full border-2 border-white bg-slate-300 flex items-center justify-center shadow-sm z-10">
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900">
                        {format(new Date(record.date), 'MMM d, yyyy')}
                      </span>
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        {record.source.replace('_', ' ')}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                       <span className="text-lg font-bold">
                         <MoneyDisplay amount={record.amount} />
                       </span>
                       {index < sortedHistory.length - 1 && (
                         <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                       )}
                    </div>

                    {record.reason && (
                      <p className="text-xs text-muted-foreground mt-1 bg-slate-50 p-2 rounded">
                        "{record.reason}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};