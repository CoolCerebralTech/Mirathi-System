// FILE: src/features/admin/components/DashboardStats.tsx (Finalized)

import * as React from 'react';
import { Users, FileText, Building2, Files, FileCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MetricCard } from './MetricCard'; // Assuming MetricCard is a presentational component

// UPGRADE: Placeholder hooks until the backend endpoints are available.
const useAdminStats = () => ({ data: { totalUsers: 138, totalWills: 42, totalAssets: 217, totalFamilies: 73 }, isLoading: false });
const usePendingDocumentsCount = () => ({ data: { count: 12 }, isLoading: false });

export function DashboardStats() {
  const { t } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: pendingDocs, isLoading: pendingDocsLoading } = usePendingDocumentsCount();

  const isLoading = statsLoading || pendingDocsLoading;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <MetricCard
        title={t('admin:total_users')}
        value={stats?.totalUsers.toLocaleString() ?? '...'}
        icon={Users}
        isLoading={isLoading}
        onClick={() => navigate('/dashboard/admin/users')} // UPGRADE: Corrected path
      />
      <MetricCard
        title={t('admin:total_wills')}
        value={stats?.totalWills.toLocaleString() ?? '...'}
        icon={FileText}
        isLoading={isLoading}
        onClick={() => navigate('/dashboard/wills')} // Non-admin page for now
      />
      <MetricCard
        title={t('admin:total_assets')}
        value={stats?.totalAssets.toLocaleString() ?? '...'}
        icon={Building2}
        isLoading={isLoading}
        onClick={() => navigate('/dashboard/assets')} // Non-admin page for now
      />
      <MetricCard
        title={t('admin:total_families')}
        value={stats?.totalFamilies.toLocaleString() ?? '...'}
        icon={Files}
        isLoading={isLoading}
        onClick={() => navigate('/dashboard/families')} // Non-admin page for now
      />
      <MetricCard
        title={t('admin:pending_documents')}
        value={pendingDocs?.count.toLocaleString() ?? '...'}
        icon={FileCheck}
        isLoading={isLoading}
        onClick={() => navigate('/dashboard/admin/documents?status=PENDING_VERIFICATION')} // UPGRADE: Corrected path
        trendLabel={pendingDocs?.count && pendingDocs.count > 0 ? t('admin:needs_review') : undefined}
      />
    </div>
  );
}