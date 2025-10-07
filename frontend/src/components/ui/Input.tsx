// FILE: src/components/ui/Input.tsx

import * as React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 1. Define the props for our Input component.
//    It extends the standard HTML input element's props.
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

// 2. Create the Input component.
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    
    // Define the base styles for the input using UnoCSS/Tailwind classes.
    const baseStyles =
      'flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

    // Merge the base styles with any additional classes passed via props.
    // twMerge is smart about overriding conflicting classes (e.g., if you pass 'w-1/2', it overrides 'w-full').
    const finalClassName = twMerge(clsx(baseStyles, className));

    return (
        <input
            type={type}
            className={finalClassName}
            ref={ref}
            {...props}
        />
    );
  }
);
Input.displayName = 'Input';

export { Input };