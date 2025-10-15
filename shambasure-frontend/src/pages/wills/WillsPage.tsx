// FILE: src/pages/wills/WillsPage.tsx

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { useWills, useDeleteWill } from '../../features/wills/wills.api';
import { getWillColumns } from '../../features/wills/components/WillsTable';
import { WillForm } from '../../features/wills/components/WillForm';
import type { Will } from '../../types';
import { extractErrorMessage } from '../../api/client';

import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/Dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/AlertDialog';

/**
 * The main dashboard page for users to view, create, edit, and delete their wills.
 */
export function WillsPage() {
  const { t } = useTranslation(['wills', 'common']);
  const navigate = useNavigate();

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [willToEdit, setWillToEdit] = React.useState<Will | null>(null);
  const [willToDelete, setWillToDelete] = React.useState<Will | null>(null);

  const willsQuery = useWills();
  const { mutate: deleteWill, isPending: isDeleting } = useDeleteWill();

  const handleOpenCreate = () => {
    setWillToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (will: Will) => {
    setWillToEdit(will);
    setIsFormOpen(true);
  };

  // 👇 useCallback so it's stable and doesn't trigger lint warning
  const handleView = React.useCallback(
    (will: Will) => navigate(`/dashboard/wills/${will.id}`),
    [navigate],
  );

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setWillToEdit(null);
  };

  const handleDeleteConfirm = () => {
    if (!willToDelete) return;
    deleteWill(willToDelete.id, {
      onSuccess: () => {
        toast.success(t('delete_success', { title: willToDelete.title }));
        setWillToDelete(null);
      },
      onError: (error) => {
        toast.error(t('delete_failed'), { description: extractErrorMessage(error) });
        setWillToDelete(null);
      },
    });
  };

  const columns = React.useMemo(
    () =>
      getWillColumns(t, {
        onEdit: handleOpenEdit,
        onDelete: setWillToDelete,
        onView: handleView,
      }),
    [t, handleView],
  );

  const renderContent = () => {
    if (willsQuery.isLoading) {
      return (
        <div className="flex h-96 items-center justify-center rounded-lg border">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    if (willsQuery.isError) {
      return (
        <div className="flex h-96 flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 text-destructive">
          <AlertTriangle className="h-12 w-12" />
          <p className="mt-4 font-semibold">{t('common:error_loading_data')}</p>
        </div>
      );
    }

    const wills = willsQuery.data?.data ?? [];

    if (wills.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">{t('no_wills_title')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t('no_wills_prompt')}</p>
          <Button onClick={handleOpenCreate} className="mt-6">
            <Plus className="mr-2 h-4 w-4" />
            {t('create_first_will')}
          </Button>
        </div>
      );
    }

    return <DataTable columns={columns} data={wills} />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('my_wills')}
        description={t('my_wills_subtitle')}
        actions={
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('create_will')}
          </Button>
        }
      />

      {renderContent()}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{willToEdit ? t('edit_will') : t('create_will')}</DialogTitle>
            <DialogDescription>
              {willToEdit ? t('edit_will_description') : t('create_will_description')}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto p-1 pr-4">
            <WillForm
              will={willToEdit}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!willToDelete} onOpenChange={() => setWillToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common:are_you_sure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirm_delete_message', { title: willToDelete?.title || '' })}
            </AlertDialogDescription>
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

