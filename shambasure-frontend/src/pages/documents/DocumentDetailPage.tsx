// FILE: src/pages/DocumentDetailPage.tsx

import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

import { useDocument } from '../../features/documents/documents.api';
import { DocumentVersions } from '../../features/documents/components/DocumentVersions';

import { PageHeader } from '../../components/common/PageHeader';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export function DocumentDetailPage() {
  const { t } = useTranslation(['documents', 'common']);
  const { id } = useParams<{ id: string }>();

  if (!id) {
    // This case should ideally be handled by the router, but it's a good fallback.
    return <div>Invalid document ID.</div>;
  }

  const { data: document, isLoading, isError } = useDocument(id);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !document) {
    return (
      <div className="text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
        <h3 className="mt-4 text-lg font-medium">{t('documents:error_loading_title')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('documents:error_loading_prompt')}</p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/dashboard/documents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('documents:back_to_documents')}
          </Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <PageHeader
        title={document.filename}
        description={t('documents:detail_page_description')}
        showBackButton
        backButtonHref="/dashboard/documents"
      />
      
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Version History */}
        <div className="lg:col-span-2">
          <DocumentVersions document={document} />
        </div>

        {/* Right Column: Metadata */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{t('documents:metadata')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('documents:status')}</span>
                <Badge>{document.status}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('documents:file_type')}</span>
                <span>{document.mimeType.split('/')[1]?.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('documents:file_size')}</span>
                <span>{(document.sizeBytes / 1024 / 1024).toFixed(2)} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('documents:uploaded_on')}</span>
                <span>{format(new Date(document.createdAt), 'PP')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('documents:last_updated')}</span>
                <span>{format(new Date(document.updatedAt), 'PP')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}