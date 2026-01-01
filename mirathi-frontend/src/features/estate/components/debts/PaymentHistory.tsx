// components/debts/PaymentHistory.tsx

import React from 'react';
import { format } from 'date-fns';
import { CheckCheck, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { MoneyDisplay } from '../shared/MoneyDisplay';
import type { DebtItemResponse } from '@/types/estate.types';

interface PaymentHistoryProps {
  debts: DebtItemResponse[]; // We filter for PAID/PARTIALLY_PAID in the parent or here
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({ debts }) => {
  // Flattening payments would ideally come from a specific 'payments' endpoint,
  // but here we simulate it by showing the debts that have been paid/settled.
  const paidDebts = debts.filter(d => d.status === 'PAID' || d.status === 'PARTIALLY_PAID');

  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-slate-600">Recent Settlements</CardTitle>
      </CardHeader>
      <CardContent>
        {paidDebts.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No payments recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {paidDebts.slice(0, 5).map(debt => (
              <div key={debt.id} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <CheckCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{debt.creditorName}</p>
                    <p className="text-xs text-muted-foreground">
                        {/* Assuming updated at is the payment date for this MVP view */}
                        {format(new Date(), 'MMM d, yyyy')} 
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">
                    <MoneyDisplay amount={debt.originalAmount} />
                  </p>
                  <p className="text-[10px] text-emerald-600 font-medium flex items-center justify-end gap-0.5">
                    Settled <ArrowUpRight className="h-3 w-3" />
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};