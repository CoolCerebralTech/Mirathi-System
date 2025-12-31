// FILE: src/features/documents/components/DocumentVersionSheet.tsx

import React from 'react';
import { format } from 'date-fns';
import { 
  History, 
  Download, 
  Clock, 
  User, 
  FileText,
  AlertCircle
} from 'lucide-react';

import { cn } from '../../../lib/utils';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  Button,
  Badge,
  ScrollArea
} from '../../../components/ui';

import { LoadingSpinner } from '../../../components/common';
import { useDocumentVersions } from '../document.api';
import { type Document } from '../../../types/document.types';

// ============================================================================
// PROPS
// ============================================================================

interface DocumentVersionSheetProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const DocumentVersionSheet: React.FC<DocumentVersionSheetProps> = ({
  document,
  isOpen,
  onClose,
  className,
}) => {
  // 1. Fetch Versions (Only if document exists)
  const { 
    data, 
    isLoading, 
    isError 
  } = useDocumentVersions(document?.id || '', { 
    page: 1, 
    limit: 20 // Fetch last 20 versions
  });

  if (!document) return null;

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  const handleDownload = (url?: string | null) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const formatSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className={cn("w-full sm:max-w-md flex flex-col h-full", className)}>
        
        {/* Header */}
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Version History
          </SheetTitle>
          <SheetDescription className="truncate">
            {document.fileName}
          </SheetDescription>
        </SheetHeader>

        {/* Content - Scrollable List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="flex flex-col gap-6 py-6">
            
            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="flex flex-col items-center justify-center text-center text-destructive py-4">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p className="text-sm">Failed to load history.</p>
              </div>
            )}

            {/* List */}
            {data?.data.map((version, index) => {
              const isLatest = index === 0; // Assuming sortOrder desc

              return (
                <div key={version.id} className="relative pl-4">
                  {/* Timeline Line */}
                  {index !== data.data.length - 1 && (
                    <div className="absolute left-[5px] top-2 h-full w-[2px] bg-muted" />
                  )}

                  <div className="flex flex-col gap-3">
                    {/* Header Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "h-2.5 w-2.5 rounded-full ring-4 ring-background",
                          isLatest ? "bg-green-500" : "bg-muted-foreground"
                        )} />
                        <Badge variant={isLatest ? "default" : "secondary"} className="text-[10px] h-5">
                          v{version.versionNumber}
                        </Badge>
                        {isLatest && <span className="text-xs text-muted-foreground font-medium">(Current)</span>}
                      </div>
                      
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {version.createdAt ? format(new Date(version.createdAt), 'MMM d, p') : 'Unknown'}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className={cn(
                      "ml-4 rounded-lg border p-3 text-sm transition-colors",
                      isLatest ? "bg-muted/30 border-muted" : "bg-transparent border-transparent hover:bg-muted/10"
                    )}>
                      {/* Meta Info */}
                      <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-3 w-3" />
                            <span className="text-xs">
                              {version.uploadedByName || 'System Upload'}
                            </span>
                         </div>
                         <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {formatSize(version.sizeBytes)}
                         </span>
                      </div>

                      {/* Change Note */}
                      {version.changeNote && (
                        <div className="mb-3 rounded bg-amber-50 p-2 text-xs text-amber-900 border border-amber-100">
                          <span className="font-semibold">Note:</span> {version.changeNote}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-7 text-xs w-full"
                          onClick={() => handleDownload(version.downloadUrl)}
                          disabled={!version.downloadUrl}
                        >
                          <Download className="h-3 w-3 mr-2" />
                          Download File
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        
        {/* Footer info */}
        <div className="border-t pt-4 mt-auto">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center">
                    <FileText className="h-3 w-3 mr-1" />
                    Total Versions: {data?.total || 0}
                </div>
                <div>
                    Storage: {document ? formatSize(document.sizeBytes) : '0'}
                </div>
            </div>
        </div>

      </SheetContent>
    </Sheet>
  );
};