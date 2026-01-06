import React from 'react';
import { Badge } from '@/components/ui';
import { DebtPriority } from '@/types/estate.types';
import { AlertTriangle, ShieldAlert, ArrowDown } from 'lucide-react';

interface DebtPriorityBadgeProps {
  priority: DebtPriority;
}

export const DebtPriorityBadge: React.FC<DebtPriorityBadgeProps> = ({ priority }) => {
  switch (priority) {
    case DebtPriority.CRITICAL:
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Critical (S.45)
        </Badge>
      );
    case DebtPriority.HIGH:
      return (
        <Badge className="bg-orange-500 hover:bg-orange-600 flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" />
          High Priority
        </Badge>
      );
    case DebtPriority.MEDIUM:
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
          Medium
        </Badge>
      );
    case DebtPriority.LOW:
    default:
      return (
        <Badge variant="outline" className="text-gray-500 flex items-center gap-1">
          <ArrowDown className="w-3 h-3" />
          Low Priority
        </Badge>
      );
  }
};