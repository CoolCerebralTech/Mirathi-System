// FILE: src/features/admin/components/DashboardStats.tsx

import * as React from 'react';
import { Users, FileText, Building2, Files, FileCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MetricCard } from './MetricCard';
import { useAdminStats } from '../admin.api';
import { usePendingDocumentsCount } from '../admin-documents.api';

// ============================================================================
// COMPONENT
// ============================================================================

export function DashboardStats() {
  const { t } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const { data: stats, isLoading } = useAdminStats();
  const { data: pendingDocs } = usePendingDocumentsCount();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {/* Total Users */}
      <MetricCard
        title={t('admin:total_users')}
        value={stats?.totalUsers.toLocaleString() || '0'}
        icon={Users}
        isLoading={isLoading}
        onClick={() => navigate('/admin/users')}
      />

      {/* Total Wills */}
      <MetricCard
        title={t('admin:total_wills')}
        value={stats?.totalWills.toLocaleString() || '0'}
        icon={FileText}
        isLoading={isLoading}
        onClick={() => navigate('/admin/wills')}
      />

      {/* Total Assets */}
      <MetricCard
        title={t('admin:total_assets')}
        value={stats?.totalAssets.toLocaleString() || '0'}
        icon={Building2}
        isLoading={isLoading}
        onClick={() => navigate('/admin/assets')}
      />

      {/* Total Families */}
      <MetricCard
        title={t('admin:total_families')}
        value={stats?.totalFamilies.toLocaleString() || '0'}
        icon={Files}
        isLoading={isLoading}
        onClick={() => navigate('/admin/families')}
      />

      {/* Pending Documents */}
      <MetricCard
        title={t('admin:pending_documents')}
        value={pendingDocs?.count.toLocaleString() || '0'}
        icon={FileCheck}
        isLoading={!pendingDocs}
        onClick={() => navigate('/admin/documents?status=PENDING_VERIFICATION')}
        trend={
          pendingDocs?.count && pendingDocs.count > 0
            ? {
                value: pendingDocs.count,
                isPositive: false,
                label: t('admin:needs_review'),
              }
            : undefined
        }
      />
    </div>
  );
}