import React from 'react';
import { Badge } from '@/components/ui';
import { DebtPriority } from '@/types/estate.types';
import { AlertTriangle, ShieldAlert, AlertCircle, ArrowDown } from 'lucide-react';

interface DebtPriorityBadgeProps {
  priority: DebtPriority;
  showIcon?: boolean;
  className?: string;
}

export const DebtPriorityBadge: React.FC<DebtPriorityBadgeProps> = ({ 
  priority,
  showIcon = true,
  className = ''
}) => {
  switch (priority) {
    case DebtPriority.CRITICAL:
      return (
        <Badge 
          variant="destructive" 
          className={`flex items-center gap-1 ${className}`}
        >
          {showIcon && <AlertTriangle className="w-3 h-3" />}
          <span>Critical</span>
        </Badge>
      );
      
    case DebtPriority.HIGH:
      return (
        <Badge 
          className={`bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1 ${className}`}
        >
          {showIcon && <ShieldAlert className="w-3 h-3" />}
          <span>High</span>
        </Badge>
      );
      
    case DebtPriority.MEDIUM:
      return (
        <Badge 
          variant="secondary" 
          className={`bg-blue-100 text-blue-800 hover:bg-blue-200 flex items-center gap-1 ${className}`}
        >
          {showIcon && <AlertCircle className="w-3 h-3" />}
          <span>Medium</span>
        </Badge>
      );
      
    case DebtPriority.LOW:
    default:
      return (
        <Badge 
          variant="outline" 
          className={`text-gray-600 border-gray-300 flex items-center gap-1 ${className}`}
        >
          {showIcon && <ArrowDown className="w-3 h-3" />}
          <span>Low</span>
        </Badge>
      );
  }
};