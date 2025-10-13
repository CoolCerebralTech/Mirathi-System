// FILE: src/features/admin/components/DocumentsTable.tsx (Finalized)

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, CheckCircle, XCircle, Download, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

import { useAdminDocuments, useVerifyDocument, useRejectDocument, useAdminDownloadDocument } from '../admin-documents.api'; // UPGRADE: Correct hook name
import { Document, DocumentQuery, DocumentStatus } from '../../../types/schemas/documents.schemas'; // UPGRADE: Corrected imports
import { extractErrorMessage } from '../../../api/client';

import { DataTable, DataTableColumnHeader } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../../../components/ui/DropdownMenu';
import { Badge } from '../../../components/ui/Badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/AlertDialog';
// ... other UI imports

interface DocumentsTableProps {
  filters: Partial<DocumentQuery>;
  onPaginationChange: (updater: any) => void;
}

const useStatusInfo = () => {
    const { t } = useTranslation('admin');
    return (status: DocumentStatus) => {
        const statuses = {
            PENDING_VERIFICATION: { label: t('status_pending'), variant: 'secondary' },
            VERIFIED: { label: t('status_verified'), variant: 'default' },
            REJECTED: { label: t('status_rejected'), variant: 'destructive' },
        };
        return statuses[status] || { label: status, variant: 'outline' };
    };
};

export function DocumentsTable({ filters, onPaginationChange }: DocumentsTableProps) {
  const { t } = useTranslation(['admin', 'common']);
  const { data, isLoading } = useAdminDocuments(filters);
  
  const verifyMutation = useVerifyDocument();
  const rejectMutation = useRejectDocument();
  const downloadMutation = useAdminDownloadDocument();
  // Placeholder for delete mutation if it gets added to admin-documents.api
  // const deleteMutation = useAdminDeleteDocument(); 
  
  const [docToReject, setDocToReject] = React.useState<Document | null>(null);
  
  const handleVerify = (docId: string) => {
    verifyMutation.mutate(docId, {
      onSuccess: () => toast.success(t('admin:document_verified_success')),
      onError: (error) => toast.error(t('common:error'), { description: extractErrorMessage(error) }),
    });
  };

  const handleReject = () => {
    if (!docToReject) return;
    rejectMutation.mutate(docToReject.id, {
        onSuccess: () => {
          toast.success(t('admin:document_rejected_success'));
          setDocToReject(null);
        },
        onError: (error) => toast.error(t('common:error'), { description: extractErrorMessage(error) }),
      }
    );
  };
  
  const getStatusInfo = useStatusInfo();

  const columns: ColumnDef<Document>[] = React.useMemo(() => [
    {
      accessorKey: 'filename',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:document')} />,
      cell: ({ row }) => <span>{row.original.filename}</span>
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:status')} />,
      cell: ({ row }) => {
        const status = row.getValue('status') as DocumentStatus;
        const statusInfo = getStatusInfo(status);
        return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
      },
    },
    {
        accessorKey: 'uploaderId',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:uploader_id')} />,
        cell: ({ row }) => <code className="text-xs">{row.getValue('uploaderId') as string}</code>,
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:uploaded')} />,
      cell: ({ row }) => <span>{formatDistanceToNow(new Date(row.getValue('createdAt')), { addSuffix: true })}</span>,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const doc = row.original;
        const isPending = doc.status === 'PENDING_VERIFICATION';
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={16} /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => downloadMutation.mutate(doc.id)}><Download className="mr-2 h-4 w-4" />{t('common:download')}</DropdownMenuItem>
              {isPending && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleVerify(doc.id)}><CheckCircle className="mr-2 h-4 w-4" />{t('admin:verify')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDocToReject(doc)}><XCircle className="mr-2 h-4 w-4" />{t('admin:reject')}</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [t, getStatusInfo, handleVerify, downloadMutation]);

  const pageCount = data ? Math.ceil(data.total / (filters.limit || 10)) : 0;
  
  return (
    <>
      <DataTable
        columns={columns}
        data={data?.documents || []} // UPGRADE: Use `data.documents`
        isLoading={isLoading}
        pageCount={pageCount}
        pagination={{ pageIndex: (filters.page || 1) - 1, pageSize: filters.limit || 10 }}
        onPaginationChange={onPaginationChange}
      />

      <AlertDialog open={!!docToReject} onOpenChange={() => setDocToReject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t('admin:confirm_rejection_title')}</AlertDialogTitle><AlertDialogDescription>{t('admin:confirm_rejection_message', { name: docToReject?.filename })}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} disabled={rejectMutation.isPending}>{t('admin:reject')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}