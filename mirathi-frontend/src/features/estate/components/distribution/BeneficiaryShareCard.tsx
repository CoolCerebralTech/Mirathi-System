// components/distribution/BeneficiaryShareCard.tsx

import React from 'react';
import { User, Gift, ArrowDownRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { Progress } from '@/components/ui';
import { Separator } from '@/components/ui';
import { MoneyDisplay } from '../shared/MoneyDisplay';
import type { BeneficiaryShare } from '@/types/estate.types';

interface BeneficiaryShareCardProps {
  share: BeneficiaryShare;
}

export const BeneficiaryShareCard: React.FC<BeneficiaryShareCardProps> = ({ share }) => {
  const hasGift = share.lessGiftInterVivos.amount > 0;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      {/* Header Color Strip */}
      <div className="h-2 w-full bg-gradient-to-r from-blue-500 to-indigo-500" />
      
      <CardContent className="p-5 space-y-4">
        {/* Identity */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">{share.beneficiaryName}</h4>
              <p className="text-xs text-muted-foreground uppercase">{share.relationship}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-light text-slate-400">{share.grossSharePercentage}%</span>
          </div>
        </div>

        <Separator />

        {/* Calculation Block */}
        <div className="space-y-3">
          
          {/* Gross */}
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Gross Share Entitlement</span>
            <span className="font-medium">
              <MoneyDisplay amount={share.grossShareValue} />
            </span>
          </div>

          {/* Deduction (if any) */}
          {hasGift && (
            <div className="flex justify-between text-sm text-red-600 bg-red-50 p-2 rounded">
              <span className="flex items-center gap-1.5">
                <Gift className="h-3.5 w-3.5" /> Less: Gift Inter Vivos
              </span>
              <span className="font-medium">
                - <MoneyDisplay amount={share.lessGiftInterVivos} />
              </span>
            </div>
          )}

          {/* Net */}
          <div className="pt-2">
            <div className="flex justify-between items-end mb-1">
              <span className="text-xs font-bold uppercase text-emerald-600 flex items-center gap-1">
                Net Payout <ArrowDownRight className="h-3 w-3" />
              </span>
              <span className="text-xl font-bold text-slate-900">
                <MoneyDisplay amount={share.netDistributableValue} />
              </span>
            </div>
            {/* Visual bar relative to gross */}
            <Progress 
              value={100} 
              className="h-1.5 bg-slate-100 [&>*]:bg-emerald-500" 
            />
          </div>

        </div>
      </CardContent>
    </Card>
  );
};