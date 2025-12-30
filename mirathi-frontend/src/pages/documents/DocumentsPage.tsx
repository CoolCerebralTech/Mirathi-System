// FILE: src/pages/DocumentsPage.tsx

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Upload, FileText, AlertTriangle } from 'lucide-react';
import type { PaginationState } from '@tanstack/react-table';

import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

import { getDocumentColumns } from '../../features/documents/components/DocumentsTable';
import { DocumentUploader } from '../../features/documents/components/DocumentUploader';
import { useDocuments, useDeleteDocument } from '../../features/documents/document.api';
import type { Document } from '../../types/document.types';

export function DocumentsPage() {
  const { t } = useTranslation(['documents', 'common']);
  const navigate = useNavigate();

  const [isUploaderOpen, setIsUploaderOpen] = React.useState(false);
  const [docToDelete, setDocToDelete] = React.useState<Document | null>(null);

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const documentsQuery = useDocuments({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
  });

  const { mutate: deleteDocument, isPending: isDeleting } = useDeleteDocument();

  const columns = React.useMemo(
    () =>
      getDocumentColumns(t, {
        onDelete: (docId: string) => {
          const doc = documentsQuery.data?.data.find((d) => d.id === docId);
          if (doc) setDocToDelete(doc);
        },
        onEdit: (doc: Document) => navigate(`/dashboard/documents/${doc.id}`),
        onViewVersions: (doc: Document) => navigate(`/dashboard/documents/${doc.id}`),
      }),
    [navigate, t, documentsQuery.data?.data]
  );

  const handleDeleteConfirm = () => {
    if (!docToDelete) return;

    deleteDocument(docToDelete.id, {
      onSuccess: () => setDocToDelete(null),
      onError: () => setDocToDelete(null),
    });
  };

  const documents = documentsQuery.data?.data ?? [];
  const pageCount = documentsQuery.data?.totalPages ?? 0;

  const renderContent = () => {
    if (documentsQuery.isLoading) {
      return (
        <div className="flex h-96 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    if (documentsQuery.isError) {
      return (
        <div className="flex flex-col items-center justify-center text-center text-destructive">
          <AlertTriangle className="mx-auto h-12 w-12" />
          <p className="mt-4 font-semibold">{t('common:error_loading_data')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('common:please_try_again')}</p>
        </div>
      );
    }

    if (documents.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">{t('no_documents_title')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t('no_documents_prompt')}</p>
          <Button onClick={() => setIsUploaderOpen(true)} className="mt-6">
            <Upload className="mr-2 h-4 w-4" />
            {t('upload_first_document')}
          </Button>
        </div>
      );
    }

    return (
      <DataTable
        columns={columns}
        data={documents}
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={setPagination}
      />
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Button onClick={() => setIsUploaderOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            {t('upload_document')}
          </Button>
        }
      />

      {renderContent()}

      <Dialog open={isUploaderOpen} onOpenChange={setIsUploaderOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>{t('upload_new_document')}</DialogTitle>
            <DialogDescription>{t('upload_prompt')}</DialogDescription>
          </DialogHeader>
          <DocumentUploader
            onSuccess={() => setIsUploaderOpen(false)}
            onCancel={() => setIsUploaderOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!docToDelete} onOpenChange={() => setDocToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common:are_you_sure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete_confirm_message', {
                filename: docToDelete?.fileName ?? 'this document',
              })}
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