// FILE: src/features/admin/components/DocumentFilters.tsx

import * as React from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../../components/ui/Button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import type { DocumentQuery, DocumentStatus } from '../../../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface DocumentFiltersProps {
  filters: DocumentQuery;
  onFiltersChange: (filters: DocumentQuery) => void;
  onReset: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DocumentFilters({ filters, onFiltersChange, onReset }: DocumentFiltersProps) {
  const { t } = useTranslation(['admin', 'common']);

  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (filters.status) count++;
    return count;
  }, [filters]);

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === 'all' ? undefined : (value as DocumentStatus),
      page: 1,
    });
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-');
    onFiltersChange({
      ...filters,
      sortBy: sortBy as 'createdAt' | 'filename' | 'status',
      sortOrder: sortOrder as 'asc' | 'desc',
      page: 1,
    });
  };

  return (
    <div className="space-y-4">
      {/* Primary Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Status Filter */}
        <Select
          value={filters.status || 'all'}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={t('admin:filter_by_status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin:all_statuses')}</SelectItem>
            <SelectItem value="PENDING_VERIFICATION">{t('admin:pending')}</SelectItem>
            <SelectItem value="VERIFIED">{t('admin:verified')}</SelectItem>
            <SelectItem value="REJECTED">{t('admin:rejected')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={`${filters.sortBy || 'createdAt'}-${filters.sortOrder || 'desc'}`}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={t('admin:sort_by')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt-desc">{t('admin:newest_first')}</SelectItem>
            <SelectItem value="createdAt-asc">{t('admin:oldest_first')}</SelectItem>
            <SelectItem value="filename-asc">{t('admin:filename_asc')}</SelectItem>
            <SelectItem value="filename-desc">{t('admin:filename_desc')}</SelectItem>
            <SelectItem value="status-asc">{t('admin:status_asc')}</SelectItem>
            <SelectItem value="status-desc">{t('admin:status_desc')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Results per page */}
        <Select
          value={String(filters.limit)}
          onValueChange={(value) => onFiltersChange({ ...filters, limit: Number(value), page: 1 })}
        >
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 {t('admin:per_page')}</SelectItem>
            <SelectItem value="25">25 {t('admin:per_page')}</SelectItem>
            <SelectItem value="50">50 {t('admin:per_page')}</SelectItem>
            <SelectItem value="100">100 {t('admin:per_page')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t('admin:active_filters')}:
          </span>
          
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              {t('admin:status')}: {filters.status}
              <button
                onClick={() => onFiltersChange({ ...filters, status: undefined })}
                className="ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 px-2 text-xs"
          >
            {t('admin:clear_all')}
          </Button>
        </div>
      )}
    </div>
  );
}