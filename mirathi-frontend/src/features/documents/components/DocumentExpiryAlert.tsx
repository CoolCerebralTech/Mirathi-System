// FILE: src/features/documents/components/DocumentExpiryAlert.tsx

import React from 'react';
import { AlertCircle, Calendar, FileWarning } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui';
import { type Document } from '@/types/document.types';

interface DocumentExpiryAlertProps {
  document: Document;
  className?: string;
}

export const DocumentExpiryAlert: React.FC<DocumentExpiryAlertProps> = ({
  document,
  className,
}) => {
  if (!document.expiryDate) return null;

  const expiryDate = new Date(document.expiryDate);
  const today = new Date();
  const daysUntilExpiry = differenceInDays(expiryDate, today);

  // If already expired
  if (daysUntilExpiry < 0) {
    return (
      <Alert variant="destructive" className={cn("mb-4", className)}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            This document expired on {format(expiryDate, 'MMMM d, yyyy')}
          </span>
          <FileWarning className="h-4 w-4" />
        </AlertDescription>
      </Alert>
    );
  }

  // If expiring soon (within 30 days)
  if (daysUntilExpiry <= 30) {
    return (
      <Alert variant="warning" className={cn("mb-4", className)}>
        <Calendar className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>
            This document expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''}
            {daysUntilExpiry <= 7 && ' - Renewal recommended'}
          </span>
          <span className="text-sm font-medium">
            {format(expiryDate, 'MMM d')}
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};