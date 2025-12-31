// FILE: src/features/documents/components/DocumentVaultGrid.tsx

import React from 'react';
import { FileQuestion, AlertCircle } from 'lucide-react';

import { DocumentCard } from './DocumentCard';
import { useDocuments } from '../document.api';
import { 
  type Document, 
  type DocumentCategory 
} from '../../../types/document.types';

import { LoadingSpinner, EmptyState } from '../../../components/common';
import { Button } from '../../../components/ui';

// ============================================================================
// PROPS
// ============================================================================

interface DocumentVaultGridProps {
  /**
   * Filter by category (optional)
   */
  category?: DocumentCategory;

  /**
   * Search query string (optional)
   */
  searchQuery?: string;

  /**
   * Current page number (default: 1)
   */
  page?: number;

  /**
   * Callback when a user clicks "Preview" on a card
   */
  onPreview?: (document: Document) => void;

  /**
   * Callback when a user clicks "Version History" on a card
   */
  onViewVersions?: (document: Document) => void;

  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const DocumentVaultGrid: React.FC<DocumentVaultGridProps> = ({
  category,
  searchQuery,
  page = 1,
  onPreview,
  onViewVersions,
  className,
}) => {
  // 1. Fetch Data
  const { 
    data, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useDocuments({
    // FIX: The API expects 'categories' (plural array), not 'category'
    categories: category ? [category] : undefined, 
    query: searchQuery,
    page,
    limit: 12, // Grid size
  });

  // 2. Loading State
  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your documents..." />
      </div>
    );
  }

  // 3. Error State
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
        <div className="mb-4 rounded-full bg-destructive/10 p-3">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-destructive">Unable to load documents</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "A connection error occurred."}
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  // 4. Empty State
  if (!data || data.data.length === 0) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="No documents found"
        description={
            searchQuery 
            ? `We couldn't find anything matching "${searchQuery}".` 
            : category 
            ? "You haven't uploaded any documents in this category yet."
            : "Your document vault is empty. Upload your first document to get started."
        }
        className="min-h-[300px]"
      />
    );
  }

  // 5. Success State - The Grid
  return (
    <div className={className}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.data.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onPreview={onPreview}
            onViewVersions={onViewVersions}
          />
        ))}
      </div>

      {/* Optional: Simple Pagination Summary */}
      <div className="mt-6 flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
        <span>
          Showing <strong>{data.data.length}</strong> of <strong>{data.total}</strong> documents
        </span>
        {data.totalPages > 1 && (
            <span>Page {data.page} of {data.totalPages}</span>
        )}
      </div>
    </div>
  );
};