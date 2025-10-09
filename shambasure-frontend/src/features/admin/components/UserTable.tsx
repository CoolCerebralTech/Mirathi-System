// FILE: src/features/admin/components/UserTable.tsx

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Trash2, Shield, Ban, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useAdminUsers, useUpdateUserRole, useSuspendUser, useActivateUser, useDeleteUser } from '../admin.api';
import type { User } from '../../../types';
import { toast } from '../../../components/common/Toaster';
import { extractErrorMessage } from '../../../api/client';

import { DataTable, DataTableColumnHeader } from '../../../components/ui/DataTable';
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
import { Checkbox } from '../../../components/ui/Checkbox';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { formatDate } from '../../../lib/utils';

interface UserTableProps {
  filters: {
    page: number;
    limit: number;
    role?: string;
    search?: string;
  };
  onFiltersChange: (filters: any) => void;
}

export function UserTable({ filters, onFiltersChange }: UserTableProps) {
  const { t } = useTranslation(['common', 'auth']);
  const { data, isLoading } = useAdminUsers(filters);
  
  const updateRoleMutation = useUpdateUserRole();
  const suspendMutation = useSuspendUser();
  const activateMutation = useActivateUser();
  const deleteMutation = useDeleteUser();

  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const handleUpdateRole = (userId: string, newRole: 'LAND_OWNER' | 'HEIR' | 'ADMIN') => {
    updateRoleMutation.mutate(
      { userId, role: newRole },
      {
        onSuccess: () => {
          toast.success('Role updated successfully');
        },
        onError: (error) => {
          toast.error('Failed to update role', extractErrorMessage(error));
        },
      }
    );
  };

  const handleSuspend = (userId: string) => {
    suspendMutation.mutate(userId, {
      onSuccess: () => {
        toast.success('User suspended successfully');
      },
      onError: (error) => {
        toast.error('Failed to suspend user', extractErrorMessage(error));
      },
    });
  };

  const handleActivate = (userId: string) => {
    activateMutation.mutate(userId, {
      onSuccess: () => {
        toast.success('User activated successfully');
      },
      onError: (error) => {
        toast.error('Failed to activate user', extractErrorMessage(error));
      },
    });
  };

  const handleDelete = () => {
    if (!selectedUser) return;
    
    deleteMutation.mutate(selectedUser.id, {
      onSuccess: () => {
        toast.success('User deleted successfully');
        setDeleteDialogOpen(false);
        setSelectedUser(null);
      },
      onError: (error) => {
        toast.error('Failed to delete user', extractErrorMessage(error));
      },
    });
  };

  const columns: ColumnDef<User>[] = [
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
      accessorKey: 'email',
      header: ({ column }) => <DataTableColumnHeader column={column} title="User" />,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div>
            <div className="font-medium">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
      cell: ({ row }) => {
        const role = row.getValue('role') as string;
        const variant = 
          role === 'ADMIN' ? 'destructive' : 
          role === 'HEIR' ? 'secondary' : 
          'default';
        return <Badge variant={variant}>{role.replace('_', ' ')}</Badge>;
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Joined" />,
      cell: ({ row }) => formatDate(row.getValue('createdAt')),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;
        const isSuspended = false; // Add status field to your User type if needed

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(user.id)}
              >
                Copy User ID
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'LAND_OWNER')}>
                <Shield className="mr-2 h-4 w-4" />
                Set as Land Owner
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'HEIR')}>
                <Shield className="mr-2 h-4 w-4" />
                Set as Heir
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'ADMIN')}>
                <Shield className="mr-2 h-4 w-4" />
                Set as Admin
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {isSuspended ? (
                <DropdownMenuItem onClick={() => handleActivate(user.id)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Activate User
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handleSuspend(user.id)}>
                  <Ban className="mr-2 h-4 w-4" />
                  Suspend User
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  setSelectedUser(user);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <>
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

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete User"
        description={`Are you sure you want to delete ${selectedUser?.firstName} ${selectedUser?.lastName}? This action cannot be undone.`}
        onConfirm={handleDelete}
        variant="destructive"
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}