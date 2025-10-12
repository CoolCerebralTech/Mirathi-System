// FILE: src/pages/AssetsPage.tsx

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Building2 } from 'lucide-react';

import { useAssets, useDeleteAsset } from '../features/assets/assets.api';
import { getAssetColumns } from '../features/assets/components/AssetsTable';
import { AssetForm } from '../features/assets/components/AssetForm';
import type { Asset, AssetQuery } from '../types';
import { toast } from '../components/common/Toaster';
import { extractErrorMessage } from '../api/client';

import { Button } from '../components/ui/Button';
import { DataTable } from '../components/ui/DataTable';
import { Card, CardContent } from '../components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/Dialog';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

// ============================================================================
// COMPONENT
// ============================================================================

export function AssetsPage() {
  const { t } = useTranslation(['assets', 'common']);

  // State
  const [filters, setFilters] = React.useState<AssetQuery>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedAsset, setSelectedAsset] = React.useState<Asset | null>(null);

  // API Hooks
  const { data, isLoading } = useAssets(filters);
  const deleteMutation = useDeleteAsset();

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCreate = () => {
    setSelectedAsset(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    setFormDialogOpen(true);
  };

  const handleDelete = () => {
    if (!selectedAsset) return;

    deleteMutation.mutate(selectedAsset.id, {
      onSuccess: () => {
        toast.success(t('assets:delete_success'));
        setDeleteDialogOpen(false);
        setSelectedAsset(null);
      },
      onError: (error) => {
        toast.error(t('common:error'), extractErrorMessage(error));
      },
    });
  };

  const handleFormSuccess = () => {
    setFormDialogOpen(false);
    setSelectedAsset(null);
  };

  // ============================================================================
  // TABLE COLUMNS
  // ============================================================================

  const columns = React.useMemo(
    () =>
      getAssetColumns({
        onEdit: handleEdit,
        onDelete: (assetId) => {
          const asset = data?.data.find((a) => a.id === assetId);
          if (asset) {
            setSelectedAsset(asset);
            setDeleteDialogOpen(true);
          }
        },
      }),
    [data]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            {t('assets:my_assets')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t('assets:my_assets_subtitle')}
          </p>
        </div>

        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('assets:add_asset')}
        </Button>
      </div>

      {/* Assets Table */}
      <Card>
        <CardContent className="p-0">
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
              const newState =
                typeof updater === 'function'
                  ? updater({ pageIndex: filters.page - 1, pageSize: filters.limit })
                  : updater;

              setFilters({
                ...filters,
                page: newState.pageIndex + 1,
                limit: newState.pageSize,
              });
            }}
          />
        </CardContent>
      </Card>

      {/* Asset Form Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedAsset ? t('assets:edit_asset') : t('assets:create_asset')}
            </DialogTitle>
            <DialogDescription>
              {selectedAsset
                ? t('assets:edit_asset_description')
                : t('assets:create_asset_description')}
            </DialogDescription>
          </DialogHeader>
          <AssetForm
            asset={selectedAsset}
            onSuccess={handleFormSuccess}
            onCancel={() => setFormDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('assets:confirm_delete_title')}
        description={t('assets:confirm_delete_message', {
          name: selectedAsset?.name,
        })}
        onConfirm={handleDelete}
        variant="destructive"
        confirmText={t('common:delete')}
        cancelText={t('common:cancel')}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}