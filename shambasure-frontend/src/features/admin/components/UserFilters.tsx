// FILE: src/features/admin/components/UserFilters.tsx

import * as React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import type { UserRole } from '../../../types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface UserFiltersProps {
  filters: {
    search?: string;
    role?: UserRole;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
  onFiltersChange: (filters: any) => void;
  onReset: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function UserFilters({ filters, onFiltersChange, onReset }: UserFiltersProps) {
  const { t } = useTranslation(['admin', 'common']);
  const [searchValue, setSearchValue] = React.useState(filters.search || '');

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onFiltersChange({ ...filters, search: searchValue, page: 1 });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.role) count++;
    return count;
  }, [filters]);

  const handleRoleChange = (value: string) => {
    onFiltersChange({
      ...filters,
      role: value === 'all' ? undefined : value,
      page: 1,
    });
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-');
    onFiltersChange({
      ...filters,
      sortBy,
      sortOrder,
      page: 1,
    });
  };

  const handleClearFilters = () => {
    setSearchValue('');
    onReset();
  };

  return (
    <div className="space-y-4">
      {/* Search and Primary Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('admin:search_users_placeholder')}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchValue && (
            <button
              onClick={() => setSearchValue('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Role Filter */}
        <Select
          value={filters.role || 'all'}
          onValueChange={handleRoleChange}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t('admin:filter_by_role')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin:all_roles')}</SelectItem>
            <SelectItem value="LAND_OWNER">{t('admin:role_land_owner')}</SelectItem>
            <SelectItem value="HEIR">{t('admin:role_heir')}</SelectItem>
            <SelectItem value="ADMIN">{t('admin:role_admin')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={`${filters.sortBy || 'createdAt'}-${filters.sortOrder || 'desc'}`}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t('admin:sort_by')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt-desc">{t('admin:newest_first')}</SelectItem>
            <SelectItem value="createdAt-asc">{t('admin:oldest_first')}</SelectItem>
            <SelectItem value="email-asc">{t('admin:email_asc')}</SelectItem>
            <SelectItem value="email-desc">{t('admin:email_desc')}</SelectItem>
            <SelectItem value="firstName-asc">{t('admin:name_asc')}</SelectItem>
            <SelectItem value="firstName-desc">{t('admin:name_desc')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t('admin:active_filters')}:
          </span>
          
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              {t('admin:search')}: {filters.search}
              <button
                onClick={() => {
                  setSearchValue('');
                  onFiltersChange({ ...filters, search: undefined });
                }}
                className="ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.role && (
            <Badge variant="secondary" className="gap-1">
              {t('admin:role')}: {filters.role}
              <button
                onClick={() => onFiltersChange({ ...filters, role: undefined })}
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