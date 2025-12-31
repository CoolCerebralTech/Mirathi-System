import React from 'react';
import { Progress } from '@/components/ui';
import { cn } from '@/lib/utils';

interface BequestBreakdownProps {
  valueSummary: string; // e.g. "50%" or "KES 1,000,000"
  type: string;
  className?: string;
}

export const BequestBreakdown: React.FC<BequestBreakdownProps> = ({ valueSummary, type, className }) => {
  // Helper to extract number from string "50%" -> 50
  const getPercentage = (val: string) => {
    if (val.includes('%')) {
      const num = parseFloat(val.replace('%', ''));
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  const isPercentage = type === 'PERCENTAGE' || type === 'RESIDUARY';
  const percentageValue = isPercentage ? getPercentage(valueSummary) : 0;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex justify-between items-baseline">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Allocation
        </span>
        <span className="font-bold text-slate-900">
          {valueSummary}
        </span>
      </div>

      {isPercentage && (
        <div className="relative">
          <Progress value={percentageValue} className="h-2" />
          {/* Visual marker for visual balance */}
          {percentageValue > 0 && (
            <div 
              className="absolute top-3 right-0 text-[10px] text-muted-foreground"
              style={{ left: `${percentageValue}%`, transform: 'translateX(-50%)' }}
            >
            </div>
          )}
        </div>
      )}

      {!isPercentage && (
         <p className="text-xs text-muted-foreground truncate">
           Fixed value allocation
         </p>
      )}
    </div>
  );
};