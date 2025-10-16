// FILE: src/pages/admin/AdminDocumentsPage.tsx

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AlertTriangle, FileCheck, Filter } from 'lucide-react';

import { useAdminDocuments, useVerifyDocument, useRejectDocument } from '../../features/admin/admin.api';
import { getAdminDocumentsTableColumns } from '../../features/admin/components/AdminDocumentsTable';
import type { Document, DocumentStatus } from '../../types';
import { extractErrorMessage } from '../../api/client';

import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/Dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Label } from '../../components/ui/Label';

export function AdminDocumentsPage() {
  const { t } = useTranslation(['admin', 'common', 'documents']);
  
  const [statusFilter, setStatusFilter] = React.useState<DocumentStatus | 'ALL'>('ALL');
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [selectedDocument, setSelectedDocument] = React.useState<Document | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState('');

  const documentsQuery = useAdminDocuments();
  const { mutate: verifyDocument } = useVerifyDocument();
  const { mutate: rejectDocument, isPending: isRejecting } = useRejectDocument();

  const handleVerify = React.useCallback((doc: Document) => {
    verifyDocument(doc.id, {
      onSuccess: () => {
        toast.success(t('toasts.document_verified'));
      },
      onError: (err) => {
        toast.error(t('toasts.verification_failed'), {
          description: extractErrorMessage(err),
        });
      },
    });
  }, [verifyDocument, t]);

  const handleRejectClick = React.useCallback((doc: Document) => {
    setSelectedDocument(doc);
    setRejectionReason('');
    setRejectDialogOpen(true);
  }, []);

  const handleRejectConfirm = React.useCallback(() => {
    if (!selectedDocument) return;
    
    if (!rejectionReason.trim()) {
      toast.error(t('toasts.rejection_reason_required'));
      return;
    }

    // Note: If your API supports rejection reasons, you'll need to update the mutation
    // For now, calling with just the documentId as expected by the current API
    rejectDocument(selectedDocument.id, {
      onSuccess: () => {
        toast.success(t('toasts.document_rejected'));
        setRejectDialogOpen(false);
        setSelectedDocument(null);
        setRejectionReason('');
        // TODO: Store rejectionReason if your backend supports it
      },
      onError: (err) => {
        toast.error(t('toasts.rejection_failed'), {
          description: extractErrorMessage(err),
        });
      },
    });
  }, [selectedDocument, rejectionReason, rejectDocument, t]);

  const handleCancelReject = React.useCallback(() => {
    setRejectDialogOpen(false);
    setSelectedDocument(null);
    setRejectionReason('');
  }, []);

  const columns = React.useMemo(
    () => getAdminDocumentsTableColumns(t, { 
      onVerify: handleVerify, 
      onReject: handleRejectClick 
    }),
    [t, handleVerify, handleRejectClick],
  );

  const filteredDocuments = React.useMemo(() => {
    const documents = documentsQuery.data?.data ?? [];
    if (statusFilter === 'ALL') return documents;
    return documents.filter(doc => doc.status === statusFilter);
  }, [documentsQuery.data?.data, statusFilter]);

  const statusCounts = React.useMemo(() => {
    const documents = documentsQuery.data?.data ?? [];
    return {
      all: documents.length,
      pending: documents.filter(d => d.status === 'PENDING_VERIFICATION').length,
      verified: documents.filter(d => d.status === 'VERIFIED').length,
      rejected: documents.filter(d => d.status === 'REJECTED').length,
    };
  }, [documentsQuery.data?.data]);

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
        <div className="text-center text-destructive p-8">
          <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
          <p className="font-medium">{t('common:error_loading_data')}</p>
          <p className="text-sm mt-1">{extractErrorMessage(documentsQuery.error)}</p>
          <Button 
            variant="outline" 
            onClick={() => documentsQuery.refetch()} 
            className="mt-4"
          >
            {t('common:retry')}
          </Button>
        </div>
      );
    }

    if (filteredDocuments.length === 0) {
      const isFiltered = statusFilter !== 'ALL';
      return (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <FileCheck className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">
            {isFiltered ? t('documents.no_filtered_documents') : t('documents.empty_title')}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {isFiltered ? t('documents.try_different_filter') : t('documents.empty_description')}
          </p>
          {isFiltered && (
            <Button 
              variant="outline" 
              onClick={() => setStatusFilter('ALL')} 
              className="mt-4"
            >
              {t('documents.clear_filters')}
            </Button>
          )}
        </div>
      );
    }

    return <DataTable columns={columns} data={filteredDocuments} />;
  };

  return (
    <>
      <div className="space-y-6">
        <PageHeader 
          title={t('documents.title')} 
          description={t('documents.description')} 
        />

        {/* Status Filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="status-filter" className="text-sm">
              {t('documents.filter_by_status')}
            </Label>
          </div>
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as DocumentStatus | 'ALL')}>
            <SelectTrigger id="status-filter" className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">
                {t('documents.all_documents')} ({statusCounts.all})
              </SelectItem>
              <SelectItem value="PENDING_VERIFICATION">
                {t('documents:status_options.PENDING_VERIFICATION')} ({statusCounts.pending})
              </SelectItem>
              <SelectItem value="VERIFIED">
                {t('documents:status_options.VERIFIED')} ({statusCounts.verified})
              </SelectItem>
              <SelectItem value="REJECTED">
                {t('documents:status_options.REJECTED')} ({statusCounts.rejected})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Data Table */}
        <div className="rounded-lg border bg-card">
          {renderContent()}
        </div>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('documents.reject_dialog_title')}</DialogTitle>
            <DialogDescription>
              {t('documents.reject_dialog_description')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {selectedDocument && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm font-medium">
                  {selectedDocument.versions[0]?.filename ?? 'N/A'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t(`documents:document_type_options.${selectedDocument.documentType}`)}
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">
                {t('documents.rejection_reason_label')} *
              </Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={t('documents.rejection_reason_placeholder')}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {t('documents.rejection_reason_help')}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={handleCancelReject}
              disabled={isRejecting}
            >
              {t('common:cancel')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectConfirm}
              disabled={isRejecting || !rejectionReason.trim()}
            >
              {isRejecting && <LoadingSpinner size="sm" className="mr-2" />}
              {isRejecting ? t('common:processing') : t('documents.confirm_reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
