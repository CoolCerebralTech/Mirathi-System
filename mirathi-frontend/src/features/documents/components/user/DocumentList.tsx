// features/documents/components/user/DocumentList.tsx

import React from 'react';
import { Loader2, FileX } from 'lucide-react';
import { DocumentCard } from './DocumentCard';
import { Alert, AlertDescription } from '@/components/ui';
import { useUserDocuments, useDeleteDocument } from '../../document.api';
import type { Document, DocumentStatus } from '@/types/document.types';

interface DocumentListProps {
  status?: DocumentStatus;
  onView?: (document: Document) => void;
  className?: string;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  status,
  onView,
  className,
}) => {
  const { data: documents, isLoading, error } = useUserDocuments(status);
  const { mutate: deleteDocument } = useDeleteDocument();

  const handleDelete = (document: Document) => {
    if (confirm(`Delete "${document.documentName}"? This cannot be undone.`)) {
      deleteDocument(document.id);
    }
  };

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
          Failed to load documents. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileX className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No documents found</h3>
        <p className="text-sm text-muted-foreground">
          {status 
            ? `No documents with status "${status}"`
            : 'Upload your first document to get started'}
        </p>
      </div>
    );
  }

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {documents.map((document) => (
        <DocumentCard
          key={document.id}
          document={document}
          onView={onView}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};