// FILE: src/components/ui/Button.tsx

import * as React from 'react';
import { cva, type VariantProps } from 'cva';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 1. We define the variants for our button using cva.
//    This is where we map props to UnoCSS/Tailwind classes.
const buttonVariants = cva(
  // Base classes applied to all variants
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      // Different visual styles for the button
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary',
      },
      // Different sizes for the button
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
      },
    },
    // Default variants if none are specified
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

// 2. We define the props for our Button component.
//    It extends the standard HTML button props and adds our custom variants.
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

// 3. We create the actual Button component.
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    // We use twMerge and clsx to combine the cva variants with any
    // additional classes passed in via the `className` prop.
    const finalClassName = twMerge(clsx(buttonVariants({ variant, size, className })));

    return (
        <button
            className={finalClassName}
            ref={ref}
            {...props}
        />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };