// FILE: src/components/ui/Tooltip.tsx

import * as React from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

export const Tooltip = RadixTooltip.Root;

export const TooltipTrigger = RadixTooltip.Trigger;

export const TooltipContent: React.FC<RadixTooltip.TooltipContentProps & { className?: string }> = ({
  className,
  side = 'top',
  align = 'center',
  sideOffset = 4,
  children,
  ...props
}) => (
  <RadixTooltip.Portal>
    <RadixTooltip.Content
      side={side}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-md animate-in fade-in-80',
        className
      )}
      {...props}
    >
      {children}
      <RadixTooltip.Arrow className="fill-slate-900" />
    </RadixTooltip.Content>
  </RadixTooltip.Portal>
);
