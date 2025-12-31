// FILE: src/features/documents/components/DocumentPreviewDialog.tsx

import React, { useState, useEffect } from 'react';
import { 
  Download, 
  ExternalLink, 
  FileText, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  Button, 
  Badge,
  Calendar
} from '@/components/ui';

import { useDocumentDownloadUrl } from '../document.api';
import { type Document } from '@/types/document.types';
import { DocumentVerificationBadge } from './DocumentVerificationBadge';
import { format } from 'date-fns';

// ============================================================================
// PROPS
// ============================================================================

interface DocumentPreviewDialogProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const DocumentPreviewDialog: React.FC<DocumentPreviewDialogProps> = ({
  document,
  isOpen,
  onClose,
}) => {
  // We use the hook to ensure we have a fresh, non-expired S3 URL
  const { 
    data: freshUrl, 
    isLoading: isUrlLoading,
    isError: isUrlError 
  } = useDocumentDownloadUrl(document?.id);

  // Fallback to the URL in the object if the hook hasn't fired yet
  const displayUrl = freshUrl || document?.previewUrl || document?.downloadUrl;
  
  // State to track content loading (iframe/image)
  const [isContentLoading, setIsContentLoading] = useState(true);

  // Reset loading state when document changes
  useEffect(() => {
    if (isOpen) {
      setIsContentLoading(true);
    }
  }, [isOpen, document]);

  // If no document is selected, don't render content
  if (!document) return null;

  const isImage = document.mimeType.startsWith('image/');
  const isPdf = document.mimeType === 'application/pdf';

  // --------------------------------------------------------------------------
  // Render Content Helper
  // --------------------------------------------------------------------------

  const renderContent = () => {
    if (isUrlLoading) {
      return (
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (isUrlError || !displayUrl) {
      return (
        <div className="flex h-[400px] flex-col items-center justify-center text-center">
          <AlertCircle className="mb-2 h-10 w-10 text-destructive" />
          <p className="text-sm font-medium">Unable to load preview.</p>
          <Button 
            variant="link" 
            onClick={() => window.open(document.downloadUrl || '', '_blank')}
            disabled={!document.downloadUrl}
          >
            Try Direct Download
          </Button>
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="relative flex h-full min-h-[400px] items-center justify-center overflow-auto bg-black/5 p-4">
          {isContentLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <img
            src={displayUrl}
            alt={document.fileName}
            className="max-h-[70vh] max-w-full rounded shadow-sm object-contain"
            onLoad={() => setIsContentLoading(false)}
            onError={() => setIsContentLoading(false)}
          />
        </div>
      );
    }

    if (isPdf) {
      return (
        <div className="relative h-[70vh] w-full bg-slate-50">
           {isContentLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <iframe
            src={`${displayUrl}#toolbar=0`}
            className="h-full w-full rounded border-0"
            title={document.fileName}
            onLoad={() => setIsContentLoading(false)}
          />
        </div>
      );
    }

    // Fallback for unsupported types
    return (
      <div className="flex h-[400px] flex-col items-center justify-center text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <FileText className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">Preview not available</h3>
        <p className="text-sm text-muted-foreground max-w-xs mt-2 mb-6">
          This file type ({document.mimeType}) cannot be previewed in the browser.
        </p>
        <Button onClick={() => window.open(displayUrl, '_blank')}>
          <Download className="mr-2 h-4 w-4" />
          Download File
        </Button>
      </div>
    );
  };

  // --------------------------------------------------------------------------
  // Main Render
  // --------------------------------------------------------------------------

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden gap-0">
        
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2 truncate pr-8">
             <span className="truncate">{document.fileName}</span>
          </DialogTitle>
          <DialogDescription>
            {isPdf ? 'PDF Document' : 'Image File'} • {(document.sizeBytes / 1024 / 1024).toFixed(2)} MB
          </DialogDescription>
          {/* Add verification status and expiry info */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <DocumentVerificationBadge document={document} showIcon={true} />
            {document.expiryDate && (
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                Expires: {format(new Date(document.expiryDate), 'MMM d, yyyy')}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Content Area */}
        <div className="min-h-[400px] w-full bg-background/50">
          {renderContent()}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t bg-muted/20">
            <div className="flex w-full justify-between sm:justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                    Close
                </Button>
                {displayUrl && (
                    <Button 
                        onClick={() => window.open(displayUrl, '_blank')}
                    >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open in New Tab
                    </Button>
                )}
            </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
};