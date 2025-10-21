import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils'; 
// Root Accordion
export function Accordion({
  children,
  className
}: {
  children: React.ReactNode;
  type?: 'single' | 'multiple';
  collapsible?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('divide-y divide-neutral-200 border border-neutral-200 rounded-lg', className)}>
      {children}
    </div>
  );
}

interface AccordionChildProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export function AccordionItem({
  children
}: {
  value: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="group">
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;

        return React.cloneElement(
          child as React.ReactElement<AccordionChildProps>,
          {
            isOpen,
            onToggle: () => setIsOpen((prev) => !prev)
          }
        );
      })}
    </div>
  );
}


// Accordion Trigger
export function AccordionTrigger({
  children,
  isOpen,
  onToggle,
  className
}: {
  children: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex w-full items-center justify-between px-4 py-3 text-left font-medium hover:bg-neutral-50 transition-colors',
        className
      )}
      aria-expanded={isOpen}
    >
      <span>{children}</span>
      <ChevronDown
        className={cn(
          'h-5 w-5 text-text-subtle transition-transform duration-300',
          isOpen && 'rotate-180'
        )}
      />
    </button>
  );
}

// Accordion Content
export function AccordionContent({
  children,
  isOpen,
  className
}: {
  children: React.ReactNode;
  isOpen?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden transition-all duration-300 ease-in-out',
        isOpen ? 'max-h-96 px-4 pb-4' : 'max-h-0',
        className
      )}
    >
      <div className="text-sm text-text-subtle">{children}</div>
    </div>
  );
}
