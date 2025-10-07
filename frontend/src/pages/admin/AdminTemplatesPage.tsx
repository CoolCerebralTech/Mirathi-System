// FILE: src/pages/admin/AdminTemplatesPage.tsx

import { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { templateColumns } from '../../features/admin/components/TemplatesTable';
import { useTemplates } from '../../features/admin/admin.api';
import { type TemplateQuery } from '../../types';
import { Button } from '../../components/ui/Button';
import { PlusCircle } from 'lucide-react';

export function AdminTemplatesPage() {
  const [filters, setFilters] = useState<TemplateQuery>({
    page: 1,
    limit: 10,
  });

  const { data: templateData, isLoading, isError } = useTemplates(filters);

  const templates = templateData?.data || [];
  const pageCount = templateData ? Math.ceil(templateData.total / templateData.limit) : 0;

  if (isError) {
    return <div>Error loading notification templates. Please try again.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notification Templates"
        description="Manage the email and SMS templates used for system communications."
        actions={
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Template
          </Button>
        }
      />
      
      <DataTable
        columns={templateColumns}
        data={templates}
        isLoading={isLoading}
        pageCount={pageCount}
        pagination={{
            pageIndex: filters.page ? filters.page - 1 : 0,
            pageSize: filters.limit || 10,
        }}
        onPaginationChange={(updater) => {
            if (typeof updater === 'function') {
                const newPagination = updater({ pageIndex: filters.page ? filters.page - 1 : 0, pageSize: filters.limit || 10 });
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