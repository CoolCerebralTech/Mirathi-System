import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, AlertOctagon } from 'lucide-react';
import { Badge } from '../../../components/ui';
import { cn } from '../../../lib/utils';
import { RiskSeverity } from '../../../types/guardianship.types';

interface RiskLevelBadgeProps {
  level: string; // RiskSeverity enum key
  className?: string;
}

export const RiskLevelBadge: React.FC<RiskLevelBadgeProps> = ({ level, className }) => {
  switch (level) {
    case RiskSeverity.CRITICAL:
      return (
        <Badge variant="destructive" className={cn("gap-1 bg-red-600 hover:bg-red-700", className)}>
          <AlertOctagon className="h-3 w-3" /> CRITICAL RISK
        </Badge>
      );
    case RiskSeverity.HIGH:
      return (
        <Badge variant="destructive" className={cn("gap-1 bg-orange-500 hover:bg-orange-600", className)}>
          <AlertTriangle className="h-3 w-3" /> HIGH RISK
        </Badge>
      );
    case RiskSeverity.MEDIUM:
      return (
        <Badge variant="outline" className={cn("gap-1 border-amber-300 bg-amber-50 text-amber-700", className)}>
          <ShieldAlert className="h-3 w-3" /> MONITORING
        </Badge>
      );
    case RiskSeverity.LOW:
    default:
      return (
        <Badge variant="outline" className={cn("gap-1 border-green-300 bg-green-50 text-green-700", className)}>
          <ShieldCheck className="h-3 w-3" /> STABLE
        </Badge>
      );
  }
};