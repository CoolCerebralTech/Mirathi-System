// FILE: src/pages/admin/AdminAuditLogsPage.tsx

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AlertTriangle, ListChecks, Download, Filter } from 'lucide-react';

import { useAuditLogs, useExportAuditCsv } from '../../features/admin/auditing.api';
import { getAuditLogsTableColumns } from '../../features/admin/components/AuditLogsTable';
import type { AuditQuery } from '../../types';
import { extractErrorMessage } from '../../api/client';

import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';
import { Separator } from '../../components/ui/Separator';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// FILTER BAR COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

interface FilterBarProps {
  filters: AuditQuery;
  onChange: (filters: AuditQuery) => void;
}

function FilterBar({ filters, onChange }: FilterBarProps) {
  const { t } = useTranslation(['admin', 'common']);

  // Local string state for <input type="date">
  const [startDateStr, setStartDateStr] = React.useState(
    filters.startDate ? filters.startDate.toISOString().substring(0, 10) : ''
  );
  const [endDateStr, setEndDateStr] = React.useState(
    filters.endDate ? filters.endDate.toISOString().substring(0, 10) : ''
  );

  const applyFilters = () => {
    onChange({
      ...filters,
      startDate: startDateStr ? new Date(startDateStr) : undefined,
      endDate: endDateStr ? new Date(endDateStr) : undefined,
    });
  };

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
        <div className="flex flex-col space-y-1">
          <Label htmlFor="startDate">{t('auditing.start_date')}</Label>
          <Input
            id="startDate"
            type="date"
            value={startDateStr}
            onChange={(e) => setStartDateStr(e.target.value)}
          />
        </div>
        <div className="flex flex-col space-y-1">
          <Label htmlFor="endDate">{t('auditing.end_date')}</Label>
          <Input
            id="endDate"
            type="date"
            value={endDateStr}
            onChange={(e) => setEndDateStr(e.target.value)}
          />
        </div>
        <Button onClick={applyFilters} className="sm:self-end">
          <Filter className="mr-2 h-4 w-4" />
          {t('common:apply_filters')}
        </Button>
      </div>
      <Separator />
      <p className="text-xs text-muted-foreground">
        {t('auditing.filter_hint')}
      </p>
    </div>
  );
}

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// MAIN PAGE
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export function AdminAuditLogsPage() {
  const { t } = useTranslation(['admin', 'common']);

  const [filters, setFilters] = React.useState<AuditQuery>({});

  const auditLogsQuery = useAuditLogs(filters);
  const { mutate: exportCsv, isPending: isExporting } = useExportAuditCsv();

  const columns = React.useMemo(() => getAuditLogsTableColumns(t), [t]);

  const handleExport = () => {
    const { startDate, endDate } = filters;
    exportCsv(
      { startDate, endDate },
      {
        onError: (err) =>
          toast.error(t('auditing.export_failed'), {
            description: extractErrorMessage(err),
          }),
      },
    );
  };

  const renderContent = () => {
    if (auditLogsQuery.isLoading) {
      return (
        <div className="flex h-96 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      );
    }

    if (auditLogsQuery.isError) {
      return (
        <div className="flex h-96 flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 text-destructive p-8">
          <AlertTriangle className="h-12 w-12" />
          <p className="mt-4 font-semibold">
            {t('common:error_loading_data')}
          </p>
        </div>
      );
    }

    const logs = auditLogsQuery.data?.data ?? [];
    if (logs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 text-center">
          <ListChecks className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">
            {t('auditing.no_logs_title')}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('auditing.no_logs_description')}
          </p>
        </div>
      );
    }

    return <DataTable columns={columns} data={logs} />;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('auditing.title')}
        description={t('auditing.description')}
        actions={
          <Button onClick={handleExport} isLoading={isExporting}>
            <Download className="mr-2 h-4 w-4" />
            {t('auditing.export_csv')}
          </Button>
        }
      />

      <FilterBar filters={filters} onChange={setFilters} />

      <div className="rounded-lg border">{renderContent()}</div>
    </div>
  );
}
