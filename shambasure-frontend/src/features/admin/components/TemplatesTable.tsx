// FILE: src/features/admin/components/TemplatesTable.tsx

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '../../../components/ui/DataTable';
import { type NotificationTemplate } from '../../../types';
import { Badge } from '../../../components/ui/Badge';
import { Checkbox } from '../../../components/ui/Checkbox';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '../../../components/common/UserMenu';

// 1. Define the columns for the NotificationTemplate table.
export const templateColumns: ColumnDef<NotificationTemplate>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Template Name" />,
    cell: ({ row }) => <span className="font-medium">{row.getValue('name')}</span>,
  },
  {
    accessorKey: 'channel',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Channel" />,
    cell: ({ row }) => <Badge variant="secondary">{row.getValue('channel')}</Badge>,
  },
  {
    accessorKey: 'subject',
    header: 'Subject',
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) => {
        const isActive = row.getValue('isActive');
        return isActive ? (
            <span className="text-green-600 font-semibold">Active</span>
        ) : (
            <span className="text-muted-foreground">Inactive</span>
        );
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      // This is where "Edit" and "Delete" modals would be triggered
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>Edit Template</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:bg-destructive/80 focus:text-white">
                Delete Template
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];