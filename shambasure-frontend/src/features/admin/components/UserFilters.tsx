// FILE: src/features/admin/components/UserFilters.tsx (Finalized)

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/Select';
import { UserQuery, UserRole } from '../../../types/schemas/user.schemas'; // UPGRADE: Corrected imports

interface UserFiltersProps {
  filters: Partial<UserQuery>;
  onFiltersChange: (filters: Partial<UserQuery>) => void;
}

export function UserFilters({ filters, onFiltersChange }: UserFiltersProps) {
  const { t } = useTranslation(['admin', 'common']);
  const [searchValue, setSearchValue] = React.useState(filters.search || '');

  // Debounced search is a great pattern
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, search: searchValue || undefined, page: 1 });
    }, 500);
    return () => clearTimeout(timer);
  }, [searchValue]);

  const handleRoleChange = (value: string) => {
    onFiltersChange({ ...filters, role: value === 'all' ? undefined : value as UserRole, page: 1 });
  };
  
  const handleReset = () => {
    setSearchValue('');
    onFiltersChange({ page: filters.page, limit: filters.limit });
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t('admin:search_users_placeholder')} value={searchValue} onChange={(e) => setSearchValue(e.target.value)} className="pl-9" />
        </div>
        <Select value={filters.role || 'all'} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin:all_roles')}</SelectItem>
            <SelectItem value="LAND_OWNER">{t('admin:role_land_owner')}</SelectItem>
            <SelectItem value="HEIR">{t('admin:role_heir')}</SelectItem>
            <SelectItem value="ADMIN">{t('admin:role_admin')}</SelectItem>
          </SelectContent>
        </Select>
        {/* UPGRADE: Removed Sort dropdown as it's not supported by the backend DTO */}
      </div>
      {(filters.role || filters.search) && (
        <div className="flex items-center gap-2 pt-2 border-t">
            <Button variant="ghost" size="sm" onClick={handleReset} className="h-7 px-2 text-xs">{t('common:clear_all')}</Button>
        </div>
      )}
    </div>
  );
}