// FILE: src/features/admin/components/UserTable.tsx

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { 
  MoreHorizontal, 
  Trash2, 
  Shield, 
  Ban, 
  CheckCircle,
  Eye,
  Mail,
  Phone
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';

import { 
  useAdminUsers, 
  useUpdateUserRole, 
  useSuspendUser, 
  useActivateUser, 
  useDeleteUser 
} from '../admin.api';
import type { User, UserRole } from '../../../types';
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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '../../../components/ui/DropdownMenu';
import { Badge } from '../../../components/ui/Badge';
import { Checkbox } from '../../../components/ui/Checkbox';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { Avatar } from '../../../components/common/Avatar';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UserTableProps {
  filters: {
    page: number;
    limit: number;
    role?: UserRole;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
  onFiltersChange: (filters: any) => void;
  onViewUser?: (user: User) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getRoleBadgeVariant = (role: UserRole) => {
  switch (role) {
    case 'ADMIN':
      return 'destructive';
    case 'LAND_OWNER':
      return 'default';
    case 'HEIR':
      return 'secondary';
    default:
      return 'secondary';
  }
};

const getRoleLabel = (role: UserRole) => {
  switch (role) {
    case 'ADMIN':
      return 'Admin';
    case 'LAND_OWNER':
      return 'Land Owner';
    case 'HEIR':
      return 'Heir';
    default:
      return role;
  }
};

const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

// ============================================================================
// COMPONENT
// ============================================================================

export function UserTable({ filters, onFiltersChange, onViewUser }: UserTableProps) {
  const { t } = useTranslation(['admin', 'common']);
  const { data, isLoading } = useAdminUsers(filters);
  
  const updateRoleMutation = useUpdateUserRole();
  const suspendMutation = useSuspendUser();
  const activateMutation = useActivateUser();
  const deleteMutation = useDeleteUser();

  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedRows, setSelectedRows] = React.useState<Record<string, boolean>>({});

  // ============================================================================
  // MUTATION HANDLERS
  // ============================================================================

  const handleUpdateRole = React.useCallback((userId: string, newRole: UserRole) => {
    updateRoleMutation.mutate(
      { userId, role: newRole },
      {
        onSuccess: () => {
          toast.success(t('admin:role_updated_success'));
        },
        onError: (error) => {
          toast.error(t('common:error'), extractErrorMessage(error));
        },
      }
    );
  }, [updateRoleMutation, t]);

  const handleSuspend = React.useCallback((userId: string) => {
    suspendMutation.mutate(userId, {
      onSuccess: () => {
        toast.success(t('admin:user_suspended_success'));
      },
      onError: (error) => {
        toast.error(t('common:error'), extractErrorMessage(error));
      },
    });
  }, [suspendMutation, t]);

  const handleActivate = React.useCallback((userId: string) => {
    activateMutation.mutate(userId, {
      onSuccess: () => {
        toast.success(t('admin:user_activated_success'));
      },
      onError: (error) => {
        toast.error(t('common:error'), extractErrorMessage(error));
      },
    });
  }, [activateMutation, t]);

  const handleDelete = React.useCallback(() => {
    if (!selectedUser) return;
    
    deleteMutation.mutate(selectedUser.id, {
      onSuccess: () => {
        toast.success(t('admin:user_deleted_success'));
        setDeleteDialogOpen(false);
        setSelectedUser(null);
      },
      onError: (error) => {
        toast.error(t('common:error'), extractErrorMessage(error));
      },
    });
  }, [selectedUser, deleteMutation, t]);

  const handleBulkDelete = React.useCallback(() => {
    const selectedIds = Object.keys(selectedRows).filter(id => selectedRows[id]);
    // TODO: Implement bulk delete mutation
    console.log('Bulk delete:', selectedIds);
  }, [selectedRows]);

  // ============================================================================
  // TABLE COLUMNS
  // ============================================================================

  const columns: ColumnDef<User>[] = React.useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'email',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:user')} />,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar
              src={undefined}
              alt={`${user.firstName} ${user.lastName}`}
              fallback={getInitials(user.firstName, user.lastName)}
              className="h-10 w-10"
            />
            <div className="flex flex-col">
              <span className="font-medium">
                {user.firstName} {user.lastName}
              </span>
              <span className="text-sm text-muted-foreground">{user.email}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:role')} />,
      cell: ({ row }) => {
        const role = row.getValue('role') as UserRole;
        return (
          <Badge variant={getRoleBadgeVariant(role)}>
            {getRoleLabel(role)}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'profile',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:contact')} />,
      cell: ({ row }) => {
        const profile = row.original.profile;
        return (
          <div className="flex flex-col gap-1 text-sm">
            {profile?.phoneNumber ? (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-3 w-3" />
                {profile.phoneNumber}
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:joined')} />,
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
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;
        const isSuspended = false; // TODO: Add suspended status to User type

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>{t('admin:actions')}</DropdownMenuLabel>
              
              <DropdownMenuItem
                onClick={() => onViewUser?.(user)}
              >
                <Eye className="mr-2 h-4 w-4" />
                {t('admin:view_details')}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  navigator.clipboard.writeText(user.id);
                  toast.success(t('common:copied_to_clipboard'));
                }}
              >
                <Mail className="mr-2 h-4 w-4" />
                {t('admin:copy_user_id')}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Role Change Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Shield className="mr-2 h-4 w-4" />
                  {t('admin:change_role')}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem 
                    onClick={() => handleUpdateRole(user.id, 'LAND_OWNER')}
                    disabled={user.role === 'LAND_OWNER'}
                  >
                    {t('admin:role_land_owner')}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleUpdateRole(user.id, 'HEIR')}
                    disabled={user.role === 'HEIR'}
                  >
                    {t('admin:role_heir')}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleUpdateRole(user.id, 'ADMIN')}
                    disabled={user.role === 'ADMIN'}
                  >
                    {t('admin:role_admin')}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              {/* Suspend/Activate */}
              {isSuspended ? (
                <DropdownMenuItem onClick={() => handleActivate(user.id)}>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                  {t('admin:activate_user')}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handleSuspend(user.id)}>
                  <Ban className="mr-2 h-4 w-4 text-amber-600" />
                  {t('admin:suspend_user')}
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              {/* Delete */}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  setSelectedUser(user);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('admin:delete_user')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [t, onViewUser, handleUpdateRole, handleActivate, handleSuspend]);

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
        onRowSelectionChange={setSelectedRows}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('admin:confirm_delete_title')}
        description={t('admin:confirm_delete_user_message', {
          name: `${selectedUser?.firstName} ${selectedUser?.lastName}`,
        })}
        onConfirm={handleDelete}
        variant="destructive"
        confirmText={t('admin:delete')}
        cancelText={t('common:cancel')}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}