import React, { useState } from 'react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger,
  Skeleton
} from '@/components/ui';
import { useEstateSummary, useWillPreview } from '@/features/estate/estate.api';

// Components
import { CreateEstateDialog } from '@/features/estate/components/dashboard/CreateEstateDialog';
import { LegalInsightsCard } from '@/features/estate/components/dashboard/LegalInsightsCard';
import { NetWorthCard } from '@/features/estate/components/dashboard/NetWorthCard';
import { AssetList } from '@/features/estate/components/assets/AssetList';
import { DebtList } from '@/features/estate/components/debts/DebtList';
import { WillStatusCard } from '@/features/estate/components/will/WillStatusCard';
import { BeneficiaryList } from '@/features/estate/components/will/BeneficiaryList';
import { WitnessList } from '@/features/estate/components/will/WitnessList';
import { WillPreviewDialog } from '@/features/estate/components/will/WillPreviewDialog';

export const EstateDashboardPage: React.FC = () => {
  const { user } = useAuth(); // Helper to get current user ID
  const { data: summary, isLoading, isError } = useEstateSummary(user?.id || '');
  
  // Will Data Fetching (Dependent on summary existing)
  // In a real app, estateId is usually derived or same as userId in 1:1 map
  // Here we assume a Will ID is fetchable or we pass user ID to a wrapper
  // For this demo, let's assume we fetch will preview via a separate hook or derived ID
  // Note: simplified for this example.
  const estateId = summary?.id;
  // We need to fetch the Will ID associated with this user. 
  // Let's assume the Summary response included a `willId` or we query by user.
  // For now, I'll mock the hook call pattern:
  const { data: willData } = useWillPreview(user?.id || '', { enabled: !!estateId }); 

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full col-span-2" />
        </div>
      </div>
    );
  }

  // 2. Empty State / Onboarding (No Estate Found)
  if (!summary || isError) {
    return (
      <CreateEstateDialog 
        isOpen={true} 
        userId={user?.id || ''} 
        userName={user?.firstName ? `${user.firstName} ${user.lastName}` : 'User'} 
      />
    );
  }

  // 3. Dashboard Content
  return (
    <div className="container mx-auto p-6 space-y-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estate Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your assets, liabilities, and succession plan.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-md text-sm text-slate-700">
          <span className="font-medium">Estate ID:</span>
          <code className="font-mono text-xs">{summary.id.slice(0, 8)}...</code>
        </div>
      </div>

      {/* KPI SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Net Worth */}
        <div className="md:col-span-1">
          <NetWorthCard summary={summary} />
        </div>
        
        {/* Digital Lawyer Insights */}
        <div className="md:col-span-2">
          <LegalInsightsCard insights={summary.legalInsights} />
        </div>
      </div>

      {/* TABS SECTION */}
      <Tabs defaultValue="assets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="assets">Assets Inventory</TabsTrigger>
          <TabsTrigger value="debts">Debts & Liabilities</TabsTrigger>
          <TabsTrigger value="will">Will & Succession</TabsTrigger>
        </TabsList>

        {/* 1. ASSETS TAB */}
        <TabsContent value="assets" className="space-y-4">
          <AssetList estateId={summary.id} />
        </TabsContent>

        {/* 2. DEBTS TAB */}
        <TabsContent value="debts" className="space-y-4">
          <DebtList estateId={summary.id} />
        </TabsContent>

        {/* 3. WILL TAB */}
        <TabsContent value="will" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Status & Preview */}
            <div className="lg:col-span-1 space-y-6">
              {willData ? (
                <WillStatusCard 
                  data={willData} 
                  onPreview={() => setIsPreviewOpen(true)} 
                />
              ) : (
                // Simple placeholder if no will exists yet
                <div className="p-6 border border-dashed rounded-lg text-center">
                  <p className="text-muted-foreground mb-4">No Will Drafted</p>
                  <button className="text-primary hover:underline">Start Drafting</button>
                </div>
              )}
            </div>

            {/* Right Column: Beneficiaries & Witnesses */}
            <div className="lg:col-span-2 space-y-8">
              {willData && (
                <>
                  <BeneficiaryList 
                    willId={willData.metadata.willId} 
                    // Mapping preview data to list format
                    beneficiaries={
                      // In a real app, parse this from the HTML or have a separate DTO
                      // Mocking structural extraction for now based on preview API
                      [] 
                    } 
                  />
                  <WitnessList 
                    willId={willData.metadata.willId} 
                    witnesses={[]} 
                  />
                </>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* GLOBAL MODALS */}
      {willData && (
        <WillPreviewDialog 
          isOpen={isPreviewOpen} 
          onClose={() => setIsPreviewOpen(false)} 
          htmlContent={willData.htmlPreview} 
        />
      )}
    </div>
  );
};