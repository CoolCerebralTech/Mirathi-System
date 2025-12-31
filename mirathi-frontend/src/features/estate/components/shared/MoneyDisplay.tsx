import React from 'react';
import { cn } from '../../../../lib/utils';
import { type Money } from '../../../../types/estate.types';

interface MoneyDisplayProps {
  amount: number | Money;
  currency?: string;
  className?: string;
  colored?: boolean; // Green for positive, Red for negative
}

export const MoneyDisplay: React.FC<MoneyDisplayProps> = ({ 
  amount, 
  currency = 'KES', 
  className,
  colored = false 
}) => {
  const value = typeof amount === 'object' ? amount.amount : amount;
  const curr = typeof amount === 'object' ? amount.currency : currency;

  const formatted = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: curr,
    minimumFractionDigits: 2,
  }).format(value);

  const colorClass = colored 
    ? value > 0 
      ? "text-green-600" 
      : value < 0 
        ? "text-red-600" 
        : "text-muted-foreground"
    : "";

  return (
    <span className={cn("font-mono font-medium tracking-tight", colorClass, className)}>
      {formatted}
    </span>
  );
};