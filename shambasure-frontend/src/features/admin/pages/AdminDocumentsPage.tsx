// FILE: src/features/admin/pages/AdminDocumentsPage.tsx (Finalized)

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FileCheck } from 'lucide-react';

import { PageHeader } from '../../../components/common/PageHeader';
import { Card, CardContent } from '../../../components/ui/Card';
import { DocumentsTable } from '../components/DocumentsTable';
import { DocumentFilters } from '../components/DocumentFilters';
import { DocumentQuery } from '../../../types/schemas/documents.schemas'; // UPGRADE: Correct import

export function AdminDocumentsPage() {
  const { t } = useTranslation(['admin', 'common']);

  const [filters, setFilters] = React.useState<Partial<DocumentQuery>>({ page: 1, limit: 10 });

  const handlePaginationChange = (updater: any) => {
    const newState = typeof updater === 'function' ? updater({ pageIndex: (filters.page || 1) - 1, pageSize: filters.limit || 10 }) : updater;
    setFilters(prev => ({ ...prev, page: newState.pageIndex + 1, limit: newState.pageSize }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('admin:documents_page_title')}
        description={t('admin:documents_page_subtitle')}
        icon={<FileCheck />}
      />
      <Card>
        <CardContent className="p-4">
          <DocumentFilters filters={filters} onFiltersChange={setFilters} />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <DocumentsTable filters={filters} onPaginationChange={handlePaginationChange} />
        </CardContent>
      </Card>
    </div>
  );
}