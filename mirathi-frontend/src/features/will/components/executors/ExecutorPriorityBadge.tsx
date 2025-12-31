import React from 'react';
import { Badge } from '@/components/ui';
import { ExecutorPriorityType } from '@/types/will.types';
import { cn } from '@/lib/utils';
import { Crown, Shield, Users } from 'lucide-react';

interface ExecutorPriorityBadgeProps {
  priority: string; // Using string to match API response, but theoretically ExecutorPriorityType
  className?: string;
}

export const ExecutorPriorityBadge: React.FC<ExecutorPriorityBadgeProps> = ({ 
  priority, 
  className 
}) => {
  const getConfig = () => {
    switch (priority) {
      case ExecutorPriorityType.PRIMARY:
        return {
          label: 'Primary Executor',
          icon: Crown,
          variant: 'default' as const,
          className: 'bg-indigo-600 hover:bg-indigo-700 border-transparent'
        };
      case ExecutorPriorityType.CO_EXECUTOR:
        return {
          label: 'Co-Executor',
          icon: Users,
          variant: 'secondary' as const,
          className: 'bg-purple-100 text-purple-800 border-purple-200'
        };
      case ExecutorPriorityType.SUBSTITUTE:
        return {
          label: 'Substitute',
          icon: Shield,
          variant: 'outline' as const,
          className: 'bg-slate-50 text-slate-600 border-slate-200 border-dashed'
        };
      default:
        return {
          label: priority,
          icon: Users,
          variant: 'outline' as const,
          className: 'text-slate-600'
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant} 
      className={cn("flex w-fit items-center gap-1.5 whitespace-nowrap", config.className, className)}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};