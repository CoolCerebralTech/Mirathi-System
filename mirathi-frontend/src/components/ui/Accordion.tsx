/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

// -----------------------------------------------------------------------------
// Root Accordion
// -----------------------------------------------------------------------------
export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'single' | 'multiple';
  collapsible?: boolean;
  children: React.ReactNode;
}

export function Accordion({
  children,
  className,
  type = 'single',
  collapsible = true,
  ...props
}: AccordionProps) {
  const [openItems, setOpenItems] = React.useState<string[]>([]);

  const toggleItem = React.useCallback(
    (value: string) => {
      setOpenItems((prev) => {
        const isOpen = prev.includes(value);

        if (type === 'single') {
          if (isOpen && collapsible) return [];
          return [value];
        }

        // multiple
        if (isOpen) return prev.filter((v) => v !== value);
        return [...prev, value];
      });
    },
    [type, collapsible]
  );

  return (
    <div
      className={cn('space-y-0', className)}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement<AccordionItemProps>(child)) return child;

        const value = child.props.value;
        const isOpen = openItems.includes(value);

        return React.cloneElement(child, {
          isOpen,
          onToggle: () => toggleItem(value),
        });
      })}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Accordion Item
// -----------------------------------------------------------------------------
export interface AccordionItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  isOpen?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
}

export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ className, children, isOpen, onToggle, ...props }, ref) => {
    // Clone children to pass isOpen and onToggle down
    const childrenWithProps = React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child as React.ReactElement<any>, {
          isOpen,
          onToggle,
        });
      }
      return child;
    });

    return (
      <div
        ref={ref}
        className={cn('group overflow-hidden transition-all duration-300', className)}
        {...props}
      >
        {childrenWithProps}
      </div>
    );
  }
);
AccordionItem.displayName = 'AccordionItem';

// -----------------------------------------------------------------------------
// Accordion Trigger
// -----------------------------------------------------------------------------
export interface AccordionTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isOpen?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
}

export const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  AccordionTriggerProps
>(({ children, isOpen, onToggle, className, ...props }, ref) => (
  <button
    ref={ref}
    onClick={onToggle}
    aria-expanded={isOpen}
    className={cn(
      'flex w-full items-center justify-between px-6 py-5 text-left font-serif text-lg font-semibold transition-colors',
      isOpen ? 'text-primary' : 'text-text hover:text-primary',
      className
    )}
    {...props}
  >
    <span>{children}</span>
    <ChevronDown
      className={cn(
        'h-5 w-5 flex-shrink-0 transition-transform duration-300',
        isOpen ? 'rotate-180 text-primary' : 'text-text-subtle'
      )}
    />
  </button>
));
AccordionTrigger.displayName = 'AccordionTrigger';

// -----------------------------------------------------------------------------
// Accordion Content
// -----------------------------------------------------------------------------
export interface AccordionContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  isOpen?: boolean;
  children: React.ReactNode;
}

export const AccordionContent = React.forwardRef<
  HTMLDivElement,
  AccordionContentProps
>(({ children, isOpen, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'overflow-hidden transition-all duration-500 ease-in-out',
      isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0',
      className
    )}
    {...props}
  >
    <div className={cn(
      'px-6 pb-6 pt-2 text-base leading-relaxed text-text-subtle',
      !isOpen && 'pointer-events-none'
    )}>
      {children}
    </div>
  </div>
));
AccordionContent.displayName = 'AccordionContent';
