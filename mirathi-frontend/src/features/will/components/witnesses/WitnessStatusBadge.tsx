import React from 'react';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { 
  UserPlus, 
  PenTool, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

interface WitnessStatusBadgeProps {
  status: string; // 'NOMINATED' | 'PENDING_SIGNATURE' | 'SIGNED'
  signedAt?: string;
  className?: string;
}

export const WitnessStatusBadge: React.FC<WitnessStatusBadgeProps> = ({ 
  status, 
  signedAt, 
  className 
}) => {
  const getConfig = () => {
    switch (status) {
      case 'SIGNED':
      case 'EXECUTED':
        return {
          label: 'Signed & Attested',
          icon: CheckCircle2,
          variant: 'default' as const,
          className: 'bg-emerald-600 hover:bg-emerald-700 border-transparent'
        };
      case 'PENDING_SIGNATURE':
        return {
          label: 'Ready to Sign',
          icon: PenTool,
          variant: 'secondary' as const,
          className: 'bg-blue-100 text-blue-700 border-blue-200'
        };
      case 'NOMINATED':
      default:
        return {
          label: 'Nominated',
          icon: UserPlus,
          variant: 'outline' as const,
          className: 'bg-slate-50 text-slate-600 border-slate-200 dashed'
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-end gap-1">
      <Badge 
        variant={config.variant} 
        className={cn("flex w-fit items-center gap-1.5 whitespace-nowrap", config.className, className)}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
      {status === 'SIGNED' && signedAt && (
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(signedAt).toLocaleDateString()}
        </span>
      )}
    </div>
  );
};