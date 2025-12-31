import React from 'react';
import { Progress } from '@/components/ui';
import { cn } from '@/lib/utils';

interface ProgressTrackerProps {
  percentage: number; // 0 to 100
  currentStepLabel?: string;
  className?: string;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ 
  percentage, 
  currentStepLabel,
  className 
}) => {
  // Ensure percentage is between 0 and 100
  const validPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      <div className="flex justify-between items-center text-xs">
        <span className="font-medium text-slate-700">
          {currentStepLabel || 'Draft Completion'}
        </span>
        <span className="text-muted-foreground font-mono">
          {Math.round(validPercentage)}%
        </span>
      </div>
      
      <Progress 
        value={validPercentage} 
        className="h-2 bg-slate-100" 
        // Note: Standard shadcn Progress doesn't support indicatorClassName prop
        // We rely on the default primary color or override via CSS variables
      />
      
      {validPercentage === 100 && (
        <p className="text-[10px] text-emerald-600 font-medium text-right pt-0.5">
          Ready for Review
        </p>
      )}
    </div>
  );
};