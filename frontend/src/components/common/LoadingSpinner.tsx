// FILE: src/components/common/LoadingSpinner.tsx

import * as React from 'react';
import { cva, type VariantProps } from 'cva';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 1. Define variants for the spinner's size using cva.
//    This allows us to easily use different sizes like <LoadingSpinner size="lg" />.
const spinnerVariants = cva(
  // Base classes for the SVG animation
  'animate-spin',
  {
    variants: {
      size: {
        default: 'h-8 w-8', // 32px
        sm: 'h-5 w-5',      // 20px
        lg: 'h-12 w-12',    // 48px
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

// 2. Define the props for our component.
//    It extends the standard SVG props and adds our custom `size` variant.
export interface SpinnerProps
  extends React.SVGAttributes<SVGSVGElement>,
    VariantProps<typeof spinnerVariants> {}

// 3. Create the LoadingSpinner component.
const LoadingSpinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size, ...props }, ref) => {
    
    // Combine the variant classes with any custom classes.
    const finalClassName = twMerge(clsx(spinnerVariants({ size }), className));

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={finalClassName}
        ref={ref}
        {...props}
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    );
  }
);
LoadingSpinner.displayName = 'LoadingSpinner';

export { LoadingSpinner };