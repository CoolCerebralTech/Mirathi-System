// FILE: src/pages/DocumentDetailPage.tsx

import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, AlertTriangle, LinkIcon } from 'lucide-react';
import { format } from 'date-fns';

import { useDocument } from '../../features/documents/documents.api';
import { useAsset } from '../../features/assets/assets.api';
import { DocumentVersions } from '../../features/documents/components/DocumentVersions';

import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Separator } from '../../components/ui/Separator';

/**
 * A detail page for viewing a single document, its metadata, and its version history.
 */
export function DocumentDetailPage() {
  const { t } = useTranslation(['documents', 'common']);
  const { id } = useParams<{ id: string }>();

  const { data: document, isLoading, isError } = useDocument(id);
  // Fetch linked asset data to display its name
  const { data: linkedAsset } = useAsset(document?.assetId ?? undefined);

  if (!id) {
    // This case is handled by the router, but it's a safe fallback.
    return <div className="text-center"><h1 className="text-xl font-bold">{t('error_invalid_id')}</h1></div>;
  }

  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  if (isError || !document) {
    return (
      <div className="text-center">
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

  const latestVersion = document.versions[0];

  const metadataItems = [
    { label: t('metadata_labels.status'), value: <Badge>{t(`status_options.${document.status}`)}</Badge> },
    { label: t('metadata_labels.document_type'), value: t(`document_type_options.${document.documentType}`) },
    { label: t('metadata_labels.file_type'), value: latestVersion.mimeType.split('/')[1]?.toUpperCase() },
    { label: t('metadata_labels.file_size'), value: `${(latestVersion.sizeBytes / 1024 / 1024).toFixed(2)} MB` },
    { label: t('metadata_labels.document_number'), value: document.metadata?.documentNumber },
    { label: t('metadata_labels.issuing_authority'), value: document.metadata?.issuingAuthority },
    { label: t('metadata_labels.issue_date'), value: document.metadata?.issueDate ? format(new Date(document.metadata.issueDate), 'PP') : null },
    { label: t('metadata_labels.expiry_date'), value: document.metadata?.expiryDate ? format(new Date(document.metadata.expiryDate), 'PP') : null },
    { label: t('metadata_labels.uploaded_on'), value: format(new Date(document.createdAt), 'PP') },
    { label: t('metadata_labels.last_updated'), value: format(new Date(document.updatedAt), 'PP') },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={latestVersion.filename}
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
                    <li key={label} className="flex items-center justify-between">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="text-right font-medium">{value}</span>
                    </li>
                  ) : null,
                )}
              </ul>
              
              {/* --- LINKED ASSET SECTION (TODO Implemented) --- */}
              {document.assetId && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <h4 className="font-medium text-muted-foreground">{t('metadata_labels.linked_asset')}</h4>
                    {linkedAsset ? (
                      <div className="mt-2">
                        <Button asChild variant="secondary" className="w-full justify-start">
                          <Link to={`/dashboard/assets/${linkedAsset.id}`}>
                             <LinkIcon className="mr-2 h-4 w-4" />
                             {linkedAsset.name}
                          </Link>
                        </Button>
                      </div>
                    ) : (
                      <LoadingSpinner size="sm" className="mt-2" />
                    )}
                  </div>
                </>
              )}

              {document.verificationNotes && (
                 <>
                  <Separator className="my-4"/>
                  <div>
                    <h4 className="font-medium text-muted-foreground">{t('metadata_labels.verification_notes')}</h4>
                    <p className="mt-1 text-xs italic">"{document.verificationNotes}"</p>
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
