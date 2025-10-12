// FILE: src/features/admin/pages/AdminDashboardPage.tsx

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  FileCheck, 
  Activity, 
  Settings,
  Bell,
} from 'lucide-react';

import { useCurrentUser } from '../../../store/auth.store';
import { useAuditLogs } from '../auditing.api';

import { DashboardStats } from '../components/DashboardStats';
import { ActivityTimeline } from '../components/ActivityTimeline';
import { QuickActionCard } from '../components/QuickActionCard';

// ============================================================================
// COMPONENT
// ============================================================================

export function AdminDashboardPage() {
  const { t } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const user = useCurrentUser();

  // Fetch recent audit logs for activity timeline
  const { data: auditLogsData, isLoading: isLoadingLogs } = useAuditLogs({
    page: 1,
    limit: 10,
    sortBy: 'timestamp',
    sortOrder: 'desc',
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('admin:welcome_back', { name: user?.firstName || 'Admin' })}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t('admin:dashboard_subtitle')}
        </p>
      </div>

      {/* Stats Grid */}
      <DashboardStats />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity (2 columns) */}
        <div className="lg:col-span-2">
          <ActivityTimeline
            activities={auditLogsData?.data || []}
            isLoading={isLoadingLogs}
            maxItems={8}
            onViewAll={() => navigate('/admin/logs')}
          />
        </div>

        {/* Quick Actions (1 column) */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t('admin:quick_actions')}</h2>

          <QuickActionCard
            title={t('admin:manage_users')}
            description={t('admin:manage_users_desc')}
            icon={Users}
            iconColor="text-emerald-700"
            iconBgColor="bg-emerald-100"
            onClick={() => navigate('/admin/users')}
          />

          <QuickActionCard
            title={t('admin:review_documents')}
            description={t('admin:review_documents_desc')}
            icon={FileCheck}
            iconColor="text-blue-700"
            iconBgColor="bg-blue-100"
            onClick={() => navigate('/admin/documents')}
          />

          <QuickActionCard
            title={t('admin:view_audit_logs')}
            description={t('admin:view_audit_logs_desc')}
            icon={Activity}
            iconColor="text-purple-700"
            iconBgColor="bg-purple-100"
            onClick={() => navigate('/admin/logs')}
          />

          <QuickActionCard
            title={t('admin:notification_templates')}
            description={t('admin:notification_templates_desc')}
            icon={Bell}
            iconColor="text-amber-700"
            iconBgColor="bg-amber-100"
            onClick={() => navigate('/admin/templates')}
          />

          <QuickActionCard
            title={t('admin:system_settings')}
            description={t('admin:system_settings_desc')}
            icon={Settings}
            iconColor="text-slate-700"
            iconBgColor="bg-slate-100"
            onClick={() => navigate('/admin/settings')}
          />
        </div>
      </div>
    </div>
  );
}