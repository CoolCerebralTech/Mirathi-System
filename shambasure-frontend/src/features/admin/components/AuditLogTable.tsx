// FILE: src/features/admin/components/AuditLogTable.tsx

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Activity, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow, format } from 'date-fns';

import { useAuditLogs } from '../auditing.api';
import type { AuditLog, AuditLogQuery } from '../../../types';

import { DataTable, DataTableColumnHeader } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/Dialog';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface AuditLogTableProps {
  filters: AuditLogQuery;
  onFiltersChange: (filters: AuditLogQuery) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getActionBadgeVariant = (action: string) => {
  if (action.includes('DELETE') || action.includes('REVOKE')) return 'destructive';
  if (action.includes('CREATE') || action.includes('VERIFIED')) return 'default';
  if (action.includes('UPDATE')) return 'secondary';
  return 'outline';
};

const getActionLabel = (action: string): string => {
  return action
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

const formatPayload = (payload: any): string => {
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

export function AuditLogTable({ filters, onFiltersChange }: AuditLogTableProps) {
  const { t } = useTranslation(['admin', 'common']);
  const { data, isLoading } = useAuditLogs(filters);

  const [selectedLog, setSelectedLog] = React.useState<AuditLog | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = React.useState(false);

  const handleViewDetails = React.useCallback((log: AuditLog) => {
    setSelectedLog(log);
    setDetailsDialogOpen(true);
  }, []);

  // ============================================================================
  // TABLE COLUMNS
  // ============================================================================

  const columns: ColumnDef<AuditLog>[] = React.useMemo(() => [
    {
      accessorKey: 'timestamp',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:timestamp')} />,
      cell: ({ row }) => {
        const timestamp = new Date(row.getValue('timestamp'));
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {formatDistanceToNow(timestamp, { addSuffix: true })}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(timestamp, 'PPpp')}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'action',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:action')} />,
      cell: ({ row }) => {
        const action = row.getValue('action') as string;
        return (
          <Badge variant={getActionBadgeVariant(action)}>
            {getActionLabel(action)}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'actorId',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:actor')} />,
      cell: ({ row }) => {
        const actorId = row.getValue('actorId') as string | null;
        return (
          <span className="text-sm text-muted-foreground">
            {actorId ? (
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                {actorId.slice(0, 8)}...
              </code>
            ) : (
              <span className="italic">{t('admin:system')}</span>
            )}
          </span>
        );
      },
      enableSorting: false,
    },
    {
      id: 'payload',
      header: t('admin:details'),
      cell: ({ row }) => {
        const log = row.original;
        const hasPayload = log.payload && Object.keys(log.payload).length > 0;
        
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetails(log)}
            className="gap-2"
            disabled={!hasPayload}
          >
            <Eye className="h-4 w-4" />
            {hasPayload ? t('admin:view') : t('admin:no_data')}
          </Button>
        );
      },
      enableSorting: false,
    },
  ], [t, handleViewDetails]);

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

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {t('admin:audit_log_details')}
            </DialogTitle>
            <DialogDescription>
              {selectedLog && format(new Date(selectedLog.timestamp), 'PPpp')}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              {/* Action */}
              <div>
                <label className="text-sm font-medium">{t('admin:action')}</label>
                <div className="mt-1">
                  <Badge variant={getActionBadgeVariant(selectedLog.action)}>
                    {getActionLabel(selectedLog.action)}
                  </Badge>
                </div>
              </div>

              {/* Actor */}
              <div>
                <label className="text-sm font-medium">{t('admin:actor')}</label>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selectedLog.actorId || t('admin:system')}
                </p>
              </div>

              {/* Payload */}
              <div>
                <label className="text-sm font-medium">{t('admin:payload')}</label>
                <pre className="mt-1 rounded-lg bg-muted p-4 text-xs overflow-x-auto">
                  {formatPayload(selectedLog.payload)}
                </pre>
              </div>

              {/* Log ID */}
              <div>
                <label className="text-sm font-medium">{t('admin:log_id')}</label>
                <code className="mt-1 block rounded bg-muted px-2 py-1 text-xs">
                  {selectedLog.id}
                </code>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}