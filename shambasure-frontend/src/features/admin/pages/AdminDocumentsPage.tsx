// FILE: src/features/admin/pages/AdminDocumentsPage.tsx

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FileCheck, AlertCircle } from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/Alert';
import { DocumentsTable } from '../components/DocumentsTable';
import { DocumentFilters } from '../components/DocumentFilters';
import { usePendingDocumentsCount } from '../admin-documents.api';
import type { Document, DocumentQuery } from '../../../types';

// ============================================================================
// COMPONENT
// ============================================================================

export function AdminDocumentsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { data: pendingCount } = usePendingDocumentsCount();

  const [filters, setFilters] = React.useState<DocumentQuery>({
    page: 1,
    limit: 25,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const handleFiltersChange = (newFilters: DocumentQuery) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 25,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  const handleShowPending = () => {
    setFilters({
      ...filters,
      status: 'PENDING_VERIFICATION',
      page: 1,
    });
  };

  const handleViewDocument = (document: Document) => {
    // TODO: Open document details modal/drawer
    console.log('View document:', document);
  };

  return (
    <div className="space-y-6">
      {/* Pending Documents Alert */}
      {pendingCount && pendingCount.count > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('admin:pending_documents_alert_title')}</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              {t('admin:pending_documents_alert_description', { count: pendingCount.count })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowPending}
            >
              {t('admin:review_now')}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('admin:filters')}</CardTitle>
          <CardDescription>
            {t('admin:filter_documents_description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleResetFilters}
          />
        </CardContent>
      </Card>

      {/* Documents Table Card */}
      <Card>
        <CardContent className="p-0">
          <DocumentsTable
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onViewDocument={handleViewDocument}
          />
        </CardContent>
      </Card>
    </div>
  );
}/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileCheck className="h-8 w-8" />
            {t('admin:documents_page_title')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t('admin:documents_page_subtitle')}
          </p>
        </div>
      </div>

      {