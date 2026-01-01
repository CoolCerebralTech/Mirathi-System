// components/tax/TaxTimeline.tsx

import React from 'react';
import { format } from 'date-fns';
import { 
  CheckCircle2, 
  Clock, 
  FileSpreadsheet, 
  AlertCircle 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { MoneyDisplay } from '../shared/MoneyDisplay';
import { cn } from '@/lib/utils';
import type { DebtItemResponse } from '@/types/estate.types';

interface TaxTimelineProps {
  taxDebts: DebtItemResponse[]; // Pass in Tier 4 Debts
}

export const TaxTimeline: React.FC<TaxTimelineProps> = ({ taxDebts }) => {
  const hasHistory = taxDebts && taxDebts.length > 0;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-slate-500" />
          Assessment & Payment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasHistory ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Clock className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-sm">No tax assessments recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            {taxDebts.map((item) => {
              const isPaid = item.status === 'PAID';
              const isPartiallyPaid = item.status === 'PARTIALLY_PAID';

              return (
                <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  
                  {/* Icon */}
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow",
                    isPaid 
                      ? "bg-emerald-100 border-emerald-500 text-emerald-600" 
                      : "bg-white border-slate-300 text-slate-400"
                  )}>
                    {isPaid ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  </div>
                  
                  {/* Content Card */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-700">{item.description}</span>
                      <time className="font-mono text-xs text-slate-500">
                        {item.dueDate ? format(new Date(item.dueDate), 'MMM d, yyyy') : 'No Date'}
                      </time>
                    </div>
                    
                    <div className="text-sm text-slate-600 mb-2">
                      <span className="font-medium text-slate-900">{item.creditorName}</span> (Ref: {item.id.slice(0, 8)})
                    </div>

                    <div className="flex items-center justify-between bg-slate-50 p-2 rounded text-sm">
                      <div className="flex flex-col">
                         <span className="text-[10px] uppercase text-muted-foreground">Assessed</span>
                         <MoneyDisplay amount={item.originalAmount} />
                      </div>
                      <div className="text-right flex flex-col">
                         <span className="text-[10px] uppercase text-muted-foreground">Outstanding</span>
                         <span className={isPaid ? "text-emerald-600 font-medium" : "text-red-600 font-medium"}>
                            <MoneyDisplay amount={item.outstandingAmount} />
                         </span>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="mt-2 flex justify-end">
                        <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full",
                            isPaid ? "bg-emerald-100 text-emerald-700" : 
                            isPartiallyPaid ? "bg-amber-100 text-amber-700" :
                            "bg-slate-100 text-slate-600"
                        )}>
                            {item.status.replace('_', ' ')}
                        </span>
                    </div>
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