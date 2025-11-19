// FILE: src/pages/DocumentDetailPage.tsx

import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, AlertTriangle, LinkIcon } from 'lucide-react';
import { format } from 'date-fns';

import { useDocument } from '../../features/documents/document.api';
import { useAsset } from '../../features/assets/assets.api';
import { DocumentVersions } from '../../features/documents/components/DocumentVersions';
import type { DocumentStatus } from '../../types/document.types';

import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Separator } from '../../components/ui/Separator';

const getStatusBadgeVariant = (status?: DocumentStatus) => {
  switch (status) {
    case 'VERIFIED': return 'success';
    case 'PENDING_VERIFICATION': return 'secondary';
    case 'REJECTED': return 'destructive';
    default: return 'default';
  }
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
};

export function DocumentDetailPage() {
  const { t } = useTranslation(['documents', 'common']);
  const { id } = useParams<{ id: string }>();

  const { data: document, isLoading, isError } = useDocument(id);
  
  // Fix: specific check to convert 'null' to 'undefined' for the hook
  const { data: linkedAsset } = useAsset(document?.assetId ?? undefined);

  if (!id) {
    return <div className="text-center"><h1 className="text-xl font-bold">{t('error_invalid_id')}</h1></div>;
  }

  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  if (isError || !document) {
    return (
      <div className="flex flex-col items-center justify-center text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
        <h3 className="mt-4 text-xl font-semibold">{t('error_loading_title')}</h3>
        <p className="mt-2 text-muted-foreground">{t('error_loading_prompt')}</p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/dashboard/documents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('back_to_documents')}
          </Link>
        </Button>
      </div>
    );
  }

  const metadataItems = [
    { 
      label: t('metadata_labels.status'), 
      value: <Badge variant={getStatusBadgeVariant(document.status)}>{t(`status_options.${document.status}`)}</Badge> 
    },
    { 
      label: t('metadata_labels.category'), 
      value: t(`document_category_options.${document.category}`) 
    },
    { 
      label: t('metadata_labels.file_type'), 
      value: document.mimeType.split('/')[1]?.toUpperCase() 
    },
    { 
      label: t('metadata_labels.file_size'), 
      value: formatFileSize(document.sizeBytes) 
    },
    { 
      label: t('metadata_labels.document_number'), 
      value: document.documentNumber 
    },
    { 
      label: t('metadata_labels.issuing_authority'), 
      value: document.issuingAuthority 
    },
    { 
      label: t('metadata_labels.issue_date'), 
      value: document.issueDate ? format(document.issueDate, 'PP') : null 
    },
    { 
      label: t('metadata_labels.expiry_date'), 
      value: document.expiryDate ? format(document.expiryDate, 'PP') : null 
    },
    { 
      label: t('metadata_labels.uploaded_on'), 
      value: document.createdAt ? format(document.createdAt, 'PP') : t('common:unknown') 
    },
    { 
      label: t('metadata_labels.last_updated'), 
      value: document.updatedAt ? format(document.updatedAt, 'PP') : t('common:unknown') 
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={document.fileName}
        description={t('detail_page_description')}
        showBackButton
        backButtonHref="/dashboard/documents"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DocumentVersions document={document} />
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader><CardTitle>{t('metadata_title')}</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {metadataItems.map(({ label, value }) =>
                  value ? (
                    <li key={label} className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="text-right font-medium">{value}</span>
                    </li>
                  ) : null,
                )}
              </ul>
              
              {document.assetId && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <h4 className="font-medium text-muted-foreground">{t('metadata_labels.linked_asset')}</h4>
                    {linkedAsset ? (
                      <div className="mt-2">
                        <Button asChild variant="secondary" className="w-full justify-start text-left">
                          <Link to={`/dashboard/assets/${linkedAsset.id}`}>
                             <LinkIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                             <span className="truncate">{linkedAsset.name}</span>
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <LoadingSpinner size="sm" className="mt-2" />
                    )}
                  </div>
                </>
              )}

              {document.rejectionReason && (
                 <>
                  <Separator className="my-4"/>
                  <div>
                    <h4 className="font-medium text-destructive">{t('metadata_labels.rejection_reason')}</h4>
                    <p className="mt-1 text-sm text-destructive/90">{document.rejectionReason}</p>
                  </div>
                 </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}