// FILE: src/features/admin/pages/AdminLogsPage.tsx (Finalized)

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Download } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { AuditLogTable } from '../components/AuditLogTable';
import { AuditLogFilters } from '../components/AuditLogFilters';
import { useExportAuditCsv } from '../auditing.api';
import { AuditQuery } from '../../../types/schemas/auditing.schemas'; // UPGRADE: Correct import

export function AdminLogsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const exportMutation = useExportAuditCsv();

  const [filters, setFilters] = React.useState<Partial<AuditQuery>>({ page: 1, limit: 25 });
  
  const handlePaginationChange = (updater: any) => { /* ... implementation ... */ };

  const handleExport = () => {
    exportMutation.mutate({ startDate: filters.startDate, endDate: filters.endDate }, {
      onSuccess: () => toast.success(t('admin:export_success')),
      onError: (err) => toast.error(t('common:error'), { description: err.message }),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('admin:logs_page_title')} description={t('admin:logs_page_subtitle')} icon={<Activity />}>
        <Button onClick={handleExport} isLoading={exportMutation.isPending}><Download className="mr-2 h-4 w-4" />{t('admin:export_csv')}</Button>
      </PageHeader>
      <Card>
        <CardContent className="p-4">
          <AuditLogFilters filters={filters} onFiltersChange={setFilters} />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <AuditLogTable filters={filters} onPaginationChange={handlePaginationChange} />
        </CardContent>
      </Card>
    </div>
  );
}