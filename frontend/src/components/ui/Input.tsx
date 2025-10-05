// src/components/ui/Input.tsx
// ============================================================================
// Reusable Input Component
// ============================================================================
// - A styled, accessible, and reusable input field for forms.
// - It accepts all standard HTML input props for maximum flexibility.
// - Includes built-in styling for labels, focus states, and error messages.
// - Uses `clsx` to conditionally apply error styling.
// ============================================================================

import { forwardRef, type InputHTMLAttributes } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, name, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <div className="mt-1">
          <input
            id={name}
            name={name}
            ref={ref}
            className={clsx(
              'block w-full rounded-md border-gray-300 shadow-sm',
              'focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm',
              'transition duration-150 ease-in-out',
              { 'border-red-500 focus:border-red-500 focus:ring-red-500': error },
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600" id={`${name}-error`}>
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';