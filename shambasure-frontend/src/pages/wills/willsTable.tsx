// FILE: src/features/wills/components/WillsTable.tsx

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Edit, Trash2, Eye, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';

import type { Will, WillStatus } from '../../../types';
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

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface WillsTableProps {
  onEdit: (will: Will) => void;
  onDelete: (willId: string) => void;
  onViewDetails: (will: Will) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getStatusBadgeVariant = (status: WillStatus) => {
  switch (status) {
    case 'ACTIVE':
      return 'default';
    case 'DRAFT':
      return 'secondary';
    case 'REVOKED':
      return 'destructive';
    case 'EXECUTED':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getStatusInfo = (status: WillStatus) => {
  const statuses = {
    DRAFT: { label: 'Draft', color: 'bg-slate-100 text-slate-700' },
    ACTIVE: { label: 'Active', color: 'bg-emerald-100 text-emerald-700' },
    REVOKED: { label: 'Revoked', color: 'bg-red-100 text-red-700' },
    EXECUTED: { label: 'Executed', color: 'bg-blue-100 text-blue-700' },
  };
  return statuses[status] || statuses.DRAFT;
};

// ============================================================================
// COLUMNS FACTORY
// ============================================================================

export const getWillColumns = (handlers: WillsTableProps): ColumnDef<Will>[] => {
  return [
    {
      accessorKey: 'title',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Will Title" />,
      cell: ({ row }) => {
        const will = row.original;
        const assignmentsCount = will.beneficiaryAssignments?.length || 0;
        
        return (
          <div className="flex flex-col">
            <span className="font-medium">{will.title}</span>
            <span className="text-sm text-muted-foreground">
              {assignmentsCount} {assignmentsCount === 1 ? 'assignment' : 'assignments'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue('status') as WillStatus;
        const statusInfo = getStatusInfo(status);
        
        return (
          <Badge variant={getStatusBadgeVariant(status)} className={statusInfo.color}>
            {statusInfo.label}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
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
      accessorKey: 'updatedAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Last Updated" />,
      cell: ({ row }) => {
        const date = new Date(row.getValue('updatedAt'));
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
        const will = row.original;

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
              
              <DropdownMenuItem onClick={() => handlers.onViewDetails(will)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => handlers.onEdit(will)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Will
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => handlers.onDelete(will.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Will
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
};