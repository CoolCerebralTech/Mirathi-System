// FILE: src/features/admin/pages/AdminUsersPage.tsx (Finalized)

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Users } from 'lucide-react';
import { useDebounce } from 'use-debounce'; // A common helper hook for debouncing

import { PageHeader } from '../../../components/common/PageHeader';
import { Card, CardContent } from '../../../components/ui/Card';
import { UserTable } from '../components/UserTable';
import { UserFilters } from '../components/UserFilters';
import { UserQuery, UserRole } from '../../../types/schemas/user.schemas'; // UPGRADE: Correct import

export function AdminUsersPage() {
  const { t } = useTranslation(['admin', 'common']);

  const [filters, setFilters] = React.useState<Partial<UserQuery>>({ page: 1, limit: 10 });
  const [debouncedFilters] = useDebounce(filters, 300);

  const handlePaginationChange = (updater: any) => {
    const newState = typeof updater === 'function' ? updater({ pageIndex: (filters.page || 1) - 1, pageSize: filters.limit || 10 }) : updater;
    setFilters(prev => ({ ...prev, page: newState.pageIndex + 1, limit: newState.pageSize }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('admin:users_page_title')}
        description={t('admin:users_page_subtitle')}
        icon={<Users />}
      />
      <Card>
        <CardContent className="p-4">
          <UserFilters filters={filters} onFiltersChange={setFilters} />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <UserTable filters={debouncedFilters} onPaginationChange={handlePaginationChange} />
        </CardContent>
      </Card>
    </div>
  );
}