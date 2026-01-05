// features/documents/components/shared/DocumentStatusBadge.tsx

import React from 'react';
import { Badge } from '@/components/ui';
import { CheckCircle2, Clock, XCircle, Upload, Timer } from 'lucide-react';
import { type DocumentStatus } from '@/types/document.types';

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  className?: string;
}

export const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({ 
  status, 
  className 
}) => {
  const getStatusConfig = (status: DocumentStatus) => {
    switch (status) {
      case 'VERIFIED':
        return {
          label: 'Verified',
          icon: CheckCircle2,
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200',
        };
      case 'REJECTED':
        return {
          label: 'Rejected',
          icon: XCircle,
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200',
        };
      case 'PENDING_VERIFICATION':
        return {
          label: 'Pending Review',
          icon: Clock,
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        };
      case 'PENDING_UPLOAD':
        return {
          label: 'Uploading',
          icon: Upload,
          variant: 'outline' as const,
          className: 'bg-blue-100 text-blue-800 border-blue-200',
        };
      case 'EXPIRED':
        return {
          label: 'Expired',
          icon: Timer,
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
        };
      default:
        return {
          label: status,
          icon: Clock,
          variant: 'outline' as const,
          className: '',
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.className} ${className}`}>
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
};