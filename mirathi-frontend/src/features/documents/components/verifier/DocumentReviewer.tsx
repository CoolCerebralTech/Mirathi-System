// features/documents/components/verifier/DocumentReviewer.tsx

import React, { useState } from 'react';
import { Loader2, FileText, User, Calendar, Download, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Alert,
  AlertDescription,
  Textarea,
  Label,
} from '@/components/ui';
import { useDocumentForVerification, useVerifyDocument } from '../../../../api/documents/document.api';
import { ReferenceDisplay } from '../shared/ReferenceDisplay';
import { formatFileSize } from '@/types/document.types';
import { formatDistanceToNow } from 'date-fns';

interface DocumentReviewerProps {
  documentId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentReviewer: React.FC<DocumentReviewerProps> = ({
  documentId,
  isOpen,
  onClose,
}) => {
  const [notes, setNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const { data, isLoading, error } = useDocumentForVerification(documentId || undefined);
  const { mutate: verifyDocument, isPending } = useVerifyDocument();

  const handleApprove = () => {
    if (!documentId) return;
    
    setIsApproving(true);
    verifyDocument(
      {
        documentId,
        action: 'APPROVED',
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          onClose();
          setNotes('');
        },
        onSettled: () => {
          setIsApproving(false);
        },
      }
    );
  };

  const handleReject = () => {
    if (!documentId || !notes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setIsRejecting(true);
    verifyDocument(
      {
        documentId,
        action: 'REJECTED',
        notes: notes.trim(),
      },
      {
        onSuccess: () => {
          onClose();
          setNotes('');
        },
        onSettled: () => {
          setIsRejecting(false);
        },
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Document Verification</DialogTitle>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load document for verification.
            </AlertDescription>
          </Alert>
        )}

        {data && (
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* Document Info */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <h3 className="font-medium">{data.document.documentName}</h3>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {data.document.uploaderName || 'Unknown User'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(data.document.uploadedAt), { addSuffix: true })}
                    </span>
                    <span>{formatFileSize(data.document.fileSizeBytes)}</span>
                  </div>
                </div>
              </div>

              {/* Reference Display */}
              <ReferenceDisplay
                referenceNumber={data.document.referenceNumber}
                referenceType={data.document.referenceType}
                ocrConfidence={data.document.ocrConfidence}
              />
            </div>

            {/* Document Preview */}
            <div className="rounded-lg border overflow-hidden">
              <div className="bg-muted p-3 flex items-center justify-between">
                <span className="text-sm font-medium">Document Preview</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(data.viewUrl, '_blank')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
              <div className="aspect-[4/3] bg-gray-100">
                {data.document.mimeType?.startsWith('image/') ? (
                  <img
                    src={data.viewUrl}
                    alt={data.document.documentName}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <iframe
                    src={data.viewUrl}
                    className="w-full h-full"
                    title={data.document.documentName}
                  />
                )}
              </div>
            </div>

            {/* Verification Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Verification Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this document (required for rejection)"
                rows={4}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                {isRejecting ? 'Rejection reason is required' : 'Optional for approval'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isPending || !notes.trim()}
                className="flex-1"
              >
                {isRejecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  'Reject Document'
                )}
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isPending}
                className="flex-1"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  'Approve Document'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};