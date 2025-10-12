// FILE: src/features/admin/pages/AdminUsersPage.tsx

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Download, UserPlus } from 'lucide-react';

import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { UserTable } from '../components/UserTable';
import { UserFilters } from '../components/UserFilters';
import type { User, UserRole } from '../../../types';

// ============================================================================
// COMPONENT
// ============================================================================

export function AdminUsersPage() {
  const { t } = useTranslation(['admin', 'common']);

  const [filters, setFilters] = React.useState({
    page: 1,
    limit: 10,
    search: undefined as string | undefined,
    role: undefined as UserRole | undefined,
    sortBy: 'createdAt' as string,
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: undefined,
      role: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  const handleExportCSV = () => {
    // TODO: Implement CSV export
    console.log('Export CSV with filters:', filters);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    // TODO: Open user details modal/drawer
    console.log('View user:', user);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8" />
            {t('admin:users_page_title')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t('admin:users_page_subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {t('admin:export_csv')}
          </Button>
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            {t('admin:add_user')}
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('admin:filters')}</CardTitle>
          <CardDescription>
            {t('admin:filter_users_description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleResetFilters}
          />
        </CardContent>
      </Card>

      {/* Users Table Card */}
      <Card>
        <CardContent className="p-0">
          <UserTable
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onViewUser={handleViewUser}
          />
        </CardContent>
      </Card>
    </div>
  );
}