// FILE: src/features/admin/pages/AdminLogsPage.tsx

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Download } from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { AuditLogTable } from '../components/AuditLogTable';
import { AuditLogFilters } from '../components/AuditLogFilters';
import { useExportAuditLogs } from '../auditing.api';
import { toast } from '../../../components/common/Toaster';
import { extractErrorMessage } from '../../../api/client';
import type { AuditLogQuery } from '../../../types';

// ============================================================================
// COMPONENT
// ============================================================================

export function AdminLogsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const exportMutation = useExportAuditLogs();

  const [filters, setFilters] = React.useState<AuditLogQuery>({
    page: 1,
    limit: 25,
    sortBy: 'timestamp',
    sortOrder: 'desc',
  });

  const handleFiltersChange = (newFilters: AuditLogQuery) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 25,
      sortBy: 'timestamp',
      sortOrder: 'desc',
    });
  };

  const handleExportCSV = () => {
    exportMutation.mutate(
      {
        startDate: filters.startDate,
        endDate: filters.endDate,
        action: filters.action,
        actorId: filters.actorId,
      },
      {
        onSuccess: () => {
          toast.success(t('admin:export_success'));
        },
        onError: (error) => {
          toast.error(t('common:error'), extractErrorMessage(error));
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8" />
            {t('admin:logs_page_title')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t('admin:logs_page_subtitle')}
          </p>
        </div>

        <Button
          onClick={handleExportCSV}
          disabled={exportMutation.isPending}
          isLoading={exportMutation.isPending}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {t('admin:export_csv')}
        </Button>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('admin:filters')}</CardTitle>
          <CardDescription>
            {t('admin:filter_logs_description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleResetFilters}
          />
        </CardContent>
      </Card>

      {/* Audit Logs Table Card */}
      <Card>
        <CardContent className="p-0">
          <AuditLogTable
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}