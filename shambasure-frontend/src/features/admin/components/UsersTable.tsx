// FILE: src/features/admin/components/UsersTable.tsx

import type { ColumnDef } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, Shield, Trash2 } from 'lucide-react';

import type { User, UserRole } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/DropdownMenu';
import { DataTableColumnHeader } from '../../../components/ui/DataTable';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/common/Avatar';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// TYPE DEFINITIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

interface UsersTableActions {
  onChangeRole: (user: User) => void;
  onDelete: (user: User) => void;
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// HELPER
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const getRoleBadgeVariant = (role: UserRole) => {
  switch (role) {
    case 'ADMIN': return 'default';
    case 'LAND_OWNER': return 'secondary';
    case 'HEIR': return 'outline';
    default: return 'secondary';
  }
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COLUMNS FACTORY
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export const getUsersTableColumns = (t: TFunction, actions: UsersTableActions): ColumnDef<User>[] => {
  return [
    {
      accessorKey: 'firstName',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:users.columns.user')} />,
      cell: ({ row }) => {
        const user = row.original;
        const initials = `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`;
        return (
          <div className="flex items-center gap-3">
            <Avatar fallback={initials} className="h-9 w-9" />
            <div>
              <p className="font-medium">{`${user.firstName} ${user.lastName}`}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:users.columns.role')} />,
      cell: ({ row }) => {
        const role = row.original.role;
        return (
          <Badge variant={getRoleBadgeVariant(role)}>
            {t(`auth:role_${role.toLowerCase()}`)}
          </Badge>
        );
      },
      filterFn: (row, id, value) => value.includes(row.getValue(id)),
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('admin:users.columns.joined')} />,
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return <span className="text-sm">{formatDistanceToNow(date, { addSuffix: true })}</span>;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => actions.onChangeRole(user)}>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>{t('admin:users.actions.change_role')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => actions.onDelete(user)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>{t('admin:users.actions.delete_user')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
};
