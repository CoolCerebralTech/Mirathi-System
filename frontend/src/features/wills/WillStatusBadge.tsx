// src/features/wills/WillStatusBadge.tsx
// ============================================================================
// Will Status Badge Component
// ============================================================================
// - A visual indicator for the status of a will (Draft, Active, etc.).
// - Uses dynamic classes based on the `WillStatus` prop for clear coloring.
// ============================================================================

import clsx from 'clsx';
import type { WillStatus } from '../../types';

interface WillStatusBadgeProps {
  status: WillStatus;
}

const statusStyles: Record<WillStatus, { text: string, classes: string }> = {
  DRAFT: { text: 'Draft', classes: 'bg-gray-100 text-gray-800' },
  ACTIVE: { text: 'Active', classes: 'bg-green-100 text-green-800' },
  REVOKED: { text: 'Revoked', classes: 'bg-yellow-100 text-yellow-800' },
  EXECUTED: { text: 'Executed', classes: 'bg-blue-100 text-blue-800' },
};

export const WillStatusBadge = ({ status }: WillStatusBadgeProps) => {
  const style = statusStyles[status] || statusStyles.DRAFT;
  
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        style.classes
      )}
    >
      {style.text}
    </span>
  );
};