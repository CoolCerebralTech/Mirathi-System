// FILE: src/pages/WillsPage.tsx

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Eye } from 'lucide-react';

import { useWills, useDeleteWill } from '../features/wills/wills.api';
import { getWillColumns } from '../features/wills/components/WillsTable';
import { WillForm } from '../features/wills/components/WillForm';
import type { Will, WillQuery } from '../types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select';

// ============================================================================
// COMPONENT
// ============================================================================

export function WillsPage() {
  const { t } = useTranslation(['wills', 'common']);
  const navigate = useNavigate();

  // State
  const [filters, setFilters] = React.useState<WillQuery>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedWill, setSelectedWill] = React.useState<Will | null>(null);

  // API Hooks
  const { data, isLoading } = useWills(filters);
  const deleteMutation = useDeleteWill();

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleCreate = () => {
    setSelectedWill(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (will: Will) => {
    setSelectedWill(will);
    setFormDialogOpen(true);
  };

  const handleViewDetails = (will: Will) => {
    navigate(`/wills/${will.id}`);
  };

  const handleDelete = () => {
    if (!selectedWill) return;

    deleteMutation.mutate(selectedWill.id, {
      onSuccess: () => {
        toast.success(t('wills:delete_success'));
        setDeleteDialogOpen(false);
        setSelectedWill(null);
      },
      onError: (error) => {
        toast.error(t('common:error'), extractErrorMessage(error));
      },
    });
  };

  const handleFormSuccess = () => {
    setFormDialogOpen(false);
    setSelectedWill(null);
  };

  const handleStatusFilter = (value: string) => {
    setFilters({
      ...filters,
      status: value === 'all' ? undefined : value as any,
      page: 1,
    });
  };

  // ============================================================================
  // TABLE COLUMNS
  // ============================================================================

  const columns = React.useMemo(
    () =>
      getWillColumns({
        onEdit: handleEdit,
        onDelete: (willId) => {
          const will = data?.data.find((w) => w.id === willId);
          if (will) {
            setSelectedWill(will);
            setDeleteDialogOpen(true);
          }
        },
        onViewDetails: handleViewDetails,
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
            <FileText className="h-8 w-8" />
            {t('wills:my_wills')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t('wills:my_wills_subtitle')}
          </p>
        </div>

        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('wills:create_will')}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <Select
            value={filters.status || 'all'}
            onValueChange={handleStatusFilter}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('wills:filter_by_status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('wills:all_statuses')}</SelectItem>
              <SelectItem value="DRAFT">{t('wills:draft')}</SelectItem>
              <SelectItem value="ACTIVE">{t('wills:active')}</SelectItem>
              <SelectItem value="REVOKED">{t('wills:revoked')}</SelectItem>
              <SelectItem value="EXECUTED">{t('wills:executed')}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={String(filters.limit)}
            onValueChange={(value) => setFilters({ ...filters, limit: Number(value), page: 1 })}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 {t('wills:per_page')}</SelectItem>
              <SelectItem value="25">25 {t('wills:per_page')}</SelectItem>
              <SelectItem value="50">50 {t('wills:per_page')}</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Wills Table */}
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

      {/* Will Form Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedWill ? t('wills:edit_will') : t('wills:create_will')}
            </DialogTitle>
            <DialogDescription>
              {selectedWill
                ? t('wills:edit_will_description')
                : t('wills:create_will_description')}
            </DialogDescription>
          </DialogHeader>
          <WillForm
            will={selectedWill}
            onSuccess={handleFormSuccess}
            onCancel={() => setFormDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('wills:confirm_delete_title')}
        description={t('wills:confirm_delete_message', {
          title: selectedWill?.title,
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