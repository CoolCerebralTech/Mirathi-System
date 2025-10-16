// FILE: src/pages/DashboardHomePage.tsx

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  FileText,
  Users,
  FileCheck,
  TrendingUp,
  CheckCircle2,
  LifeBuoy,
} from 'lucide-react';

import { useCurrentUser } from '../store/auth.store';
import { useAssets } from '../features/assets/assets.api';
import { useWills } from '../features/wills/wills.api';
import { useFamilyTree } from '../features/families/families.api';
import { useDocuments } from '../features/documents/documents.api';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Progress } from '../components/ui/Progress';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

/**
 * The main dashboard page, serving as the user's home screen after logging in.
 * It provides a summary of their data, quick actions, and onboarding guidance.
 */
export function DashboardHomePage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const navigate = useNavigate();
  const user = useCurrentUser();

  // Fetch metadata for all key features
  const { data: assetsData } = useAssets({ limit: 1 });
  const { data: willsData } = useWills({ limit: 1 });
  const { data: familyData } = useFamilyTree();
  const { data: documentsData } = useDocuments({ limit: 1 });

  const stats = {
    assets: assetsData?.meta?.total ?? 0,
    wills: willsData?.meta?.total ?? 0,
    families: familyData?.edges?.length ?? 0,
    documents: documentsData?.meta?.total ?? 0,
  };

  const completionSteps = React.useMemo(() => [
    { done: stats.assets > 0, label: t('onboarding.add_assets'), action: () => navigate('/assets') },
    { done: stats.families > 0, label: t('onboarding.add_family'), action: () => navigate('/families') },
    { done: stats.documents > 0, label: t('onboarding.upload_documents'), action: () => navigate('/documents') },
    { done: stats.wills > 0, label: t('onboarding.create_will'), action: () => navigate('/wills') },
  ], [stats.assets, stats.families, stats.documents, stats.wills, t, navigate]);

  const completedSteps = completionSteps.filter(step => step.done).length;
  const completionPercentage = (completedSteps / completionSteps.length) * 100;

  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greetings.morning');
    if (hour < 18) return t('greetings.afternoon');
    return t('greetings.evening');
  }, [t]);

  const statCards = [
    { title: t('stats.total_assets'), value: stats.assets, icon: Building2, link: '/assets' },
    { title: t('stats.total_wills'), value: stats.wills, icon: FileText, link: '/wills' },
    { title: t('stats.family_members'), value: stats.families, icon: Users, link: '/families' },
    { title: t('stats.secure_documents'), value: stats.documents, icon: FileCheck, link: '/documents' },
  ];

  const quickActions = [
    { title: t('actions.add_asset'), description: t('actions.add_asset_desc'), icon: Building2, action: () => navigate('/assets') },
    { title: t('actions.create_will'), description: t('actions.create_will_desc'), icon: FileText, action: () => navigate('/wills') },
    { title: t('actions.add_family'), description: t('actions.add_family_desc'), icon: Users, action: () => navigate('/families') },
    { title: t('actions.upload_document'), description: t('actions.upload_document_desc'), icon: FileCheck, action: () => navigate('/documents') },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {greeting}, {user?.firstName}! 👋
        </h1>
        <p className="mt-1 text-muted-foreground">{t('welcome_subtitle')}</p>
      </div>

      {completionPercentage < 100 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('onboarding.title')}
            </CardTitle>
            <CardDescription>
              {t('onboarding.steps_completed', { done: completedSteps, total: completionSteps.length })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={completionPercentage} className="h-2" />
            <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
              {completionSteps.map((step, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {step.done ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className={step.done ? 'text-muted-foreground line-through' : 'text-foreground font-medium'}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(card => (
          <Card 
            key={card.title} 
            className="cursor-pointer transition-shadow hover:shadow-md" 
            onClick={() => navigate(card.link)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('actions.title')}</CardTitle>
            <CardDescription>{t('actions.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {quickActions.map(action => (
              <Button 
                key={action.title} 
                variant="outline" 
                className="h-auto flex-col items-start gap-2 p-4 text-left" 
                onClick={action.action}
              >
                <action.icon className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-semibold">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('resources.title')}</CardTitle>
            <CardDescription>{t('resources.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full justify-start h-auto p-4 gap-4">
              <LifeBuoy className="h-6 w-6 text-primary" />
              <div className="text-left">
                <div className="font-semibold">{t('resources.help_title')}</div>
                <p className="text-sm text-muted-foreground">{t('resources.help_desc')}</p>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
