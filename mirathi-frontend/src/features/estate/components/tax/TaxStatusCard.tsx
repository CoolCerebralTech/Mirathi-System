// components/tax/TaxStatusCard.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { ShieldCheck, ShieldAlert, FileText, Upload } from 'lucide-react';
import { MoneyDisplay } from '../shared/MoneyDisplay';
import type { Money } from '@/types/estate.types';

interface TaxStatusCardProps {
  taxStatus: string; // From Dashboard API
  outstandingTaxes: Money; // Calculated from Debt Tier 4
  onUploadClearance: () => void;
}

export const TaxStatusCard: React.FC<TaxStatusCardProps> = ({ 
  taxStatus, 
  outstandingTaxes,
  onUploadClearance
}) => {
  const isCompliant = taxStatus === 'COMPLIANT' || taxStatus === 'CLEARED';
  const hasLiabilities = outstandingTaxes.amount > 0;

  return (
    <Card className="border-l-4 border-l-blue-600 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold text-slate-700 flex items-center gap-2">
          {isCompliant ? (
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-amber-600" />
          )}
          KRA Tax Compliance
        </CardTitle>
        <Badge variant={isCompliant ? "default" : "outline"} className={isCompliant ? "bg-emerald-600 hover:bg-emerald-700" : "text-amber-700 bg-amber-50 border-amber-200"}>
          {taxStatus || 'PENDING ASSESSMENT'}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Outstanding Liability</span>
            <div className="text-2xl font-bold text-slate-900">
              <MoneyDisplay amount={outstandingTaxes} colored={false} />
            </div>
          </div>
          
          <div className="flex flex-col items-end justify-center">
             {!isCompliant && (
               <Button 
                 variant="outline" 
                 size="sm" 
                 className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                 onClick={onUploadClearance}
               >
                 <Upload className="h-3.5 w-3.5" />
                 Upload Clearance
               </Button>
             )}
          </div>
        </div>

        <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-600 border border-slate-100 flex gap-2">
          <FileText className="h-4 w-4 text-slate-400 shrink-0" />
          <p>
            {hasLiabilities 
              ? "Tax liabilities must be settled before the estate can be distributed. Interest may accrue on overdue payments."
              : "No outstanding tax liabilities detected. Ensure you have the final Tax Clearance Certificate from KRA."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};