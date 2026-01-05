// features/documents/components/verifier/VerificationQueue.tsx

import React from 'react';
import { Loader2, FileCheck, Calendar, User } from 'lucide-react';
import { Card, CardContent, Button, Badge, Alert, AlertDescription } from '@/components/ui';
import { usePendingDocuments } from '../../document.api';
import { ReferenceDisplay } from '../shared/ReferenceDisplay';
import { formatFileSize } from '@/types/document.types';
import type { Document } from '@/types/document.types';
import { formatDistanceToNow } from 'date-fns';

interface VerificationQueueProps {
  onReview?: (document: Document) => void;
  className?: string;
}

export const VerificationQueue: React.FC<VerificationQueueProps> = ({
  onReview,
  className,
}) => {
  const { data: pendingDocs, isLoading, error } = usePendingDocuments();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load pending documents. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (!pendingDocs || pendingDocs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileCheck className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No pending documents</h3>
        <p className="text-sm text-muted-foreground">
          All documents have been reviewed. Great job!
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Queue Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Pending Verification</h3>
          <p className="text-sm text-muted-foreground">
            {pendingDocs.length} document{pendingDocs.length !== 1 ? 's' : ''} awaiting review
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {pendingDocs.length}
        </Badge>
      </div>

      {/* Document Queue */}
      <div className="space-y-3">
        {pendingDocs.map((document) => (
          <Card key={document.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Document Info */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium">{document.documentName}</h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {document.uploaderName || 'Unknown User'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(document.uploadedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {formatFileSize(document.fileSizeBytes)}
                  </Badge>
                </div>

                {/* OCR Results */}
                {document.referenceNumber ? (
                  <ReferenceDisplay
                    referenceNumber={document.referenceNumber}
                    referenceType={document.referenceType}
                    ocrConfidence={document.ocrConfidence}
                  />
                ) : (
                  <div className="rounded-lg border border-dashed p-3">
                    <p className="text-sm text-muted-foreground">
                      No reference number detected by OCR
                    </p>
                  </div>
                )}

                {/* Action Button */}
                <Button
                  onClick={() => onReview?.(document)}
                  className="w-full"
                >
                  <FileCheck className="mr-2 h-4 w-4" />
                  Review Document
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};