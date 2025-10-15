// FILE: src/pages/DocumentsPage.tsx

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Upload, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

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
import { useDocuments, useDeleteDocument } from '../../features/documents/documents.api';
import type { Document } from '../../types';

/**
 * The main dashboard page for users to view, upload, and manage their documents.
 */
export function DocumentsPage() {
  const { t } = useTranslation(['documents', 'common']);
  const navigate = useNavigate();

  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);

  const documentsQuery = useDocuments();
  const { mutate: deleteDocument, isPending: isDeleting } = useDeleteDocument();

  const columns = useMemo(
    () =>
      getDocumentColumns(t, {
        onDelete: (docId: string) => {
          const doc = documentsQuery.data?.data.find((d) => d.id === docId);
          if (doc) setDocToDelete(doc);
        },
        onEdit: (doc: Document) => navigate(`/dashboard/documents/${doc.id}/edit`),
        onViewVersions: (doc: Document) => navigate(`/dashboard/documents/${doc.id}`),
      }),
    [documentsQuery.data?.data, navigate, t],
  );

  const handleDeleteConfirm = () => {
    if (!docToDelete) return;

    deleteDocument(docToDelete.id, {
      onSuccess: () => {
        toast.success(
          t('delete_success', {
            filename: docToDelete.versions[0]?.filename ?? 'document',
          }),
        );
        setDocToDelete(null);
      },
      onError: (error) => {
        toast.error(t('delete_failed'), { description: error.message });
        setDocToDelete(null);
      },
    });
  };

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
        <div className="text-center text-destructive">
          <AlertTriangle className="mx-auto h-12 w-12" />
          <p className="mt-4 font-semibold">{t('common:error_loading_data')}</p>
        </div>
      );
    }

    const documents = documentsQuery.data?.data ?? [];

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

    return <DataTable columns={columns} data={documents} />;
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
          <DocumentUploader onSuccess={() => setIsUploaderOpen(false)} onCancel={() => setIsUploaderOpen(false)}/>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!docToDelete} onOpenChange={() => setDocToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common:are_you_sure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete_confirm_message', {
                filename: docToDelete?.versions[0]?.filename ?? 'this document',
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