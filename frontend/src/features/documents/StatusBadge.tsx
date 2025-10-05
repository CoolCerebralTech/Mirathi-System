// src/features/documents/StatusBadge.tsx
// ============================================================================
// Document Status Badge Component
// ============================================================================
// - A visual indicator for the verification status of a document.
// - Uses dynamic classes based on the `DocumentStatus` prop to apply
//   appropriate colors for immediate visual recognition.
// ============================================================================

import clsx from 'clsx';
import type { DocumentStatus } from '../../types';

interface StatusBadgeProps {
  status: DocumentStatus;
}

const statusStyles: Record<DocumentStatus, { text: string, classes: string }> = {
  PENDING_VERIFICATION: {
    text: 'Pending',
    classes: 'bg-yellow-100 text-yellow-800',
  },
  VERIFIED: {
    text: 'Verified',
    classes: 'bg-green-100 text-green-800',
  },
  REJECTED: {
    text: 'Rejected',
    classes: 'bg-red-100 text-red-800',
  },
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const style = statusStyles[status] || statusStyles.PENDING_VERIFICATION;
  
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