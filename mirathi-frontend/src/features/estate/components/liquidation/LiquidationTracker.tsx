// components/liquidation/LiquidationTracker.tsx

import React from 'react';
import { Check, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';

// We define the stages of a liquidation workflow
const STEPS = [
  { id: 'INITIATED', label: 'Initiated' },
  { id: 'APPROVED', label: 'Court/Beneficiary Approval' },
  { id: 'SOLD', label: 'Sale Recorded' },
  { id: 'PROCEEDS_RECEIVED', label: 'Cash Received' },
];

interface LiquidationTrackerProps {
  currentStatus: string; // 'PENDING_APPROVAL', 'APPROVED', 'SOLD', 'COMPLETED'
}

export const LiquidationTracker: React.FC<LiquidationTrackerProps> = ({ currentStatus }) => {
  // Map API status to step index
  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING_APPROVAL': return 0;
      case 'APPROVED': return 1;
      case 'SOLD': return 2;
      case 'COMPLETED': return 3;
      case 'CANCELLED': return -1;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(currentStatus);
  const isCancelled = currentStatus === 'CANCELLED';

  if (isCancelled) {
    return (
      <div className="w-full rounded-md bg-slate-100 p-3 text-center text-sm font-medium text-slate-500">
        Liquidation Cancelled
      </div>
    );
  }

  return (
    <div className="relative flex w-full justify-between">
      {/* Connector Line */}
      <div className="absolute left-0 top-3 h-0.5 w-full -z-10 bg-slate-100">
        <div 
          className="h-full bg-emerald-500 transition-all duration-500" 
          style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
        />
      </div>

      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <div key={step.id} className="flex flex-col items-center gap-2">
            <div className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors bg-white",
              isCompleted ? "border-emerald-500 bg-emerald-500 text-white" :
              isCurrent ? "border-emerald-500 text-emerald-600" :
              "border-slate-300 text-slate-300"
            )}>
              {isCompleted ? <Check className="h-3.5 w-3.5" /> : 
               isCurrent ? <CircleDot className="h-3.5 w-3.5" /> : 
               <span className="h-2 w-2 rounded-full bg-slate-200" />}
            </div>
            <span className={cn(
              "text-[10px] font-medium text-center w-20 leading-tight",
              isCurrent || isCompleted ? "text-slate-900" : "text-slate-400"
            )}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};