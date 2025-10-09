// FILE: src/pages/admin/AdminAuditLogsPage.tsx

import { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { auditLogColumns } from '../../features/admin/components/AuditLogTable';
import { useAuditLogs, useExportAuditLogs } from '../../features/admin/admin.api';
import { type AuditLogQuery } from '../../types';
import { Button } from '../../components/ui/Button';
import { Download } from 'lucide-react';

export function AdminAuditLogsPage() {
  // State for managing pagination and filters
  const [filters, setFilters] = useState<AuditLogQuery>({
    page: 1,
    limit: 15,
  });

  // Fetch data using our hook and the current filters
  const { data: auditData, isLoading, isError } = useAuditLogs(filters);
  const exportMutation = useExportAuditLogs();

  const handleExport = () => {
    // A real implementation would use date pickers to set these values
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Default to last 30 days

    exportMutation.mutate({
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
    });
  };

  const logs = auditData?.data || [];
  const pageCount = auditData ? Math.ceil(auditData.total / auditData.limit) : 0;

  if (isError) {
    return <div>Error loading audit logs. Please try again.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="A detailed log of all significant events that have occurred in the system."
        actions={
            <Button onClick={handleExport} disabled={exportMutation.isLoading}>
                <Download className="mr-2 h-4 w-4" />
                {exportMutation.isLoading ? 'Exporting...' : 'Export CSV'}
            </Button>
        }
      />

      {/* We can add filter controls here later (e.g., DatePicker, UserSelector) */}
      
      <DataTable
        columns={auditLogColumns}
        data={logs}
        isLoading={isLoading}
        pageCount={pageCount}
        pagination={{
            pageIndex: filters.page ? filters.page - 1 : 0,
            pageSize: filters.limit || 15,
        }}
        onPaginationChange={(updater) => {
            if (typeof updater === 'function') {
                const newPagination = updater({ pageIndex: filters.page ? filters.page - 1 : 0, pageSize: filters.limit || 15 });
                setFilters(prev => ({
                    ...prev,
                    page: newPagination.pageIndex + 1,
                    limit: newPagination.pageSize,
                }));
            }
        }}
      />
    </div>
  );
}