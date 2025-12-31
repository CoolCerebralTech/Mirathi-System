import React from 'react';
import { Loader2, Cloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutoSaveIndicatorProps {
  status: SaveStatus;
  lastSavedAt?: Date;
  className?: string;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({ 
  status, 
  lastSavedAt, 
  className 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: Loader2,
          text: 'Saving...',
          color: 'text-slate-500',
          animate: true
        };
      case 'saved':
        return {
          icon: CheckCircle2,
          text: 'Saved',
          color: 'text-emerald-600',
          animate: false
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Save Failed',
          color: 'text-red-600',
          animate: false
        };
      case 'idle':
      default:
        return {
          icon: Cloud,
          text: 'Ready',
          color: 'text-slate-400',
          animate: false
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-2 text-xs font-medium select-none", config.color, className)}>
            <Icon className={cn("h-3.5 w-3.5", config.animate && "animate-spin")} />
            <span>{config.text}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {status === 'error' 
            ? "Check your internet connection." 
            : lastSavedAt 
              ? `Last saved at ${lastSavedAt.toLocaleTimeString()}`
              : "Changes are saved automatically."
          }
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};