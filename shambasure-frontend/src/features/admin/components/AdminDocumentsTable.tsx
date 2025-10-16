// FILE: src/features/admin/components/AdminDocumentsTable.tsx

import type { ColumnDef } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { formatDistanceToNow } from 'date-fns';

import type { Document, DocumentStatus } from '../../../types';
import { DataTableColumnHeader } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/common/Avatar';
import { AdminActionsCell } from './AdminActionsCell';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// TYPE DEFINITIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

interface AdminDocumentsTableActions {
  onVerify: (document: Document) => void;
  onReject: (document: Document) => void;
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// HELPER
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const getStatusBadgeVariant = (status: DocumentStatus) => {
  switch (status) {
    case 'VERIFIED': return 'success';
    case 'PENDING_VERIFICATION': return 'secondary';
    case 'REJECTED': return 'destructive';
    default: return 'outline';
  }
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COLUMNS FACTORY
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export const getAdminDocumentsTableColumns = (t: TFunction, actions: AdminDocumentsTableActions): ColumnDef<Document>[] => {
  return [
    {
      accessorKey: 'documentType',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:documents.columns.document')} />,
      cell: ({ row }) => {
        const doc = row.original;
        const latestVersion = doc.versions[0];
        return (
          <div>
            <p className="font-medium">{latestVersion?.filename ?? 'N/A'}</p>
            <p className="text-sm text-muted-foreground">{t(`documents:document_type_options.${doc.documentType}`)}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'uploader',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:documents.columns.uploader')} />,
      cell: ({ row }) => {
        const uploader = row.original.uploader;
        if (!uploader) return 'System';
        const initials = `${uploader.firstName[0] ?? ''}${uploader.lastName[0] ?? ''}`;
        return (
          <div className="flex items-center gap-2">
            <Avatar fallback={initials} className="h-8 w-8" />
            <span className="text-sm">{`${uploader.firstName} ${uploader.lastName}`}</span>
          </div>
        );
      },
    },
    
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:documents.columns.status')} />,
      cell: ({ row }) => {
        const status = row.original.status;
        return <Badge variant={getStatusBadgeVariant(status)}>{t(`documents:status_options.${status}`)}</Badge>;
      },
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:documents.columns.submitted')} />,
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return <span className="text-sm">{formatDistanceToNow(date, { addSuffix: true })}</span>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => <AdminActionsCell doc={row.original} actions={actions} t={t} />,
    },
  ];
};