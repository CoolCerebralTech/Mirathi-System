// FILE: src/pages/DocumentsPage.tsx

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Upload, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable'; // Assuming you have a generic DataTable component
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
import { Document } from '../../types';

export function DocumentsPage() {
  const { t } = useTranslation(['documents', 'common']);
  const navigate = useNavigate();

  // State for controlling modals
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);

  // Data Fetching
  const documentsQuery = useDocuments(); // Add filters/pagination state here later
  const deleteMutation = useDeleteDocument();

  // Memoize columns to prevent re-calculation on every render. This is a critical performance optimization.
  const columns = useMemo(() => getDocumentColumns({
    onDelete: (docId) => {
      const doc = documentsQuery.data?.find(d => d.id === docId);
      if (doc) setDocToDelete(doc);
    },
    onView: (docId) => navigate(`/dashboard/documents/${docId}`),
    // You can add other handlers like onEdit, onShare here.
  }), [documentsQuery.data, navigate]);

  const handleDeleteConfirm = () => {
    if (!docToDelete) return;
    deleteMutation.mutate(docToDelete.id, {
      onSuccess: () => {
        toast.success(t('documents:delete_success', { filename: docToDelete.filename }));
        setDocToDelete(null);
      },
      onError: (error) => {
        toast.error(t('documents:delete_failed'), { description: error.message });
      },
    });
  };
  
  const renderContent = () => {
    if (documentsQuery.isLoading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    if (documentsQuery.isError) {
      return (
        <div className="text-center text-destructive">
          <AlertTriangle className="mx-auto h-8 w-8" />
          <p>{t('common:error_loading_data')}</p>
        </div>
      );
    }
    
    if (!documentsQuery.data || documentsQuery.data.length === 0) {
      return (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
           <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
           <h3 className="mt-4 text-lg font-medium">{t('documents:no_documents_title')}</h3>
           <p className="mt-1 text-sm text-muted-foreground">{t('documents:no_documents_prompt')}</p>
           <Button onClick={() => setIsUploaderOpen(true)} className="mt-6">
              <Upload className="mr-2 h-4 w-4" />
              {t('documents:upload_first_document')}
           </Button>
        </div>
      );
    }
    
    return <DataTable columns={columns} data={documentsQuery.data} />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('documents:title')}
        description={t('documents:description')}
      >
        <Button onClick={() => setIsUploaderOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />
          {t('documents:upload_document')}
        </Button>
      </PageHeader>

      {renderContent()}

      {/* Upload Document Dialog */}
      <Dialog open={isUploaderOpen} onOpenChange={setIsUploaderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('documents:upload_new_document')}</DialogTitle>
            <DialogDescription>{t('documents:upload_prompt')}</DialogDescription>
          </DialogHeader>
          <DocumentUploader onSuccess={() => setIsUploaderOpen(false)} />
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!docToDelete} onOpenChange={() => setDocToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common:are_you_sure')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('documents:delete_confirm_message', { filename: docToDelete?.filename })}
            </AlertDialogDescription>
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