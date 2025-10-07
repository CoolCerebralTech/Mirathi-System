// FILE: src/components/common/PageHeader.tsx

import * as React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// 1. Define the props for our PageHeader component.
export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  // `actions` is a special prop that will render any React element
  // on the right side of the header, typically for buttons.
  actions?: React.ReactNode;
}

// 2. Create the PageHeader component.
export function PageHeader({ title, description, actions, className, ...props }: PageHeaderProps) {
  
  const baseContainerStyles = 'flex items-center justify-between space-y-2';
  
  const finalContainerClassName = twMerge(clsx(baseContainerStyles, className));

  return (
    <div className={finalContainerClassName} {...props}>
      {/* Container for the title and description */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {/* Container for the action buttons */}
      {actions && (
        <div className="flex items-center space-x-2">
          {actions}
        </div>
      )}
    </div>
  );
}