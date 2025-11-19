import type { ColumnDef } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { formatDistanceToNow } from 'date-fns';

import type { Document, DocumentStatus } from '../../../types/document.types';
import { Badge } from '../../../components/ui/Badge';
import { DataTableColumnHeader } from '../../../components/ui/DataTable';
import { ActionsCell } from './ActionsCell';

// ============================================================================
// TYPES
// ============================================================================

export interface DocumentsTableActions {
  onDelete: (documentId: string) => void;
  onEdit?: (document: Document) => void;
  onViewVersions?: (document: Document) => void;
  onPreview?: (document: Document) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const getStatusBadgeVariant = (status: DocumentStatus) => {
  switch (status) {
    case 'VERIFIED':
      return 'success';
    case 'PENDING_VERIFICATION':
      return 'secondary';
    case 'REJECTED':
      return 'destructive';
    default:
      return 'default';
  }
};

const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
};

const getFileIcon = (mimeType: string) => {
  if (!mimeType) return '📎';
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
  return '📎';
};

const getCategoryLabel = (category: string, t: TFunction): string => {
  const labels: Record<string, string> = {
    LAND_OWNERSHIP: t('documents:categories.land_ownership'),
    IDENTITY_PROOF: t('documents:categories.identity_proof'),
    SUCCESSION_DOCUMENT: t('documents:categories.succession_document'),
    FINANCIAL_PROOF: t('documents:categories.financial_proof'),
    OTHER: t('documents:categories.other'),
  };
  return labels[category] || category;
};

// ============================================================================
// COLUMNS FACTORY
// ============================================================================

export const getDocumentColumns = (
  t: TFunction,
  actions: DocumentsTableActions,
): ColumnDef<Document>[] => [
  {
    accessorKey: 'fileName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('documents:columns.document')} />
    ),
    cell: ({ row }) => {
      const doc = row.original;
      return (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
            <span className="text-xl">{getFileIcon(doc.mimeType)}</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-medium truncate" title={doc.fileName}>
              {doc.fileName}
            </span>
            <span className="text-xs text-muted-foreground">
              {getCategoryLabel(doc.category, t)}
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
          {t(`documents:status.${status.toLowerCase()}`)}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return Array.isArray(value) ? value.includes(row.getValue(id)) : true;
    },
  },
  {
    accessorKey: 'sizeBytes',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('documents:columns.size')} />
    ),
    cell: ({ row }) => {
      const size = row.getValue('sizeBytes') as number;
      return (
        <span className="text-sm text-muted-foreground">
          {formatFileSize(size)}
        </span>
      );
    },
  },
  {
    accessorKey: 'uploaderName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('documents:columns.uploaded_by')} />
    ),
    cell: ({ row }) => {
      const uploaderName = row.getValue('uploaderName') as string | undefined;
      return (
        <span className="text-sm">
          {uploaderName || t('common:unknown')}
        </span>
      );
    },
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('documents:columns.last_updated')} />
    ),
    cell: ({ row }) => {
      const dateValue = row.getValue('updatedAt');
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue as string);
      
      return (
        <div className="flex flex-col">
          <span className="text-sm">
            {formatDistanceToNow(date, { addSuffix: true })}
          </span>
          <span className="text-xs text-muted-foreground">
            {date.toLocaleDateString()}
          </span>
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      const dateA = new Date(rowA.getValue('updatedAt') as string).getTime();
      const dateB = new Date(rowB.getValue('updatedAt') as string).getTime();
      return dateA - dateB;
    },
  },
  {
    accessorKey: 'version',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('documents:columns.version')} />
    ),
    cell: ({ row }) => {
      const version = row.getValue('version') as number;
      const totalVersions = row.original.totalVersions;
      return (
        <div className="flex items-center gap-1">
          <span className="text-sm font-mono">v{version}</span>
          {totalVersions && totalVersions > 1 && (
            <span className="text-xs text-muted-foreground">
              ({totalVersions})
            </span>
          )}
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