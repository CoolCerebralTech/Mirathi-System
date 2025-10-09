// FILE: src/components/common/StatCard.tsx

import * as React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  const isPositiveTrend = trend && trend.value > 0;
  const isNegativeTrend = trend && trend.value < 0;

  return (
    <Card className={cn('transition-shadow hover:shadow-md', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && (
          <Icon className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <div className="mt-1 flex items-center gap-2">
            {trend && (
              <div
                className={cn(
                  'flex items-center text-xs font-medium',
                  isPositiveTrend && 'text-green-600',
                  isNegativeTrend && 'text-red-600'
                )}
              >
                {isPositiveTrend && <TrendingUp className="mr-1 h-3 w-3" />}
                {isNegativeTrend && <TrendingDown className="mr-1 h-3 w-3" />}
                {Math.abs(trend.value)}% {trend.label}
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}