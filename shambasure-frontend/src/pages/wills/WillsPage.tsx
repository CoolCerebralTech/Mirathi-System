// FILE: src/pages/wills/WillsPage.tsx

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { useMyWills, useDeleteWill } from '../../features/wills/wills.api';
import { getWillColumns } from '../../features/wills/components/WillsTable';
import { WillForm } from '../../features/wills/components/WillForm';
import { Will } from '../../types/schemas/wills.schemas'; // UPGRADE: Correct import
import { extractErrorMessage } from '../../api/client';

import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/Dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/AlertDialog';

export function WillsPage() {
  const { t } = useTranslation(['wills', 'common']);
  const navigate = useNavigate();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [willToEdit, setWillToEdit] = useState<Will | null>(null);
  const [willToDelete, setWillToDelete] = useState<Will | null>(null);

  // UPGRADE: Use the correct `useMyWills` hook
  const { data: wills, isLoading, isError } = useMyWills();
  const deleteMutation = useDeleteWill();

  const handleOpenCreate = () => {
    setWillToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (will: Will) => {
    setWillToEdit(will);
    setIsFormOpen(true);
  };

  const handleView = (will: Will) => {
    // UPGRADE: Correct navigation path
    navigate(`/dashboard/wills/${will.id}`);
  };

  const handleDeleteConfirm = () => {
    if (!willToDelete) return;
    deleteMutation.mutate(willToDelete.id, {
      onSuccess: () => {
        toast.success(t('wills:delete_success', { title: willToDelete.title }));
        setWillToDelete(null);
      },
      onError: (error) => toast.error(t('wills:delete_failed'), { description: extractErrorMessage(error) }),
    });
  };

  const columns = React.useMemo(() => getWillColumns({
    onEdit: handleOpenEdit,
    onDelete: setWillToDelete,
    onView: handleView,
  }), []);

  const renderContent = () => {
    if (isLoading) return <div className="flex h-64 items-center justify-center rounded-lg border"><LoadingSpinner size="lg" /></div>;
    if (isError) return <div className="text-center text-destructive"><AlertTriangle className="mx-auto h-8 w-8" /><p>{t('common:error_loading_data')}</p></div>;
    if (!wills || wills.length === 0) {
      return (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">{t('wills:no_wills_title')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t('wills:no_wills_prompt')}</p>
          <Button onClick={handleOpenCreate} className="mt-6"><Plus className="mr-2 h-4 w-4" />{t('wills:create_first_will')}</Button>
        </div>
      );
    }
    return <DataTable columns={columns} data={wills} />;
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('wills:my_wills')} description={t('wills:my_wills_subtitle')}>
        <Button onClick={handleOpenCreate}><Plus className="mr-2 h-4 w-4" />{t('wills:create_will')}</Button>
      </PageHeader>
      
      {renderContent()}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{willToEdit ? t('wills:edit_will') : t('wills:create_will')}</DialogTitle>
            <DialogDescription>{willToEdit ? t('wills:edit_will_description') : t('wills:create_will_description')}</DialogDescription>
          </DialogHeader>
          <WillForm will={willToEdit} onSuccess={() => setIsFormOpen(false)} onCancel={() => setIsFormOpen(false)} />
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!willToDelete} onOpenChange={() => setWillToDelete(null)}>
         <AlertDialogContent>
            <AlertDialogHeader>
               <AlertDialogTitle>{t('common:are_you_sure')}</AlertDialogTitle>
               <AlertDialogDescription>{t('wills:confirm_delete_message', { title: willToDelete?.title })}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
               <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
               <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>{t('common:delete')}</AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}