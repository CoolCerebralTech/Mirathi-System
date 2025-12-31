import * as React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
  /** Whether to show a back button */
  showBackButton?: boolean;
  /** Where the back button should navigate */
  backButtonHref?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  className,
  showBackButton,
  backButtonHref,
}: PageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between border-b pb-4', className)}>
      <div className="flex items-center gap-3">
        {showBackButton && backButtonHref && (
          <Link
            to={backButtonHref}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            <span>Back</span>
          </Link>
        )}

        {/* Icon + Title */}
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="mt-1 rounded-md bg-muted p-2">
              <Icon className="h-5 w-5 text-foreground" />
            </div>
          )}

          <div>
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {description && (
              <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
