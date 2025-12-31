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
  ShieldAlert,
  MapPin,
  User,
  Scale,
  Banknote
} from 'lucide-react';
import { format } from 'date-fns';

import { cn } from '@/lib/utils';
import { 
  Card, 
  Button, 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  Badge
} from '@/components/ui';

import { useDeleteDocument } from '../document.api';
import { 
  type Document, 
  DocumentStatusEnum,
  DocumentCategoryEnum
} from '@/types/document.types';

import { DocumentVerificationBadge } from './DocumentVerificationBadge';

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case DocumentCategoryEnum.enum.LAND_OWNERSHIP:
        return <MapPin className="h-4 w-4 text-blue-500" />;
      case DocumentCategoryEnum.enum.IDENTITY_PROOF:
        return <User className="h-4 w-4 text-green-500" />;
      case DocumentCategoryEnum.enum.SUCCESSION_DOCUMENT:
        return <Scale className="h-4 w-4 text-purple-500" />;
      case DocumentCategoryEnum.enum.FINANCIAL_PROOF:
        return <Banknote className="h-4 w-4 text-amber-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('image')) return <FileImage className="h-6 w-6 text-blue-500" />;
    if (mimeType.includes('pdf')) return <FileText className="h-6 w-6 text-red-500" />;
    return <FileText className="h-6 w-6 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isExpired = document.expiryDate && new Date(document.expiryDate) < new Date();
  const isCritical = document.metadata?.isCriticalForSuccession === true;

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
    <Card className={cn(
      "group relative flex flex-col justify-between overflow-hidden transition-all hover:shadow-md border-l-4",
      isCritical && "border-l-amber-500",
      isExpired && "border-l-red-500",
      document.status === DocumentStatusEnum.enum.VERIFIED && "border-l-green-500",
      document.status === DocumentStatusEnum.enum.REJECTED && "border-l-red-500",
      className
    )}>
      
      {/* Critical Document Indicator */}
      {isCritical && (
        <div className="absolute top-2 right-2">
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
            Critical
          </Badge>
        </div>
      )}

      {/* HEADER: Icon & Menu */}
      <div className="flex items-start justify-between p-4 pb-2">
        <div className="flex items-start gap-3">
          <div className={cn(
            "rounded-lg p-2.5 transition-colors",
            isCritical ? "bg-amber-100" : "bg-muted/30"
          )}>
            {getCategoryIcon(document.category)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <DocumentVerificationBadge 
                document={document} 
                showIcon={true}
                className="mb-0"
              />
            </div>
            <h3 className="line-clamp-1 font-medium text-sm" title={document.fileName}>
              {document.fileName}
            </h3>
            {document.documentNumber && (
              <p className="text-xs text-muted-foreground mt-0.5">
                No: {document.documentNumber}
              </p>
            )}
          </div>
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

      {/* BODY: Additional Info */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <div className="flex items-center gap-2">
            {getFileIcon(document.mimeType)}
            <span>{formatFileSize(document.sizeBytes)}</span>
            <span>•</span>
            <span className="capitalize">{document.category.replace(/_/g, ' ').toLowerCase()}</span>
          </div>
          
          {document.issueDate && (
            <span>Issued: {format(new Date(document.issueDate), 'MMM yyyy')}</span>
          )}
        </div>

        {/* Expiry Warning */}
        {isExpired && (
          <div className="flex items-center gap-1 rounded bg-red-50 p-2 mb-2">
            <ShieldAlert className="h-3 w-3 text-red-600" />
            <p className="text-xs text-red-700">
              Expired on {document.expiryDate ? format(new Date(document.expiryDate), 'MMM d, yyyy') : 'unknown date'}
            </p>
          </div>
        )}

        {/* Issuing Authority */}
        {document.issuingAuthority && (
          <p className="text-xs text-muted-foreground">
            Issued by: {document.issuingAuthority}
          </p>
        )}
      </div>

      {/* FOOTER: Metadata & Actions */}
      <div className="flex items-center justify-between border-t bg-muted/10 px-4 py-3">
        <div className="text-[10px] text-muted-foreground">
          {document.createdAt && (
            <span>Uploaded {format(new Date(document.createdAt), 'MMM d, yyyy')}</span>
          )}
          {document.verifiedAt && document.status === DocumentStatusEnum.enum.VERIFIED && (
            <span className="ml-2">• Verified {format(new Date(document.verifiedAt), 'MMM d')}</span>
          )}
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 text-xs"
          onClick={() => onPreview?.(document)}
        >
          <Eye className="h-3 w-3 mr-1" />
          View
        </Button>
      </div>
    </Card>
  );
};