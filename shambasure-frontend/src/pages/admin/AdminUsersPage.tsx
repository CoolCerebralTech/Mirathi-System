// FILE: src/pages/admin/AdminUsersPage.tsx

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AlertTriangle, Users } from 'lucide-react';

import { useAdminUsers, useDeleteUser } from '../../features/admin/admin.api';
import { getUsersTableColumns } from '../../features/admin/components/UsersTable';
import type { User } from '../../types';
import { extractErrorMessage } from '../../api/client';

import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/AlertDialog';
// NOTE: For role change, a more complex dialog with a select input would be better.
// For simplicity, we'll use a standard confirmation for now.

export function AdminUsersPage() {
  const { t } = useTranslation(['admin', 'common']);

  const [userToDelete, setUserToDelete] = React.useState<User | null>(null);
  // Example state for role change dialog
  // const [userToChangeRole, setUserToChangeRole] = React.useState<User | null>(null);

  const usersQuery = useAdminUsers();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();
  // const { mutate: updateUserRole, isPending: isUpdatingRole } = useUpdateUserRole();

  const columns = React.useMemo(
    () => getUsersTableColumns(t, {
      onDelete: setUserToDelete,
      onChangeRole: (user) => alert(`TODO: Open role change dialog for ${user.firstName}`),
    }),
    [t],
  );

  const handleDeleteConfirm = () => {
    if (!userToDelete) return;
    deleteUser(userToDelete.id, {
      onSuccess: () => {
        toast.success(t('toasts.user_deleted'));
        setUserToDelete(null);
      },
      onError: (error) => toast.error(extractErrorMessage(error)),
    });
  };

  const renderContent = () => {
    if (usersQuery.isLoading) {
      return <div className="flex h-96 items-center justify-center"><LoadingSpinner size="lg" /></div>;
    }
    if (usersQuery.isError) {
      return <div className="text-center text-destructive p-8"><AlertTriangle className="mx-auto h-8 w-8" /><p>{t('common:error_loading_data')}</p></div>;
    }
    const users = usersQuery.data?.data ?? [];
    if (users.length === 0) {
        return <div className="text-center py-16 border-2 border-dashed rounded-lg"><Users className="mx-auto h-12 w-12 text-muted-foreground" /><h3 className="mt-4 text-lg font-medium">No Users Found</h3></div>;
    }
    return <DataTable columns={columns} data={users} />;
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('users.title')} description={t('users.description')} />
      <div className="rounded-lg border">
        {renderContent()}
      </div>

      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('users.dialogs.confirm_delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('users.dialogs.confirm_delete_message', { name: `${userToDelete?.firstName} ${userToDelete?.lastName}` })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? t('common:deleting') : t('common:delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
