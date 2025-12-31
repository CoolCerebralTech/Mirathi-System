import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui';
import { cn } from '@/lib/utils';

interface QualificationStatusProps {
  isQualified: boolean;
  statusText?: string; // e.g. "Pending Consent" or "Disqualified"
  className?: string;
}

export const QualificationStatus: React.FC<QualificationStatusProps> = ({ 
  isQualified, 
  statusText,
  className 
}) => {
  if (isQualified) {
    return (
      <div className={cn("flex items-center gap-1.5 text-xs font-medium text-emerald-600", className)}>
        <CheckCircle2 className="h-4 w-4" />
        <span>Qualified (S.6 LSA)</span>
      </div>
    );
  }

  // If not qualified, distinguish between "Unknown/Pending" and "Disqualified"
  const isDisqualified = statusText?.toLowerCase().includes('disqualified') || 
                         statusText?.toLowerCase().includes('minor');

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-1.5 text-xs font-medium cursor-help",
            isDisqualified ? "text-red-600" : "text-amber-600",
            className
          )}>
            {isDisqualified ? <XCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <span>{statusText || 'Verification Needed'}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Executors must be 18+ and of sound mind.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};