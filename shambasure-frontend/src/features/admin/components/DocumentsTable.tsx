// FILE: src/features/admin/components/DocumentsTable.tsx

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  Download,
  Eye,
  Trash2,
  FileText
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';

import { 
  useAdminDocuments,
  useVerifyDocument,
  useRejectDocument,
  useDeleteDocument,
  useDownloadDocument
} from '../admin-documents.api';
import type { Document, DocumentQuery, DocumentStatus } from '../../../types';
import { toast } from '../../../components/common/Toaster';
import { extractErrorMessage } from '../../../api/client';

import { DataTable, DataTableColumnHeader } from '../../../components/ui/DataTable';
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
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/Dialog';
import { Textarea } from '../../../components/ui/Textarea';
import { Label } from '../../../components/ui/Label';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface DocumentsTableProps {
  filters: DocumentQuery;
  onFiltersChange: (filters: DocumentQuery) => void;
  onViewDocument?: (document: Document) => void;
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
      return 'Pending';
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

// ============================================================================
// COMPONENT
// ============================================================================

export function DocumentsTable({ filters, onFiltersChange, onViewDocument }: DocumentsTableProps) {
  const { t } = useTranslation(['admin', 'common']);
  const { data, isLoading } = useAdminDocuments(filters);
  
  const verifyMutation = useVerifyDocument();
  const rejectMutation = useRejectDocument();
  const deleteMutation = useDeleteDocument();
  const downloadMutation = useDownloadDocument();

  const [selectedDocument, setSelectedDocument] = React.useState<Document | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState('');

  // ============================================================================
  // MUTATION HANDLERS
  // ============================================================================

  const handleVerify = React.useCallback((documentId: string) => {
    verifyMutation.mutate(documentId, {
      onSuccess: () => {
        toast.success(t('admin:document_verified_success'));
      },
      onError: (error) => {
        toast.error(t('common:error'), extractErrorMessage(error));
      },
    });
  }, [verifyMutation, t]);

  const handleReject = React.useCallback(() => {
    if (!selectedDocument) return;
    
    rejectMutation.mutate(
      { documentId: selectedDocument.id, reason: rejectReason },
      {
        onSuccess: () => {
          toast.success(t('admin:document_rejected_success'));
          setRejectDialogOpen(false);
          setSelectedDocument(null);
          setRejectReason('');
        },
        onError: (error) => {
          toast.error(t('common:error'), extractErrorMessage(error));
        },
      }
    );
  }, [selectedDocument, rejectReason, rejectMutation, t]);

  const handleDelete = React.useCallback(() => {
    if (!selectedDocument) return;
    
    deleteMutation.mutate(selectedDocument.id, {
      onSuccess: () => {
        toast.success(t('admin:document_deleted_success'));
        setDeleteDialogOpen(false);
        setSelectedDocument(null);
      },
      onError: (error) => {
        toast.error(t('common:error'), extractErrorMessage(error));
      },
    });
  }, [selectedDocument, deleteMutation, t]);

  const handleDownload = React.useCallback((documentId: string) => {
    downloadMutation.mutate(documentId, {
      onSuccess: () => {
        toast.success(t('admin:download_started'));
      },
      onError: (error) => {
        toast.error(t('common:error'), extractErrorMessage(error));
      },
    });
  }, [downloadMutation, t]);

  // ============================================================================
  // TABLE COLUMNS
  // ============================================================================

  const columns: ColumnDef<Document>[] = React.useMemo(() => [
    {
      accessorKey: 'filename',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:document')} />,
      cell: ({ row }) => {
        const doc = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium line-clamp-1">{doc.filename}</span>
              <span className="text-xs text-muted-foreground">
                {formatFileSize(doc.sizeBytes)} • {doc.mimeType}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:status')} />,
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
      accessorKey: 'uploaderId',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:uploader')} />,
      cell: ({ row }) => {
        const uploaderId = row.getValue('uploaderId') as string;
        return (
          <code className="rounded bg-muted px-2 py-1 text-xs">
            {uploaderId.slice(0, 8)}...
          </code>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:uploaded')} />,
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'));
        return (
          <span className="text-sm">
            {formatDistanceToNow(date, { addSuffix: true })}
          </span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const doc = row.original;
        const isPending = doc.status === 'PENDING_VERIFICATION';

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuLabel>{t('admin:actions')}</DropdownMenuLabel>
              
              <DropdownMenuItem onClick={() => onViewDocument?.(doc)}>
                <Eye className="mr-2 h-4 w-4" />
                {t('admin:view_details')}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => handleDownload(doc.id)}>
                <Download className="mr-2 h-4 w-4" />
                {t('admin:download')}
              </DropdownMenuItem>

              {isPending && (
                <>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem 
                    onClick={() => handleVerify(doc.id)}
                    className="text-green-600 focus:text-green-600"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {t('admin:verify')}
                  </DropdownMenuItem>

                  <DropdownMenuItem 
                    onClick={() => {
                      setSelectedDocument(doc);
                      setRejectDialogOpen(true);
                    }}
                    className="text-amber-600 focus:text-amber-600"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {t('admin:reject')}
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  setSelectedDocument(doc);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('admin:delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [t, onViewDocument, handleVerify, handleDownload]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        pageCount={data?.totalPages || 0}
        pagination={{
          pageIndex: filters.page - 1,
          pageSize: filters.limit,
        }}
        onPaginationChange={(updater) => {
          const newState = typeof updater === 'function'
            ? updater({ pageIndex: filters.page - 1, pageSize: filters.limit })
            : updater;
          
          onFiltersChange({
            ...filters,
            page: newState.pageIndex + 1,
            limit: newState.pageSize,
          });
        }}
      />

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin:reject_document')}</DialogTitle>
            <DialogDescription>
              {t('admin:reject_document_description')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            <Label htmlFor="reason">{t('admin:rejection_reason')}</Label>
            <Textarea
              id="reason"
              placeholder={t('admin:rejection_reason_placeholder')}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectReason('');
              }}
            >
              {t('common:cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              isLoading={rejectMutation.isPending}
            >
              {t('admin:reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('admin:confirm_delete_title')}
        description={t('admin:confirm_delete_document_message', {
          name: selectedDocument?.filename,
        })}
        onConfirm={handleDelete}
        variant="destructive"
        confirmText={t('admin:delete')}
        cancelText={t('common:cancel')}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}