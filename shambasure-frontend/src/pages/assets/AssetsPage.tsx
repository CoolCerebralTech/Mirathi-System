// FILE: src/pages/assets/AssetsPage.tsx

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Building2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { useAssets, useDeleteAsset } from '../../features/assets/assets.api';
import { getAssetColumns } from '../../features/assets/components/AssetsTable';
import { AssetForm } from '../../features/assets/components/AssetForm';
import type { Asset } from '../../types';
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
 * The main dashboard page for users to view, create, edit, and delete their assets.
 */
export function AssetsPage() {
  const { t } = useTranslation(['assets', 'common']);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [assetToDelete, setAssetToDelete] = React.useState<Asset | null>(null);
  const [assetToEdit, setAssetToEdit] = React.useState<Asset | null>(null);

  const assetsQuery = useAssets();
  const { mutate: deleteAsset, isPending: isDeleting } = useDeleteAsset();

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
    deleteAsset(assetToDelete.id, {
      onSuccess: () => {
        toast.success(t('delete_success', { name: assetToDelete.name }));
        setAssetToDelete(null);
      },
      onError: (error) => {
        toast.error(t('delete_failed'), {
          description: extractErrorMessage(error),
        });
        setAssetToDelete(null);
      },
    });
  };

  const columns = React.useMemo(
    () => getAssetColumns(t, { onEdit: handleOpenEdit, onDelete: setAssetToDelete }),
    [t],
  );

  const renderContent = () => {
    if (assetsQuery.isLoading) {
      return (
        <div className="flex h-96 items-center justify-center rounded-lg border">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    if (assetsQuery.isError) {
      return (
        <div className="flex h-96 flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 text-destructive">
          <AlertTriangle className="h-12 w-12" />
          <p className="mt-4 font-semibold">{t('common:error_loading_data')}</p>
        </div>
      );
    }

    const assets = assetsQuery.data?.data ?? [];

    if (assets.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">{t('no_assets_title')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t('no_assets_prompt')}</p>
          <Button onClick={handleOpenCreate} className="mt-6">
            <Plus className="mr-2 h-4 w-4" />
            {t('add_first_asset')}
          </Button>
        </div>
      );
    }

    return <DataTable columns={columns} data={assets} />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('my_assets')}
        description={t('my_assets_subtitle')}
        actions={
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('add_asset')}
          </Button>
        }
      />

      {renderContent()}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {assetToEdit ? t('edit_asset') : t('create_asset')}
            </DialogTitle>
            <DialogDescription>
              {assetToEdit ? t('edit_asset_description') : t('create_asset_description')}
            </DialogDescription>
          </DialogHeader>
          <AssetForm
            asset={assetToEdit}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!assetToDelete} onOpenChange={() => setAssetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common:are_you_sure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirm_delete_message', { name: assetToDelete?.name })}
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
