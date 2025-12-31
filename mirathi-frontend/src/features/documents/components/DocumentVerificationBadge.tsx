// FILE: src/features/documents/components/DocumentVerificationBadge.tsx

import React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  XCircle,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui';
import { DocumentStatusEnum, type Document } from '@/types/document.types';

interface DocumentVerificationBadgeProps {
  document: Document;
  showIcon?: boolean;
  showRejectionReason?: boolean;
  className?: string;
}

export const DocumentVerificationBadge: React.FC<DocumentVerificationBadgeProps> = ({
  document,
  showIcon = true,
  showRejectionReason = false,
  className,
}) => {
  const getStatusConfig = () => {
    switch (document.status) {
      case DocumentStatusEnum.enum.VERIFIED:
        return {
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 hover:bg-green-100 border-green-200',
          icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
          text: 'Verified',
          description: `Verified by ${document.verifiedByName || 'Admin'} on ${document.verifiedAt ? new Date(document.verifiedAt).toLocaleDateString() : 'unknown date'}`,
        };
      
      case DocumentStatusEnum.enum.REJECTED:
        return {
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 hover:bg-red-100 border-red-200',
          icon: <XCircle className="h-3 w-3 mr-1" />,
          text: 'Rejected',
          description: document.rejectionReason || 'Document rejected',
        };
      
      case DocumentStatusEnum.enum.PENDING_VERIFICATION:
        return {
          variant: 'secondary' as const,
          className: 'bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200',
          icon: <Clock className="h-3 w-3 mr-1" />,
          text: 'Pending Verification',
          description: 'Awaiting review by our verification team',
        };
      
      default:
        return {
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200',
          icon: <AlertCircle className="h-3 w-3 mr-1" />,
          text: 'Unknown Status',
          description: 'Status not available',
        };
    }
  };

  const config = getStatusConfig();
  const isExpired = document.expiryDate && new Date(document.expiryDate) < new Date();

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center gap-2">
        <Badge 
          variant={config.variant}
          className={cn("px-2 py-0.5 text-xs font-medium border", config.className)}
        >
          {showIcon && config.icon}
          {config.text}
          {isExpired && (
            <ShieldAlert className="h-3 w-3 ml-1" />
          )}
        </Badge>
        
        {isExpired && (
          <Badge 
            variant="destructive"
            className="px-2 py-0.5 text-xs font-medium"
          >
            Expired
          </Badge>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        {config.description}
      </p>
      
      {showRejectionReason && document.rejectionReason && (
        <div className="mt-1 rounded bg-red-50 p-2 border border-red-100">
          <p className="text-xs font-medium text-red-800">Rejection Reason:</p>
          <p className="text-xs text-red-700 mt-0.5">{document.rejectionReason}</p>
        </div>
      )}
      
      {isExpired && document.expiryDate && (
        <div className="mt-1 rounded bg-amber-50 p-2 border border-amber-100">
          <p className="text-xs font-medium text-amber-800">Document Expired</p>
          <p className="text-xs text-amber-700 mt-0.5">
            This document expired on {new Date(document.expiryDate).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
};