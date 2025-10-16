import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

import { buttonVariants, type ButtonVariantProps } from './button-variants';

// =============================================================================
// Types
// =============================================================================
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantProps {
  /** Optional loading state */
  isLoading?: boolean;
  /** Optional left icon */
  leftIcon?: React.ReactNode;
  /** Optional right icon */
  rightIcon?: React.ReactNode;
  /** Make button render as a different element (e.g. <Link>) */
  asChild?: boolean;
}

// =============================================================================
// Component
// =============================================================================
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      rounded,
      isLoading = false,
      leftIcon,
      rightIcon,
      asChild = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || isLoading;

    // When asChild is true, we cannot wrap children with extra elements
    // The child component must handle its own structure
    if (asChild) {
      return (
        <Comp
          ref={ref}
          className={cn(buttonVariants({ variant, size, rounded }), className)}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    // Normal button rendering with icons and loading state
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, rounded }), className)}
        disabled={isDisabled}
        {...props}
      >
        {/* Left side (Spinner or Icon) */}
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          leftIcon
        )}

        {/* Text */}
        <span className={isLoading ? 'opacity-70' : ''}>{children}</span>

        {/* Right Icon (only visible when not loading) */}
        {!isLoading && rightIcon}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { Button };
