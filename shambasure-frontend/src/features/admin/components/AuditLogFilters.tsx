// FILE: src/features/admin/components/AuditLogFilters.tsx

import * as React from 'react';
import { Calendar, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

import { Button } from '../../../components/ui/Button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { Label } from '../../../components/ui/Label';
import type { AuditLogQuery } from '../../../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface AuditLogFiltersProps {
  filters: AuditLogQuery;
  onFiltersChange: (filters: AuditLogQuery) => void;
  onReset: () => void;
}

// ============================================================================
// COMMON AUDIT ACTIONS
// ============================================================================

const COMMON_ACTIONS = [
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DELETED',
  'WILL_CREATED',
  'WILL_UPDATED',
  'WILL_REVOKED',
  'ASSET_CREATED',
  'ASSET_UPDATED',
  'DOCUMENT_UPLOADED',
  'DOCUMENT_VERIFIED',
  'ROLE_UPDATED',
  'FAMILY_CREATED',
];

// ============================================================================
// COMPONENT
// ============================================================================

export function AuditLogFilters({ filters, onFiltersChange, onReset }: AuditLogFiltersProps) {
  const { t } = useTranslation(['admin', 'common']);

  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (filters.action) count++;
    if (filters.actorId) count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    return count;
  }, [filters]);

  const handleActionChange = (value: string) => {
    onFiltersChange({
      ...filters,
      action: value === 'all' ? undefined : value,
      page: 1,
    });
  };

  const handleActorIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      actorId: e.target.value || undefined,
      page: 1,
    });
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      startDate: value ? new Date(value).toISOString() : undefined,
      page: 1,
    });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onFiltersChange({
      ...filters,
      endDate: value ? new Date(value).toISOString() : undefined,
      page: 1,
    });
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-');
    onFiltersChange({
      ...filters,
      sortBy: sortBy as 'timestamp' | 'action',
      sortOrder: sortOrder as 'asc' | 'desc',
      page: 1,
    });
  };

  const handleClearFilters = () => {
    onReset();
  };

  return (
    <div className="space-y-4">
      {/* Primary Filters */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Action Filter */}
        <div className="space-y-2">
          <Label>{t('admin:action_type')}</Label>
          <Select
            value={filters.action || 'all'}
            onValueChange={handleActionChange}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('admin:all_actions')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin:all_actions')}</SelectItem>
              {COMMON_ACTIONS.map((action) => (
                <SelectItem key={action} value={action}>
                  {action.split('_').join(' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Actor ID Filter */}
        <div className="space-y-2">
          <Label>{t('admin:actor_id')}</Label>
          <Input
            placeholder={t('admin:enter_actor_id')}
            value={filters.actorId || ''}
            onChange={handleActorIdChange}
          />
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <Label>{t('admin:start_date')}</Label>
          <Input
            type="date"
            value={filters.startDate ? format(new Date(filters.startDate), 'yyyy-MM-dd') : ''}
            onChange={handleStartDateChange}
          />
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <Label>{t('admin:end_date')}</Label>
          <Input
            type="date"
            value={filters.endDate ? format(new Date(filters.endDate), 'yyyy-MM-dd') : ''}
            onChange={handleEndDateChange}
          />
        </div>
      </div>

      {/* Secondary Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Sort */}
        <Select
          value={`${filters.sortBy || 'timestamp'}-${filters.sortOrder || 'desc'}`}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={t('admin:sort_by')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="timestamp-desc">{t('admin:newest_first')}</SelectItem>
            <SelectItem value="timestamp-asc">{t('admin:oldest_first')}</SelectItem>
            <SelectItem value="action-asc">{t('admin:action_asc')}</SelectItem>
            <SelectItem value="action-desc">{t('admin:action_desc')}</SelectItem>
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
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">
            {t('admin:active_filters')}:
          </span>
          
          {filters.action && (
            <Badge variant="secondary" className="gap-1">
              {t('admin:action')}: {filters.action}
              <button
                onClick={() => onFiltersChange({ ...filters, action: undefined })}
                className="ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.actorId && (
            <Badge variant="secondary" className="gap-1">
              {t('admin:actor')}: {filters.actorId.slice(0, 8)}...
              <button
                onClick={() => onFiltersChange({ ...filters, actorId: undefined })}
                className="ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.startDate && (
            <Badge variant="secondary" className="gap-1">
              {t('admin:from')}: {format(new Date(filters.startDate), 'PP')}
              <button
                onClick={() => onFiltersChange({ ...filters, startDate: undefined })}
                className="ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.endDate && (
            <Badge variant="secondary" className="gap-1">
              {t('admin:to')}: {format(new Date(filters.endDate), 'PP')}
              <button
                onClick={() => onFiltersChange({ ...filters, endDate: undefined })}
                className="ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-7 px-2 text-xs"
          >
            {t('admin:clear_all')}
          </Button>
        </div>
      )}
    </div>
  );
}