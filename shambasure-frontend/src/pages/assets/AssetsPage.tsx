// FILE: src/pages/dashboard/AssetsPage.tsx (Finalized)

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Building2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { useMyAssets, useDeleteAsset } from '../../features/assets/assets.api';
import { getAssetColumns } from '../../features/assets/components/AssetsTable';
import { AssetForm } from '../../features/assets/components/AssetForm';
import { Asset } from '../../types/schemas/assets.schemas'; // UPGRADE: Corrected import path
import { extractErrorMessage } from '../../api/client';

import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/Dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/AlertDialog';

export function AssetsPage() {
  const { t } = useTranslation(['assets', 'common']);

  // State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null);

  // API Hooks
  const { data: assets, isLoading, isError } = useMyAssets();
  const deleteMutation = useDeleteAsset();

  // Handlers
  const handleOpenCreate = () => {
    setAssetToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (asset: Asset) => {
    setAssetToEdit(asset);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setAssetToEdit(null);
  };

  const handleDeleteConfirm = () => {
    if (!assetToDelete) return;
    deleteMutation.mutate(assetToDelete.id, {
      onSuccess: () => {
        toast.success(t('assets:delete_success', { name: assetToDelete.name }));
        setAssetToDelete(null);
      },
      onError: (error) => {
        toast.error(t('assets:delete_failed'), { description: extractErrorMessage(error) });
      },
    });
  };

  const columns = React.useMemo(
    () => getAssetColumns({
      onEdit: handleOpenEdit,
      onDelete: setAssetToDelete, // UPGRADE: Simplified handler
    }),
    []
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-64 items-center justify-center rounded-lg border">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    if (isError) {
      return (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 text-destructive">
          <AlertTriangle className="h-8 w-8" />
          <p className="mt-2 font-medium">{t('common:error_loading_data')}</p>
        </div>
      );
    }

    if (!assets || assets.length === 0) {
      return (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">{t('assets:no_assets_title')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t('assets:no_assets_prompt')}</p>
          <Button onClick={handleOpenCreate} className="mt-6">
            <Plus className="mr-2 h-4 w-4" />
            {t('assets:add_first_asset')}
          </Button>
        </div>
      );
    }

    // UPGRADE: Pass the flat `assets` array directly to the data table
    return <DataTable columns={columns} data={assets} />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('assets:my_assets')}
        description={t('assets:my_assets_subtitle')}
      >
        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('assets:add_asset')}
        </Button>
      </PageHeader>

      {renderContent()}

      {/* Asset Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{assetToEdit ? t('assets:edit_asset') : t('assets:create_asset')}</DialogTitle>
            <DialogDescription>{assetToEdit ? t('assets:edit_asset_description') : t('assets:create_asset_description')}</DialogDescription>
          </DialogHeader>
          <AssetForm
            asset={assetToEdit}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!assetToDelete} onOpenChange={() => setAssetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('assets:confirm_delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('assets:confirm_delete_message', { name: assetToDelete?.name })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? t('common:deleting') : t('common:delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}