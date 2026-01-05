// features/documents/components/user/DocumentCard.tsx

import React from 'react';
import { Card, CardContent, Button } from '@/components/ui';
import { FileText, Eye, Trash2, Calendar } from 'lucide-react';
import { DocumentStatusBadge } from '../shared/DocumentStatusBadge';
import { ReferenceDisplay } from '../shared/ReferenceDisplay';
import { formatFileSize } from '@/types/document.types';
import type { Document } from '@/types/document.types';
import { formatDistanceToNow } from 'date-fns';

interface DocumentCardProps {
  document: Document;
  onView?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  className?: string;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onView,
  onDelete,
  className,
}) => {
  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="rounded-lg bg-primary/10 p-2">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{document.documentName}</h3>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(document.fileSizeBytes)} • {document.mimeType}
                </p>
              </div>
            </div>
            <DocumentStatusBadge status={document.status} />
          </div>

          {/* Reference Number */}
          {document.referenceNumber && (
            <ReferenceDisplay
              referenceNumber={document.referenceNumber}
              referenceType={document.referenceType}
              ocrConfidence={document.ocrConfidence}
            />
          )}

          {/* Rejection Reason */}
          {document.status === 'REJECTED' && document.rejectionReason && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-xs font-medium text-red-800 mb-1">Rejection Reason:</p>
              <p className="text-sm text-red-700">{document.rejectionReason}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {formatDistanceToNow(new Date(document.uploadedAt), { addSuffix: true })}
              </span>
            </div>
            {document.verifiedAt && (
              <span className="text-green-600">
                ✓ Verified
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView?.(document)}
              className="flex-1"
            >
              <Eye className="mr-2 h-3 w-3" />
              View
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete?.(document)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};