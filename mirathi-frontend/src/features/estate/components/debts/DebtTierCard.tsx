// components/debts/DebtTierCard.tsx

import React from 'react';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Button } from '@/components/ui';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui';
import { MoneyDisplay } from '../shared/MoneyDisplay';
import { cn } from '@/lib/utils';
import type { DebtItemResponse } from '@/types/estate.types';

interface DebtTierCardProps {
  tierNumber: number;
  title: string;
  description: string;
  debts: DebtItemResponse[];
  isExpanded: boolean;
  onToggle: () => void;
  canPay: boolean;
}

export const DebtTierCard: React.FC<DebtTierCardProps> = ({
  tierNumber,
  title,
  description,
  debts,
  isExpanded,
  onToggle,
  canPay,
}) => {
  const outstandingAmount = debts.reduce((sum, d) => sum + d.outstandingAmount.amount, 0);
  const isFullyPaid = debts.length > 0 && outstandingAmount === 0;
  const hasDebts = debts.length > 0;

  return (
    <Card className={cn("border-l-4 transition-all", 
      isFullyPaid ? "border-l-emerald-500 bg-emerald-50/10" : 
      outstandingAmount > 0 ? "border-l-amber-500" : "border-l-slate-200"
    )}>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                isFullyPaid ? "bg-emerald-100 text-emerald-700" : "bg-slate-900 text-white"
              )}>
                {tierNumber}
              </div>
              <div>
                <CardTitle className="text-base text-slate-900">{title}</CardTitle>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] uppercase text-slate-500">Outstanding</p>
                <div className="font-bold text-slate-900">
                  <MoneyDisplay amount={outstandingAmount} />
                </div>
              </div>
              
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4">
             {/* List of debts in this tier */}
             {!hasDebts ? (
               <div className="text-sm text-muted-foreground italic pl-11">
                 No debts recorded in this category.
               </div>
             ) : (
               <div className="space-y-2 pl-11">
                 {debts.map((debt) => (
                   <div key={debt.id} className="flex items-center justify-between p-3 bg-white rounded border border-slate-100 shadow-sm">
                      <div className="space-y-0.5">
                        <div className="font-medium text-sm text-slate-800">{debt.creditorName}</div>
                        <div className="text-xs text-slate-500">{debt.description}</div>
                        {debt.isSecured && (
                           <Badge variant="outline" className="text-[10px] py-0 h-4 mt-1 border-amber-200 text-amber-700 bg-amber-50">
                             Secured Asset
                           </Badge>
                        )}
                      </div>
                      <div className="text-right">
                         <div className="text-sm font-bold">
                            <MoneyDisplay amount={debt.outstandingAmount} />
                         </div>
                         <div className="text-[10px] text-muted-foreground">
                            of <MoneyDisplay amount={debt.originalAmount} />
                         </div>
                      </div>
                   </div>
                 ))}
                 
                 {!isFullyPaid && (
                   <div className="flex items-center gap-2 mt-4 p-2 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {canPay 
                        ? "Funds available. You should settle these priority debts immediately." 
                        : "Insufficient liquid cash to settle this tier fully. Liquidation may be required."}
                   </div>
                 )}
               </div>
             )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};