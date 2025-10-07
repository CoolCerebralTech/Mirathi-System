// FILE: src/components/ui/Textarea.tsx

import * as React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    
    // Define the base styles for the textarea.
    const baseStyles =
      'flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
    
    // Merge base styles with any custom classes.
    const finalClassName = twMerge(clsx(baseStyles, className));

    return (
      <textarea className={finalClassName} ref={ref} {...props} />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };