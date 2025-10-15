// FILE: src/features/wills/components/WillsTable.tsx

import type { ColumnDef } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import type { Will, WillStatus } from '../../../types';
import { Button } from '../../../components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/DropdownMenu';
import { DataTableColumnHeader } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';

// TYPE DEFINITIONS
interface WillsTableActions {
  onView: (will: Will) => void;
  onEdit: (will: Will) => void;
  onDelete: (will: Will) => void;
}

// HELPER
const getStatusBadgeVariant = (status: WillStatus) => {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'REVOKED': case 'EXECUTED': return 'destructive';
    default: return 'secondary';
  }
};

// COLUMNS FACTORY
export const getWillColumns = (
  t: TFunction,
  actions: WillsTableActions,
): ColumnDef<Will>[] => {
  return [
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('wills:columns.title')} />
      ),
      cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('wills:columns.status')} />
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant={getStatusBadgeVariant(status)}>
            {t(`wills:status_options.${status}`)}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'assignments',
      header: () => <span>{t('wills:columns.assignments')}</span>,
      cell: ({ row }) => (
        <span className="text-sm">
          {t('wills:assignment_count', { count: row.original.assignments.length })}
        </span>
      ),
    },
    {
      accessorKey: 'updatedAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('wills:columns.last_updated')} />
      ),
      cell: ({ row }) => (
        <span className="text-sm">
          {formatDistanceToNow(new Date(row.original.updatedAt), { addSuffix: true })}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const will = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">{t('common:open_menu')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => actions.onView(will)}>
                  <Eye className="mr-2 h-4 w-4" />
                  <span>{t('common:view_details')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => actions.onEdit(will)}>
                  <Edit className="mr-2 h-4 w-4" />
                  <span>{t('common:edit')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => actions.onDelete(will)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>{t('common:delete')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
};
