// FILE: src/components/common/StatusBadge.tsx

import type { TFunction } from 'i18next';
import clsx from 'clsx';
import type { WillStatus, DocumentStatus } from '../../types';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// TYPE DEFINITIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

type StatusType = 'will' | 'document';
type StatusValue = WillStatus | DocumentStatus;

interface StatusBadgeProps {
  t: TFunction;
  type: StatusType;
  status: StatusValue;
  className?: string;
}

interface StatusConfig {
  variant: 'default' | 'secondary' | 'destructive' | 'success' | 'outline';
  textKey: string;
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

/**
 * A reusable badge for displaying various status types (e.g., for Wills, Documents)
 * in a consistent, colored, and internationalized format.
 */
export function StatusBadge({ t, type, status, className }: StatusBadgeProps) {
  const getConfig = (): StatusConfig => {
    switch (type) {
      case 'will':
        switch (status as WillStatus) {
          case 'ACTIVE':
            return { variant: 'success', textKey: 'wills:status_options.ACTIVE' };
          case 'REVOKED':
          case 'EXECUTED':
            return { variant: 'destructive', textKey: `wills:status_options.${status}` };
          case 'DRAFT':
          default:
            return { variant: 'secondary', textKey: 'wills:status_options.DRAFT' };
        }
      case 'document':
        switch (status as DocumentStatus) {
          case 'VERIFIED':
            return { variant: 'success', textKey: 'documents:status_options.VERIFIED' };
          case 'REJECTED':
            return { variant: 'destructive', textKey: 'documents:status_options.REJECTED' };
          case 'PENDING_VERIFICATION':
          default:
            return { variant: 'secondary', textKey: 'documents:status_options.PENDING_VERIFICATION' };
        }
      default:
        return { variant: 'default', textKey: 'common:unknown' };
    }
  };

  const { variant, textKey } = getConfig();

  // Base classes for all badges
  const baseClasses = "px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full";

  // Variant-specific classes
  const variantClasses = {
      default: "border-transparent bg-primary text-primary-foreground",
      secondary: "border-transparent bg-secondary text-secondary-foreground",
      destructive: "border-transparent bg-destructive text-destructive-foreground",
      success: "border-transparent bg-green-500 text-white",
      outline: "text-foreground border"
  };

  return (
    <div className={clsx(baseClasses, variantClasses[variant], className)}>
      {t(textKey, status)}
    </div>
  );
}
