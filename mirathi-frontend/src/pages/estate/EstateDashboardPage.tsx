// pages/estate/EstateDashboardPage.tsx

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import {
  useEstateDashboard,
  useSolvencyRadar,
  useAssetInventory,
  useDebtWaterfall,
  useDependantList,
  useGiftList,
} from '@/features/estate/estate.api';
import {
  EstateHeader,
  EstateSummaryCards,
  SolvencyWidget,
  CashFlowWidget,
  QuickActions,
  RecentActivity,
  AssetTable,
  DebtWaterfallView,
  DependantTable,
  GiftTable,
} from '@/features/estate/components';

export const EstateDashboardPage: React.FC = () => {
  const { estateId } = useParams<{ estateId: string }>();
  const navigate = useNavigate();

  const { data: dashboard, isLoading: dashboardLoading } = useEstateDashboard(estateId!);
  const { data: radar } = useSolvencyRadar(estateId!);
  const { data: assets } = useAssetInventory(estateId!);
  const { data: debts } = useDebtWaterfall(estateId!);
  const { data: dependants } = useDependantList(estateId!);
  const { data: gifts } = useGiftList(estateId!);

  if (!estateId) {
    navigate('/estates');
    return null;
  }

  if (dashboardLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-slate-600 mb-4" />
          <p className="text-slate-600">Loading estate data...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Estate not found</p>
          <Button onClick={() => navigate('/estates')}>
            Back to Estates
          </Button>
        </div>
      </div>
    );
  }

  // --- Handlers for Quick Actions ---
  const handleQuickAction = (actionType: 'ADD_ASSET' | 'ADD_DEBT' | 'FILE_CLAIM' | 'RECORD_GIFT') => {
      // In a real app, these would open dialogs. 
      // Assuming dialogs are handled by triggers elsewhere or we navigate to specific pages/modals.
      // For now, we'll just log. In production, connect this to state that opens the relevant Dialog component.
      console.log('Action triggered:', actionType);
      
      // Example navigation logic if we wanted to redirect instead of opening modals
      // if (actionType === 'ADD_ASSET') navigate(`/estates/${estateId}/assets/new`);
  };

  // --- Handlers for Estate Header Actions ---
  const handleFreeze = () => console.log("Freeze triggered");
  const handleUnfreeze = () => console.log("Unfreeze triggered");
  const handleClose = () => console.log("Close triggered");

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/estates')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Estates
          </Button>
          <EstateHeader
            estate={dashboard}
            onFreeze={handleFreeze}
            onUnfreeze={handleUnfreeze}
            onClose={handleClose}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="mb-8">
          <EstateSummaryCards data={dashboard} />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Solvency & Cash */}
          <div className="lg:col-span-2 space-y-6">
            {/* Pass radar data directly */}
            {radar && <SolvencyWidget radar={radar} />}
            <CashFlowWidget data={dashboard} />
          </div>

          {/* Right Column - Quick Actions */}
          <div>
            <QuickActions estateId={estateId} onAction={handleQuickAction} />
          </div>
        </div>

        {/* Tabbed Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assets">
              Assets ({assets?.totalCount || 0})
            </TabsTrigger>
            <TabsTrigger value="debts">
              Debts ({debts?.totalLiabilities.formatted || '0'})
            </TabsTrigger>
            <TabsTrigger value="dependants">
              Dependants ({dependants?.items.length || 0})
            </TabsTrigger>
            <TabsTrigger value="gifts">
              Gifts ({gifts?.items.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <RecentActivity activities={[]} /* Passing empty array as placeholder until activity API is ready */ />
          </TabsContent>

          <TabsContent value="assets">
            {assets && (
              <AssetTable
                data={assets.items}
                onViewDetails={(assetId) => navigate(`/estates/${estateId}/assets/${assetId}`)}
                // Provide placeholder handlers for required props if AssetTable requires them
                onUpdateValuation={() => {}}
                onLiquidate={() => {}}
              />
            )}
          </TabsContent>

          <TabsContent value="debts">
            {debts && (
              <DebtWaterfallView
                data={debts}
                estateId={estateId}
              />
            )}
          </TabsContent>

          <TabsContent value="dependants">
            {dependants && (
              <DependantTable
                data={dependants.items}
                // Provide placeholders for required handlers
                onVerify={() => {}}
                onReject={() => {}}
                onSettle={() => {}}
                onAddEvidence={() => {}}
              />
            )}
          </TabsContent>

          <TabsContent value="gifts">
            {gifts && (
              <GiftTable
                data={gifts.items}
                totalHotchpotAddBack={gifts.totalHotchpotAddBack}
                // Provide placeholders for required handlers
                onContest={() => {}}
                onResolve={() => {}}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};