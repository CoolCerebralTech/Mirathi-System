import React from 'react';
import { Badge } from '@/components/ui';
import { WillStatus } from '@/types/will.types';
import { cn } from '@/lib/utils';
import { 
  FileEdit, 
  CheckCircle2, 
  AlertOctagon, 
  Archive, 
  Clock 
} from 'lucide-react';

interface WillStatusBadgeProps {
  status: WillStatus;
  className?: string;
}

export const WillStatusBadge: React.FC<WillStatusBadgeProps> = ({ status, className }) => {
  const getConfig = () => {
    switch (status) {
      case WillStatus.DRAFT:
        return {
          label: 'Draft',
          variant: 'secondary' as const,
          icon: FileEdit,
          className: 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
        };
      case WillStatus.PENDING_EXECUTION:
        return {
          label: 'Pending Execution',
          variant: 'outline' as const,
          icon: Clock,
          className: 'text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100'
        };
      case WillStatus.ACTIVE:
        return {
          label: 'Active',
          variant: 'default' as const,
          icon: CheckCircle2,
          className: 'bg-emerald-600 hover:bg-emerald-700 border-transparent'
        };
      case WillStatus.EXECUTED:
        return {
          label: 'Executed (Deceased)',
          variant: 'outline' as const,
          icon: Archive,
          className: 'text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100'
        };
      case WillStatus.REVOKED:
        return {
          label: 'Revoked',
          variant: 'destructive' as const,
          icon: AlertOctagon,
          className: ''
        };
      default:
        return {
          label: status,
          variant: 'outline' as const,
          icon: null,
          className: ''
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant} 
      className={cn("flex items-center gap-1.5 px-2.5 py-0.5 uppercase text-xs font-semibold tracking-wide", config.className, className)}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {config.label}
    </Badge>
  );
};