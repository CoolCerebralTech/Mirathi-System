// FILE: src/features/documents/components/DocumentCard.tsx

import React from 'react';
import { 
  FileText, 
  MoreVertical, 
  Download, 
  Trash2, 
  Eye, 
  History, 
  FileImage,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

import { cn } from '../../../lib/utils';
import { 
  Card, 
  Button, 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  Badge
} from '../../../components/ui';

import { useDeleteDocument } from '../document.api';
import { 
  type Document, 
  DocumentStatusEnum 
} from '../../../types/document.types';

// ============================================================================
// PROPS
// ============================================================================

interface DocumentCardProps {
  document: Document;
  onPreview?: (doc: Document) => void;
  onViewVersions?: (doc: Document) => void;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onPreview,
  onViewVersions,
  className,
}) => {
  const { mutate: deleteDocument } = useDeleteDocument();

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  const getStatusColor = (status: string) => {
    switch (status) {
      case DocumentStatusEnum.enum.VERIFIED:
        return "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200";
      case DocumentStatusEnum.enum.REJECTED:
        return "bg-red-100 text-red-700 hover:bg-red-100/80 border-red-200";
      case DocumentStatusEnum.enum.PENDING_VERIFICATION:
      default:
        return "bg-amber-100 text-amber-700 hover:bg-amber-100/80 border-amber-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case DocumentStatusEnum.enum.VERIFIED:
        return <CheckCircle2 className="h-3 w-3 mr-1" />;
      case DocumentStatusEnum.enum.REJECTED:
        return <AlertCircle className="h-3 w-3 mr-1" />;
      default:
        return <Clock className="h-3 w-3 mr-1" />;
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('image')) return <FileImage className="h-8 w-8 text-blue-500" />;
    if (mimeType.includes('pdf')) return <FileText className="h-8 w-8 text-red-500" />;
    return <FileText className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  const handleDownload = () => {
    if (document.downloadUrl) {
      window.open(document.downloadUrl, '_blank');
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to move this document to trash?')) {
      deleteDocument(document.id);
    }
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <Card className={cn("group relative flex flex-col justify-between overflow-hidden transition-all hover:shadow-md", className)}>
      
      {/* HEADER: Icon & Menu */}
      <div className="flex items-start justify-between p-4 pb-2">
        <div className="rounded-lg bg-muted/30 p-2.5 transition-colors group-hover:bg-muted/50">
          {getFileIcon(document.mimeType)}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onPreview?.(document)}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={handleDownload} disabled={!document.downloadUrl}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => onViewVersions?.(document)}>
              <History className="mr-2 h-4 w-4" />
              Version History
            </DropdownMenuItem>

            {document.permissions?.canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* BODY: Info */}
      <div className="flex flex-col gap-1 px-4 py-2">
        <div className="flex items-center justify-between">
            <Badge 
                variant="secondary" 
                className={cn("px-1.5 py-0 text-[10px] font-medium border", getStatusColor(document.status))}
            >
                {getStatusIcon(document.status)}
                {document.status.replace('_', ' ')}
            </Badge>
        </div>

        <h3 className="line-clamp-1 font-medium text-sm mt-2" title={document.fileName}>
          {document.fileName}
        </h3>
        
        <p className="text-xs text-muted-foreground capitalize">
          {document.category.replace(/_/g, ' ').toLowerCase()}
        </p>
      </div>

      {/* FOOTER: Metadata */}
      <div className="flex items-center justify-between border-t bg-muted/10 px-4 py-3 text-[10px] text-muted-foreground">
        <span>{formatFileSize(document.sizeBytes)}</span>
        {document.createdAt && (
          <span>{format(new Date(document.createdAt), 'MMM d, yyyy')}</span>
        )}
      </div>
    </Card>
  );
};