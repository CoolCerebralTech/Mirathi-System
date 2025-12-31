import React from 'react';
import { Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

interface CapacityRiskBadgeProps {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  className?: string;
}

export const CapacityRiskBadge: React.FC<CapacityRiskBadgeProps> = ({ level, className }) => {
  const getConfig = () => {
    switch (level) {
      case 'LOW':
        return {
          label: 'Low Risk',
          icon: ShieldCheck,
          className: 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
        };
      case 'MEDIUM':
        return {
          label: 'Moderate Risk',
          icon: ShieldAlert,
          className: 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100'
        };
      case 'HIGH':
        return {
          label: 'High Risk',
          icon: ShieldX,
          className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100'
        };
      default:
        return {
          label: 'Unknown',
          icon: ShieldAlert,
          className: 'bg-slate-100 text-slate-800 border-slate-200'
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={cn("flex items-center gap-1.5 px-2.5 py-0.5", config.className, className)}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
};