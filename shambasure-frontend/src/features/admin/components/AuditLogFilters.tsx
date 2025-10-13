/* eslint-disable @typescript-eslint/no-explicit-any */
// FILE: src/features/admin/components/AuditLogFilters.tsx (Finalized)

import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '../../../components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/Select';
import { Label } from '../../../components/ui/Label';
import type { AuditQuery } from '../../../types';

interface AuditLogFiltersProps {
  filters: Partial<AuditQuery>;
  onFiltersChange: (filters: Partial<AuditQuery>) => void;
}

// UPGRADE: Internationalized and memoized actions
const useCommonActions = () => {
  const { t } = useTranslation('admin');
  return React.useMemo(() => [
    { value: 'USER_CREATED', label: t('audit_actions.user_created') },
    { value: 'USER_UPDATED', label: t('audit_actions.user_updated') },
    { value: 'WILL_CREATED', label: t('audit_actions.will_created') },
    { value: 'DOCUMENT_UPLOADED', label: t('audit_actions.document_uploaded') },
    { value: 'DOCUMENT_VERIFIED', label: t('audit_actions.document_verified') },
  ], [t]);
};

export function AuditLogFilters({ filters, onFiltersChange }: AuditLogFiltersProps) {
  const { t } = useTranslation(['admin', 'common']);
  const COMMON_ACTIONS = useCommonActions();

  const handleFilterChange = (key: keyof AuditQuery, value: any) => {
    onFiltersChange({ ...filters, [key]: value || undefined, page: 1 });
  };
  
  const handleReset = () => {
    onFiltersChange({ page: filters.page, limit: filters.limit });
  }

  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined && !['page', 'limit'].includes(Object.keys(filters).find(k => filters[k as keyof AuditQuery] === v)!)).length;

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Action Filter */}
        <div className="space-y-1">
          <Label>{t('admin:action_type')}</Label>
          <Select value={filters.action || 'all'} onValueChange={(val) => handleFilterChange('action', val === 'all' ? undefined : val)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin:all_actions')}</SelectItem>
              {COMMON_ACTIONS.map((action) => <SelectItem key={action.value} value={action.value}>{action.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Actor ID & Date Filters (Your implementation is good) */}
        {/* ... */}
      </div>
      
      {/* UPGRADE: Removed unsupported Sort control */}
      
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t">
            {/* ... Your active filter badges are a great UX, no changes needed ... */}
            <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 px-2 text-xs">{t('common:clear_all')}</Button>
        </div>
      )}
    </div>
  );
}