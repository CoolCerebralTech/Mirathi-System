// FILE: src/pages/DashboardHomePage.tsx

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Plus, 
  Building2, 
  FileText, 
  Users, 
  FileCheck,
  ArrowRight,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';

import { useCurrentUser } from '../store/auth.store';
import { useAssets } from '../features/assets/assets.api';
import { useWills } from '../features/wills/wills.api';
import { useFamilies } from '../features/families/families.api';
import { useDocuments } from '../features/documents/documents.api';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';
import { Separator } from '../components/ui/Separator';

// ============================================================================
// COMPONENT
// ============================================================================

export function DashboardHomePage() {
  const { t } = useTranslation(['dashboard', 'common']);
  const navigate = useNavigate();
  const user = useCurrentUser();

  // Fetch data for stats
  const { data: assetsData } = useAssets({ limit: 1 });
  const { data: willsData } = useWills({ limit: 1 });
  const { data: familiesData } = useFamilies({ limit: 1 });
  const { data: documentsData } = useDocuments({ limit: 1 });

  // Calculate stats
  const stats = {
    assets: assetsData?.total || 0,
    wills: willsData?.total || 0,
    families: familiesData?.total || 0,
    documents: documentsData?.total || 0,
  };

  // Calculate completion percentage
  const completionSteps = [
    { done: stats.assets > 0, label: t('dashboard:add_assets') },
    { done: stats.families > 0, label: t('dashboard:create_family') },
    { done: stats.wills > 0, label: t('dashboard:create_will') },
    { done: stats.documents > 0, label: t('dashboard:upload_documents') },
  ];

  const completedSteps = completionSteps.filter(step => step.done).length;
  const completionPercentage = (completedSteps / completionSteps.length) * 100;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard:good_morning');
    if (hour < 18) return t('dashboard:good_afternoon');
    return t('dashboard:good_evening');
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {greeting()}, {user?.firstName}! 👋
        </h1>
        <p className="mt-1 text-muted-foreground">
          {t('dashboard:welcome_subtitle')}
        </p>
      </div>

      {/* Getting Started Progress */}
      {completionPercentage < 100 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {t('dashboard:getting_started')}
                </CardTitle>
                <CardDescription className="mt-1">
                  {completedSteps} {t('dashboard:of')} {completionSteps.length} {t('dashboard:steps_completed')}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{Math.round(completionPercentage)}%</div>
                <div className="text-xs text-muted-foreground">{t('dashboard:complete')}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={completionPercentage} className="h-2" />
            <div className="grid gap-2 sm:grid-cols-2">
              {completionSteps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 text-sm ${
                    step.done ? 'text-muted-foreground' : 'text-foreground font-medium'
                  }`}
                >
                  {step.done ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2" />
                  )}
                  <span className={step.done ? 'line-through' : ''}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Assets Card */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/assets')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard:total_assets')}</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assets}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard:manage_property')}
            </p>
          </CardContent>
        </Card>

        {/* Wills Card */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/wills')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard:active_wills')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.wills}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard:estate_planning')}
            </p>
          </CardContent>
        </Card>

        {/* Families Card */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/families')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard:family_groups')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.families}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard:heirs_beneficiaries')}
            </p>
          </CardContent>
        </Card>

        {/* Documents Card */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/documents')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard:secure_documents')}</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.documents}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard:in_vault')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard:quick_actions')}</CardTitle>
          <CardDescription>
            {t('dashboard:quick_actions_subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4"
              onClick={() => navigate('/assets')}
            >
              <Building2 className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">{t('dashboard:add_asset')}</div>
                <div className="text-xs text-muted-foreground">{t('dashboard:add_asset_desc')}</div>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4"
              onClick={() => navigate('/wills')}
            >
              <FileText className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">{t('dashboard:create_will')}</div>
                <div className="text-xs text-muted-foreground">{t('dashboard:create_will_desc')}</div>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4"
              onClick={() => navigate('/families')}
            >
              <Users className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">{t('dashboard:add_family')}</div>
                <div className="text-xs text-muted-foreground">{t('dashboard:add_family_desc')}</div>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col items-start gap-2 p-4"
              onClick={() => navigate('/documents')}
            >
              <FileCheck className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">{t('dashboard:upload_document')}</div>
                <div className="text-xs text-muted-foreground">{t('dashboard:upload_document_desc')}</div>
              </div>
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resources / Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard:resources')}</CardTitle>
          <CardDescription>
            {t('dashboard:resources_subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <span className="text-xl">📚</span>
              </div>
              <div className="flex-1">
                <div className="font-medium">{t('dashboard:getting_started_guide')}</div>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard:getting_started_guide_desc')}
                </p>
              </div>
            </div>

            <Separator />

            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <span className="text-xl">💬</span>
              </div>
              <div className="flex-1">
                <div className="font-medium">{t('dashboard:need_help')}</div>
                <p className="text-sm text-muted-foreground">
                  {t('dashboard:need_help_desc')}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}