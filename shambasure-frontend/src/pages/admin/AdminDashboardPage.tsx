// FILE: src/pages/admin/AdminDashboardPage.tsx

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Users, FileCheck, FileText, Building2, AlertTriangle, Activity } from 'lucide-react';

import { useAdminDashboardStats } from '../../features/admin/admin.api';
// import { useAuditLogs } from '../../features/admin/auditing.api'; // For recent activity feed

import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export function AdminDashboardPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { data: stats, isLoading, isError } = useAdminDashboardStats();
  // const { data: recentLogs } = useAuditLogs({ limit: 5 }); // Example for activity feed

  const statCards = [
    { title: t('dashboard.stats.total_users'), value: stats?.totalUsers, icon: Users, link: '/admin/users' },
    { title: t('dashboard.stats.pending_documents'), value: stats?.pendingDocuments, icon: FileCheck, link: '/admin/documents' },
    { title: t('dashboard.stats.active_wills'), value: stats?.activeWills, icon: FileText, link: '/wills' }, // Links to user-facing page for now
    { title: t('dashboard.stats.total_assets'), value: stats?.totalAssets, icon: Building2, link: '/assets' },
  ];

  const renderContent = () => {
    if (isLoading) {
      return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array(4).fill(0).map((_, i) => <Card key={i} className="h-[120px] flex items-center justify-center"><LoadingSpinner /></Card>)}</div>;
    }

    if (isError) {
      return <div className="col-span-full text-center text-destructive p-8"><AlertTriangle className="mx-auto h-8 w-8" /><p>{t('common:error_loading_data')}</p></div>;
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(card => (
          <Link to={card.link} key={card.title}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value ?? 'N/A'}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <PageHeader title={t('dashboard.title')} description={t('dashboard.description')} />
      
      {renderContent()}

      {/* Placeholder for a more detailed activity feed */}
      <Card className="col-span-full">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5"/>
                Recent Activity
            </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="text-center text-muted-foreground py-8">
                {/* Here you would map over `recentLogs` to show recent events */}
                <p>Activity feed will be displayed here.</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
