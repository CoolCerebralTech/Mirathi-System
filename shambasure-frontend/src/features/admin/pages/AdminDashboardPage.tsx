// FILE: src/features/admin/pages/AdminDashboardPage.tsx (Finalized)

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCurrentUser } from '../../../store/auth.store';
import { useAuditLogs } from '../auditing.api';

import { DashboardStats } from '../components/DashboardStats';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { formatDistanceToNow } from 'date-fns';
import { AuditLog } from '../../../types/schemas/auditing.schemas';

// A simple presentational component for recent activity
function RecentActivity({ logs, isLoading }: { logs?: AuditLog[], isLoading: boolean }) {
  const { t } = useTranslation('admin');
  return (
    <Card>
      <CardHeader><CardTitle>{t('admin:recent_activity')}</CardTitle></CardHeader>
      <CardContent>
        {isLoading && <div>Loading...</div>}
        <ul className="space-y-4">
          {logs?.map(log => (
            <li key={log.id} className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs">
                {log.actor?.firstName.charAt(0)}{log.actor?.lastName.charAt(0)}
              </div>
              <div>
                <p className="text-sm">
                  <span className="font-medium">{log.actor?.email ?? t('admin:system')}</span> {t('audit_actions.performed')} <span className="font-medium">{log.action}</span>.
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function AdminDashboardPage() {
  const { t } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const user = useCurrentUser();

  // UPGRADE: `useAuditLogs` is paginated, so we get logs from `data.logs`
  const { data: auditLogData, isLoading: isLoadingLogs } = useAuditLogs({ page: 1, limit: 7 });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('admin:welcome_back', { name: user?.firstName || 'Admin' })}
        description={t('admin:dashboard_subtitle')}
      />

      <DashboardStats />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivity logs={auditLogData?.logs} isLoading={isLoadingLogs} />
        </div>
        <div className="space-y-2">
           {/* Quick Actions (Your implementation is great) */}
           {/* UPGRADE: Corrected navigation paths */}
           <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/dashboard/admin/users')}>{t('admin:manage_users')}</Button>
           <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/dashboard/admin/documents')}>{t('admin:review_documents')}</Button>
           <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/dashboard/admin/logs')}>{t('admin:view_audit_logs')}</Button>
           <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/dashboard/admin/templates')}>{t('admin:notification_templates')}</Button>
        </div>
      </div>
    </div>
  );
}