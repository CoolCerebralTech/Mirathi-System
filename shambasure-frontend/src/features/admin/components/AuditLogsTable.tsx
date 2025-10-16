// FILE: src/features/admin/components/AuditLogsTable.tsx

import type { ColumnDef } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, User, File, Server } from 'lucide-react';

import type { AuditLog } from '../../../types';
import { DataTableColumnHeader } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/common/Avatar';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../../../components/ui/HoverCard';
import { Button } from '../../../components/ui/Button';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COLUMNS FACTORY
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export const getAuditLogsTableColumns = (t: TFunction): ColumnDef<AuditLog>[] => {
  return [
    {
      accessorKey: 'actor',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:auditing.columns.actor')} />,
      cell: ({ row }) => {
        const actor = row.original.actor;
        if (!actor) return <div className="flex items-center gap-2"><Server className="h-4 w-4" /> System</div>;
        const initials = `${actor.firstName[0] ?? ''}${actor.lastName[0] ?? ''}`;
        return (
          <div className="flex items-center gap-2">
            <Avatar fallback={initials} className="h-8 w-8" />
            <div>
              <p className="font-medium">{`${actor.firstName} ${actor.lastName}`}</p>
              <p className="text-xs text-muted-foreground">{actor.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'action',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:auditing.columns.action')} />,
      cell: ({ row }) => {
        const action = row.original.action;
        return <Badge variant="secondary" className="font-mono">{action}</Badge>;
      },
    },
    {
      id: 'target',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:auditing.columns.target')} />,
      cell: ({ row }) => {
        const { targetType, targetId } = row.original;
        const Icon = targetType === 'USER' ? User : File;
        return (
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="ghost" size="sm" className="h-auto p-1">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="font-mono text-xs">{targetId.substring(0, 8)}...</span>
                </div>
              </Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <p className="text-sm"><strong className="text-muted-foreground">Type:</strong> {targetType}</p>
              <p className="text-sm"><strong className="text-muted-foreground">ID:</strong> {targetId}</p>
            </HoverCardContent>
          </HoverCard>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:auditing.columns.status')} />,
      cell: ({ row }) => {
        const status = row.original.status;
        const isSuccess = status === 'SUCCESS';
        return (
          <div className="flex items-center gap-2">
            {isSuccess ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-destructive" />}
            <span>{status}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'timestamp',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:auditing.columns.timestamp')} />,
      cell: ({ row }) => {
        const date = new Date(row.original.timestamp);
        return (
            <div>
                <p className="text-sm">{format(date, 'PPpp')}</p>
            </div>
        );
      },
    },
  ];
};
