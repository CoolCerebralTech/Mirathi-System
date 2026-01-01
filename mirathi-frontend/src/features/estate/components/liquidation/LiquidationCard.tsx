// components/liquidation/LiquidationCard.tsx

import React from 'react';
import { format } from 'date-fns';
import { Gavel, DollarSign, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';
import { LiquidationTracker } from './LiquidationTracker';
import { MoneyDisplay } from '../shared/MoneyDisplay';
import { LiquidationType, type Money } from '@/types/estate.types';

// We need a specific interface for Liquidation Items as they weren't fully detailed in the original API types response
// Assuming the shape based on the workflow
export interface LiquidationItem {
  id: string;
  assetId: string;
  assetName: string;
  type: LiquidationType;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'SOLD' | 'COMPLETED' | 'CANCELLED';
  targetAmount: Money;
  actualAmount?: Money;
  initiatedDate: string;
  reason: string;
}

interface LiquidationCardProps {
  item: LiquidationItem;
  onApprove: (id: string) => void;
  onRecordSale: (id: string) => void;
  onReceiveProceeds: (id: string) => void;
}

export const LiquidationCard: React.FC<LiquidationCardProps> = ({
  item,
  onApprove,
  onRecordSale,
  onReceiveProceeds
}) => {
  return (
    <Card className="shadow-sm border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold text-slate-900">
              Selling: {item.assetName}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px] font-normal">
                {item.type.replace(/_/g, ' ')}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Init: {format(new Date(item.initiatedDate), 'MMM d')}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase">Target</p>
            <div className="font-bold text-slate-700">
              <MoneyDisplay amount={item.targetAmount} />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Stepper */}
        <div className="px-1">
          <LiquidationTracker currentStatus={item.status} />
        </div>

        {/* Details & Reason */}
        <div className="bg-slate-50 p-3 rounded border border-slate-100 text-sm">
           <span className="font-medium text-slate-700">Reason: </span>
           <span className="text-slate-600">{item.reason}</span>
        </div>

        {/* Actual Sale info if sold */}
        {item.actualAmount && (
          <div className="flex items-center justify-between p-2 bg-emerald-50 text-emerald-800 rounded border border-emerald-100 text-sm">
            <span className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Final Sale Price:
            </span>
            <span className="font-bold">
              <MoneyDisplay amount={item.actualAmount} />
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="bg-slate-50 p-3 flex justify-end gap-2 border-t">
        {item.status === 'PENDING_APPROVAL' && (
          <Button size="sm" onClick={() => onApprove(item.id)} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Gavel className="h-3.5 w-3.5" /> Approve Sale
          </Button>
        )}
        
        {item.status === 'APPROVED' && (
          <Button size="sm" onClick={() => onRecordSale(item.id)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <DollarSign className="h-3.5 w-3.5" /> Record Sale
          </Button>
        )}

        {item.status === 'SOLD' && (
          <Button size="sm" onClick={() => onReceiveProceeds(item.id)} className="gap-2" variant="outline">
            Confirm Proceeds Received
          </Button>
        )}
        
        {item.status === 'COMPLETED' && (
           <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
             <Check className="h-3.5 w-3.5" /> Proceeds added to Cash Book
           </span>
        )}
      </CardFooter>
    </Card>
  );
};