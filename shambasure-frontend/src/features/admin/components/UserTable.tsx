// FILE: src/features/admin/components/UserTable.tsx (Finalized)

import * as React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Trash2, Shield, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

import { useAdminUsers, useUpdateUserRole, useDeleteUser } from '../admin.api';
import { User, UserRole, UserQuery } from '../../../types/schemas/user.schemas'; // UPGRADE: Corrected imports
import { extractErrorMessage } from '../../../api/client';

import { DataTable, DataTableColumnHeader } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '../../../components/ui/DropdownMenu';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/common/Avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/AlertDialog';

interface UserTableProps {
  filters: Partial<UserQuery>;
  onPaginationChange: (updater: any) => void;
}

const useRoleInfo = () => {
    const { t } = useTranslation('admin');
    return (role: UserRole) => {
        const roles = {
            ADMIN: { label: t('role_admin'), variant: 'destructive' },
            LAND_OWNER: { label: t('role_land_owner'), variant: 'default' },
            HEIR: { label: t('role_heir'), variant: 'secondary' },
        };
        return roles[role] || { label: role, variant: 'secondary' };
    };
};

const getInitials = (firstName = '', lastName = '') => `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

export function UserTable({ filters, onPaginationChange }: UserTableProps) {
  const { t } = useTranslation(['admin', 'common']);
  const { data, isLoading } = useAdminUsers(filters);
  
  const updateRoleMutation = useUpdateUserRole();
  const deleteMutation = useDeleteUser();

  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);

  const handleUpdateRole = (userId: string, newRole: UserRole) => {
    updateRoleMutation.mutate({ userId, role: newRole }, {
      onSuccess: () => toast.success(t('admin:role_updated_success')),
      onError: (error) => toast.error(t('common:error'), { description: extractErrorMessage(error) }),
    });
  };

  const handleDeleteConfirm = () => {
    if (!userToDelete) return;
    deleteMutation.mutate(userToDelete.id, {
      onSuccess: () => {
        toast.success(t('admin:user_deleted_success'));
        setUserToDelete(null);
      },
      onError: (error) => toast.error(t('common:error'), { description: extractErrorMessage(error) }),
    });
  };
  
  const getRoleInfo = useRoleInfo();

  const columns: ColumnDef<User>[] = React.useMemo(() => [
    {
      accessorKey: 'firstName',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:user')} />,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar fallback={getInitials(user.firstName, user.lastName)} />
            <div>
              <span className="font-medium">{user.firstName} {user.lastName}</span>
              <p className="text-sm text-muted-foreground">{user.email}</p>
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
        const roleInfo = getRoleInfo(role);
        return <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>;
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:joined')} />,
      cell: ({ row }) => <span>{formatDistanceToNow(new Date(row.getValue('createdAt')), { addSuffix: true })}</span>,
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={16} /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger><Shield className="mr-2 h-4 w-4" />{t('admin:change_role')}</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'LAND_OWNER')} disabled={user.role === 'LAND_OWNER'}>{t('admin:role_land_owner')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'HEIR')} disabled={user.role === 'HEIR'}>{t('admin:role_heir')}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleUpdateRole(user.id, 'ADMIN')} disabled={user.role === 'ADMIN'}>{t('admin:role_admin')}</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem className="text-destructive" onClick={() => setUserToDelete(user)}><Trash2 className="mr-2 h-4 w-4" />{t('common:delete')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [t, getRoleInfo, handleUpdateRole]);

  const pageCount = data ? Math.ceil(data.total / (filters.limit || 10)) : 0;
  
  return (
    <>
      <DataTable
        columns={columns}
        data={data?.users || []} // UPGRADE: Use `data.users`
        isLoading={isLoading}
        pageCount={pageCount}
        pagination={{ pageIndex: (filters.page || 1) - 1, pageSize: filters.limit || 10 }}
        onPaginationChange={onPaginationChange}
      />
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t('common:are_you_sure')}</AlertDialogTitle><AlertDialogDescription>{t('admin:confirm_delete_user_message', { name: `${userToDelete?.firstName} ${userToDelete?.lastName}` })}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>{t('common:delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}