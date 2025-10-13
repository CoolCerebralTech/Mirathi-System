// FILE: src/features/admin/components/AuditLogTable.tsx (Finalized)

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow, format } from 'date-fns';

import { useAuditLogs } from '../auditing.api';
import { AuditLog, AuditQuery } from '../../../types/schemas/auditing.schemas'; // UPGRADE: Corrected imports

import { DataTable, DataTableColumnHeader } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/Dialog';

interface AuditLogTableProps {
  filters: Partial<AuditQuery>;
  onPaginationChange: (updater: any) => void;
}

// ... (Your helper functions getActionBadgeVariant, getActionLabel, formatPayload are excellent)

export function AuditLogTable({ filters, onPaginationChange }: AuditLogTableProps) {
  const { t } = useTranslation(['admin', 'common']);
  // UPGRADE: Pass filters directly to the hook
  const { data, isLoading } = useAuditLogs(filters);

  const [selectedLog, setSelectedLog] = React.useState<AuditLog | null>(null);

  const columns: ColumnDef<AuditLog>[] = React.useMemo(() => [
    {
      accessorKey: 'timestamp',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:timestamp')} />,
      cell: ({ row }) => {
        const timestamp = new Date(row.getValue('timestamp'));
        return (
          <div>
            <span className="text-sm font-medium">{formatDistanceToNow(timestamp, { addSuffix: true })}</span>
            <span className="text-xs text-muted-foreground">{format(timestamp, 'PPpp')}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'action',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:action')} />,
      cell: ({ row }) => <Badge variant="outline">{row.getValue('action') as string}</Badge>,
    },
    {
      accessorKey: 'actor.email', // Access nested data directly
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:actor')} />,
      cell: ({ row }) => {
        const log = row.original;
        return <span className="text-sm">{log.actor?.email || t('admin:system')}</span>;
      },
    },
    {
      id: 'details',
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => setSelectedLog(row.original)}>
          <Eye className="mr-2 h-4 w-4" />
          {t('common:view')}
        </Button>
      ),
    },
  ], [t]);

  // UPGRADE: Correctly access paginated data
  const pageCount = data ? Math.ceil(data.total / data.limit) : 0;
  
  return (
    <>
      <DataTable
        columns={columns}
        data={data?.logs || []}
        isLoading={isLoading}
        pageCount={pageCount}
        pagination={{
          pageIndex: (filters.page || 1) - 1,
          pageSize: filters.limit || 10,
        }}
        onPaginationChange={onPaginationChange}
      />

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('admin:audit_log_details')}</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 py-4 text-sm">
              {/* ... (Your details dialog implementation is great) ... */}
              <div>
                <Label>{t('admin:payload')}</Label>
                <pre className="mt-1 rounded-lg bg-muted p-4 text-xs overflow-x-auto">
                  {JSON.stringify(selectedLog.payload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}