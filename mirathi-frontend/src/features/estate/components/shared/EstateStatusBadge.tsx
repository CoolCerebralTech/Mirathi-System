import React from 'react';
import { Badge } from '../../../../components/ui';
import { EstateStatus } from '../../../../types/estate.types';
import { Lock, CheckCircle, Activity, Archive, FileEdit } from 'lucide-react';
import { cn } from '../../../../lib/utils';

interface EstateStatusBadgeProps {
  status: EstateStatus;
  isFrozen?: boolean;
  className?: string;
}

export const EstateStatusBadge: React.FC<EstateStatusBadgeProps> = ({ 
  status, 
  isFrozen,
  className 
}) => {
  if (isFrozen) {
    return (
      <Badge variant="destructive" className={cn("gap-1 bg-red-600", className)}>
        <Lock className="h-3 w-3" /> FROZEN
      </Badge>
    );
  }

  const config = {
    [EstateStatus.DRAFT]: { label: 'Draft', icon: FileEdit, style: 'bg-slate-100 text-slate-700 border-slate-200' },
    [EstateStatus.ACTIVE]: { label: 'Active Administration', icon: Activity, style: 'bg-blue-50 text-blue-700 border-blue-200' },
    [EstateStatus.DISTRIBUTING]: { label: 'Distributing', icon: CheckCircle, style: 'bg-green-50 text-green-700 border-green-200' },
    [EstateStatus.CLOSED]: { label: 'Closed', icon: Archive, style: 'bg-slate-100 text-slate-500 border-slate-200' },
    [EstateStatus.FROZEN]: { label: 'Frozen', icon: Lock, style: 'bg-red-100 text-red-700 border-red-200' }, // Fallback
  };

  const { label, icon: Icon, style } = config[status] || config[EstateStatus.DRAFT];

  return (
    <Badge variant="outline" className={cn("gap-1", style, className)}>
      <Icon className="h-3 w-3" /> {label}
    </Badge>
  );
};