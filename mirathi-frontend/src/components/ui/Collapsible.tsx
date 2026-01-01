import * as React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { cn } from '@/lib/utils';

export const Collapsible = CollapsiblePrimitive.Root;

export const CollapsibleTrigger = CollapsiblePrimitive.Trigger;

export const CollapsibleContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>
>(({ className, ...props }, ref) => (
  <CollapsiblePrimitive.Content
    ref={ref}
    className={cn(
      'data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden',
      className
    )}
    {...props}
  />
));

CollapsibleContent.displayName = 'CollapsibleContent';
