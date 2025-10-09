// FILE: src/features/admin/components/AuditLogTable.tsx

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAuditLogs, useExportAuditLogs } from '../auditing.api';
import type { AuditLog } from '../../../types';
import { toast } from '../../../components/common/Toaster';
import { extractErrorMessage } from '../../../api/client';

import { DataTable, DataTableColumnHeader } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { formatDate, formatRelativeTime } from '../../../lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/Dialog';

interface AuditLogTableProps {
  filters: {
    page: number;
    limit: number;
    action?: string;
    actorId?: string;
    startDate?: string;
    endDate?: string;
  };
  onFiltersChange: (filters: any) => void;
}

export function AuditLogTable({ filters, onFiltersChange }: AuditLogTableProps) {
  const { t } = useTranslation(['common']);
  const { data, isLoading } = useAuditLogs(filters);
  const exportMutation = useExportAuditLogs();

  const [selectedLog, setSelectedLog] = React.useState<AuditLog | null>(null);
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  const handleExport = () => {
    exportMutation.mutate(
      {
        startDate: filters.startDate,
        endDate: filters.endDate,
        action: filters.action,
        actorId: filters.actorId,
      },
      {
        onSuccess: () => {
          toast.success('Audit logs exported successfully');
        },
        onError: (error) => {
          toast.error('Export failed', extractErrorMessage(error));
        },
      }
    );
  };

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: 'timestamp',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Timestamp" />,
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{formatDate(row.getValue('timestamp'))}</div>
          <div className="text-xs text-muted-foreground">
            {formatRelativeTime(row.getValue('timestamp'))}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'action',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Action" />,
      cell: ({ row }) => {
        const action = row.getValue('action') as string;
        return (
          <Badge variant="outline">
            {action.replace(/_/g, ' ')}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'actorId',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Actor" />,
      cell: ({ row }) => {
        const actorId = row.getValue('actorId') as string | null;
        return actorId ? (
          <span className="font-mono text-xs">{actorId.slice(0, 8)}...</span>
        ) : (
          <span className="text-muted-foreground">System</span>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const log = row.original;
        return (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedLog(log);
              setDetailsOpen(true);
            }}
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">View details</span>
          </Button>
        );
      },
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          {data?.total || 0} audit logs found
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          isLoading={exportMutation.isPending}
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        pageCount={data?.totalPages}
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

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              {selectedLog && formatDate(selectedLog.timestamp)}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Action</h4>
                <Badge>{selectedLog.action.replace(/_/g, ' ')}</Badge>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Actor ID</h4>
                <code className="text-sm">{selectedLog.actorId || 'System'}</code>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Payload</h4>
                <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs">
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