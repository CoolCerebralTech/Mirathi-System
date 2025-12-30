// FILE: src/pages/admin/AdminTemplatesPage.tsx

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AlertTriangle, FileJson, Plus } from 'lucide-react';

import { useTemplates, useDeleteTemplate } from '../../features/admin/templates.api';
import { getTemplatesTableColumns } from '../../features/admin/components/TemplatesTable';
import { TemplateForm } from '../../features/admin/components/TemplateForm';
import type { Template } from '../../types';
import { extractErrorMessage } from '../../api/client';

import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import {
  Dialog,
  DialogContent,
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

export function AdminTemplatesPage() {
  const { t } = useTranslation(['admin', 'common']);

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [templateToEdit, setTemplateToEdit] = React.useState<Template | null>(null);
  const [templateToDelete, setTemplateToDelete] = React.useState<Template | null>(null);

  const templatesQuery = useTemplates();
  const { mutate: deleteTemplate, isPending: isDeleting } = useDeleteTemplate();

  const handleOpenCreate = () => {
    setTemplateToEdit(null);
    setIsFormOpen(true);
  };
  const handleOpenEdit = (template: Template) => {
    setTemplateToEdit(template);
    setIsFormOpen(true);
  };
  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setTemplateToEdit(null);
  };

  const columns = React.useMemo(
    () =>
      getTemplatesTableColumns(t, {
        onEdit: handleOpenEdit,
        onDelete: setTemplateToDelete,
      }),
    [t],
  );

  const handleDeleteConfirm = () => {
    if (!templateToDelete) return;
    deleteTemplate(templateToDelete.id, {
      onSuccess: () => {
        toast.success(t('templates.delete_success'));
        setTemplateToDelete(null);
      },
      onError: (err) =>
        toast.error(t('templates.delete_failed'), {
          description: extractErrorMessage(err),
        }),
    });
  };

  const renderContent = () => {
    if (templatesQuery.isLoading) {
      return (
        <div className="flex h-96 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    if (templatesQuery.isError) {
      return (
        <div className="flex h-96 flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 text-destructive p-8">
          <AlertTriangle className="h-12 w-12" />
          <p className="mt-4 font-semibold">
            {t('common:error_loading_data')}
          </p>
        </div>
      );
    }

    const templates = templatesQuery.data?.data ?? [];
    if (templates.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 text-center">
          <FileJson className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">
            {t('templates.no_templates_title')}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('templates.no_templates_prompt')}
          </p>
          <Button onClick={handleOpenCreate} className="mt-6">
            <Plus className="mr-2 h-4 w-4" />
            {t('templates.create_template')}
          </Button>
        </div>
      );
    }

    return <DataTable columns={columns} data={templates} />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('templates.title')}
        description={t('templates.description')}
        actions={
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t('templates.create_template')}
          </Button>
        }
      />

      <div className="rounded-lg border">{renderContent()}</div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {templateToEdit
                ? t('templates.edit_template')
                : t('templates.create_template')}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto p-1 pr-4">
            <TemplateForm
              template={templateToEdit}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsFormOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!templateToDelete}
        onOpenChange={() => setTemplateToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common:are_you_sure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('templates.confirm_delete_message', {
                name: templateToDelete?.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? t('common:deleting') : t('common:delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
