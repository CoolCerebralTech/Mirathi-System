// FILE: src/features/admin/components/UserTable.tsx

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';

import { useAdminUsers } from '../admin.api'; // We will create this hook next
import { type User } from '../../../types';

import { DataTable, DataTableColumnHeader } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/common/UserMenu'; // Re-using the styled dropdown from UserMenu
import { Badge } from '../../../components/ui/Badge'; // A new UI component we'll create
import { Checkbox } from '../../../components/ui/Checkbox';

// 1. Define the columns for the User table.
export const userColumns: ColumnDef<User>[] = [
  // A column for row selection
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
  // Column for User's name and email
  {
    accessorKey: 'email',
    header: ({ column }) => <DataTableColumnHeader column={column} title="User" />,
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="font-medium">
          {user.firstName} {user.lastName}
          <div className="text-xs text-muted-foreground">{user.email}</div>
        </div>
      );
    },
  },
  // Column for User's role, displayed as a styled badge
  {
    accessorKey: 'role',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
    cell: ({ row }) => {
      const role = row.getValue('role') as string;
      const variant = role === 'ADMIN' ? 'destructive' : 'default';
      return <Badge variant={variant}>{role}</Badge>;
    },
  },
  // Column for the date the user joined
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Joined At" />,
    cell: ({ row }) => {
      return new Date(row.getValue('createdAt')).toLocaleDateString();
    },
  },
  // Column for actions (Edit Role, Delete User)
  {
    id: 'actions',
    cell: ({ row }) => {
      const user = row.original;
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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
              Copy user ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Edit Role</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:bg-destructive/80 focus:text-white">
                Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// 2. The main UserTable component that fetches data and renders the DataTable.
export function UserTable() {
  // We'll create the `useAdminUsers` hook in the next step.
  // This is a placeholder for now.
  // const { data, isLoading } = useAdminUsers({ page: 1, limit: 10 });
  const isLoading = true;
  const users: User[] = []; // Placeholder

  if (isLoading) {
    // We can show a skeleton loader here for better UX
    return <div>Loading users...</div>;
  }

  // const pageCount = data ? Math.ceil(data.total / data.limit) : 0;

  return (
    <DataTable columns={userColumns} data={users} />
  );
}