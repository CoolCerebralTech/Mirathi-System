// FILE: src/features/documents/components/DocumentsTable.tsx

import type { ColumnDef } from '@tanstack/react-table';
import { 
  MoreHorizontal, 
  Download, 
  Edit, 
  Trash2, 
  Eye,
  Copy,
  History,
  Share2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import type { Document, DocumentStatus } from '../../../types';
import { Button } from '../../../components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/DropdownMenu';
import { Badge } from '../../../components/ui/Badge';
import { DataTableColumnHeader } from '../../../components/ui/DataTable';
import { useDownloadDocument } from '../documents.api';
import { toast } from 'sonner';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface DocumentsTableColumn {
  onDownload: (documentId: string, filename: string) => void;
  onDelete: (documentId: string) => void;
  onEdit?: (document: Document) => void;
  onViewVersions?: (document: Document) => void;
  onPreview?: (document: Document) => void;
  onShare?: (document: Document) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getStatusBadgeVariant = (status: DocumentStatus) => {
  switch (status) {
    case 'VERIFIED':
      return 'default';
    case 'PENDING_VERIFICATION':
      return 'secondary';
    case 'REJECTED':
      return 'destructive';
    default:
      return 'outline';
  }
};

const getStatusLabel = (status: DocumentStatus) => {
  switch (status) {
    case 'VERIFIED':
      return 'Verified';
    case 'PENDING_VERIFICATION':
      return 'Pending Review';
    case 'REJECTED':
      return 'Rejected';
    default:
      return status;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word')) return '📝';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
  return '📎';
};

// ============================================================================
// COLUMNS FACTORY
// ============================================================================

export const getDocumentColumns = (handlers: DocumentsTableColumn): ColumnDef<Document>[] => {
  return [
    {
      accessorKey: 'filename',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Document" />,
      cell: ({ row }) => {
        const doc = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-xl">{getFileIcon(doc.mimeType)}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium line-clamp-1">{doc.filename}</span>
              <span className="text-xs text-muted-foreground">
                {formatFileSize(doc.sizeBytes)}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue('status') as DocumentStatus;
        return (
          <Badge variant={getStatusBadgeVariant(status)}>
            {getStatusLabel(status)}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'mimeType',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => {
        const mimeType = row.getValue('mimeType') as string;
        const displayType = mimeType.split('/')[1]?.toUpperCase() || 'FILE';
        return (
          <span className="text-sm text-muted-foreground">
            {displayType}
          </span>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Uploaded" />,
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'));
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
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const doc = row.original;
        const downloadMutation = useDownloadDocument();

        const handleDownload = () => {
          toast.info('Your download is starting...');
          downloadMutation.mutate(doc.id, {
            onError: (error) => toast.error('Download failed', { description: error.message }),
          });
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              
              {handlers.onPreview && (
                <DropdownMenuItem onClick={() => handlers.onPreview!(doc)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </DropdownMenuItem>
              )}

              <DropdownMenuItem 
                onClick={() => handlers.onDownload(doc.id, doc.filename)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>

              {handlers.onEdit && (
                <DropdownMenuItem onClick={() => handlers.onEdit!(doc)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
              )}

              {handlers.onViewVersions && doc.versions && doc.versions.length > 0 && (
                <DropdownMenuItem onClick={() => handlers.onViewVersions!(doc)}>
                  <History className="mr-2 h-4 w-4" />
                  Version History ({doc.versions.length})
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(doc.id);
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Document ID
              </DropdownMenuItem>

              {handlers.onShare && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handlers.onShare!(doc)}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => handlers.onDelete(doc.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
};