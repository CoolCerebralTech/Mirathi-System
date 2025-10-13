// FILE: src/features/admin/components/DocumentFilters.tsx (Finalized)

import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../../components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/Select';
import { DocumentQuery, DocumentStatus } from '../../../types/schemas/documents.schemas'; // UPGRADE: Corrected imports

interface DocumentFiltersProps {
  filters: Partial<DocumentQuery>;
  onFiltersChange: (filters: Partial<DocumentQuery>) => void;
}

export function DocumentFilters({ filters, onFiltersChange }: DocumentFiltersProps) {
  const { t } = useTranslation(['admin', 'common']);

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === 'all' ? undefined : (value as DocumentStatus),
      page: 1,
    });
  };
  
  const handleReset = () => {
    onFiltersChange({ page: filters.page, limit: filters.limit });
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center rounded-lg border p-4">
      {/* Status Filter */}
      <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-full sm:w-[200px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('admin:all_statuses')}</SelectItem>
          <SelectItem value="PENDING_VERIFICATION">{t('admin:status_pending')}</SelectItem>
          <SelectItem value="VERIFIED">{t('admin:status_verified')}</SelectItem>
          <SelectItem value="REJECTED">{t('admin:status_rejected')}</SelectItem>
        </SelectContent>
      </Select>

      {/* UPGRADE: Removed unsupported Sort and Per Page controls. Pagination is handled by the table. */}
      
      {(filters.status) && (
        <Button variant="ghost" size="sm" onClick={handleReset} className="h-9">
          {t('common:clear_filters')}
        </Button>
      )}
    </div>
  );
}