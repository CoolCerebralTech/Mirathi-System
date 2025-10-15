// FILE: src/features/documents/components/DocumentsTable.tsx

import type { ColumnDef } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { formatDistanceToNow } from 'date-fns';

import type { Document, DocumentStatus } from '../../../types';
import { Badge } from '../../../components/ui/Badge';
import { DataTableColumnHeader } from '../../../components/ui/DataTable';
import { ActionsCell } from './ActionsCell'; // 👈 we moved this to its own file

// -----------------------------------------------------------------------------
// TYPE DEFINITIONS
// -----------------------------------------------------------------------------

/**
 * Defines the callbacks that can be triggered from the documents table.
 * - onDelete: required, deletes a document by ID
 * - onEdit: optional, opens edit form for a document
 * - onViewVersions: optional, shows version history
 * - onPreview: optional, previews the document
 */
export interface DocumentsTableActions {
  onDelete: (documentId: string) => void;
  onEdit?: (document: Document) => void;
  onViewVersions?: (document: Document) => void;
  onPreview?: (document: Document) => void;
}

// -----------------------------------------------------------------------------
// HELPER FUNCTIONS
// -----------------------------------------------------------------------------

/**
 * Maps a document status to a badge variant for consistent styling.
 */
const getStatusBadgeVariant = (status: DocumentStatus) => {
  switch (status) {
    case 'VERIFIED':
      return 'success';
    case 'PENDING_VERIFICATION':
      return 'secondary';
    case 'REJECTED':
      return 'destructive';
    case 'ARCHIVED':
      return 'outline';
    default:
      return 'default';
  }
};

/**
 * Formats a file size in bytes into a human-readable string.
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Returns a simple emoji icon based on MIME type.
 */
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word')) return '📝';
  return '📎';
};

// -----------------------------------------------------------------------------
// COLUMNS FACTORY
// -----------------------------------------------------------------------------

/**
 * Factory function that returns the column definitions for the documents table.
 * It uses the i18n translation function `t` for labels and the provided
 * `actions` callbacks for row-level actions.
 */
export const getDocumentColumns = (
  t: TFunction,
  actions: DocumentsTableActions,
): ColumnDef<Document>[] => [
  {
    accessorKey: 'documentType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('documents:columns.document')} />
    ),
    cell: ({ row }) => {
      const doc = row.original;
      const latestVersion = doc.versions[0];
      if (!latestVersion) return null;

      return (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
            <span className="text-xl">{getFileIcon(latestVersion.mimeType)}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-medium line-clamp-1">{latestVersion.filename}</span>
            <span className="text-xs text-muted-foreground">
              {t(`documents:document_type_options.${doc.documentType}`)}
            </span>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('documents:columns.status')} />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as DocumentStatus;
      return (
        <Badge variant={getStatusBadgeVariant(status)}>
          {t(`documents:status_options.${status}`)}
        </Badge>
      );
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: 'versions',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('documents:columns.size')} />
    ),
    cell: ({ row }) => {
      const latestVersion = row.original.versions[0];
      return (
        <span className="text-sm text-muted-foreground">
          {latestVersion ? formatFileSize(latestVersion.sizeBytes) : 'N/A'}
        </span>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('documents:columns.last_updated')} />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('updatedAt') as string);
      return (
        <div className="flex flex-col">
          <span className="text-sm">{formatDistanceToNow(date, { addSuffix: true })}</span>
          <span className="text-xs text-muted-foreground">{date.toLocaleDateString()}</span>
        </div>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <ActionsCell doc={row.original} t={t} actions={actions} />
    ),
  },
];
