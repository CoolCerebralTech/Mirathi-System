// ============================================================================
// FILE: EstateDashboard.tsx
// ============================================================================

import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Alert,
  AlertDescription,
  Skeleton
} from '@/components/ui';
import { useEstateSummary } from '@/api/estate/estate.api';
import { EstateHeader } from './EstateHeader';
import { NetWorthCard } from './NetWorthCard';
import { LegalInsightsCard } from './LegalInsightsCard';
import { QuickActionsCard } from './QuickActionsCard';
import { AssetList } from '../assets/AssetList';
import { DebtList } from '../debts/DebtList';
import { CreateEstateDialog } from './CreateEstateDialog';

interface EstateDashboardProps {
  userId: string;
  userName: string;
}

export const EstateDashboard: React.FC<EstateDashboardProps> = ({ 
  userId, 
  userName 
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: estateSummary, isLoading, isError, error } = useEstateSummary(userId);

  // Loading State
  if (isLoading) {
    return (
      <div className="container py-8 space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Error State (Could be 404 if estate doesn't exist yet)
  if (isError) {
    // Check if it's a "not found" error - user needs to create estate
    // Axios/Fetch error might wrap message differently, check console log if unsure
    const isNotFound = error?.message?.includes('404') || error?.message?.toLowerCase().includes('not found');
    
    if (isNotFound) {
      return (
        <CreateEstateDialog 
          isOpen={true}
          userId={userId}
          userName={userName}
          onSuccess={() => window.location.reload()} // Simple refresh to fetch data
        />
      );
    }

    // Other errors
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load estate data: {error?.message || 'Unknown error occurred'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // No data state (should create estate)
  if (!estateSummary) {
    return (
      <CreateEstateDialog 
        isOpen={true}
        userId={userId}
        userName={userName}
        onSuccess={() => window.location.reload()}
      />
    );
  }

  // Extract nested properties for cleaner usage below
  const { overview, stats, legalInsights } = estateSummary;

  return (
    <div className="container py-6 space-y-6">
      {/* Estate Header */}
      <EstateHeader summary={estateSummary} />

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assets">
            Assets
            {stats.assetCount > 0 && ( /* Use stats.assetCount */
              <span className="ml-2 bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
                {stats.assetCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="debts">
            Debts
            {stats.debtCount > 0 && ( /* Use stats.debtCount */
              <span className="ml-2 bg-destructive/20 text-destructive px-2 py-0.5 rounded-full text-xs">
                {stats.debtCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          {/* Top Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <NetWorthCard summary={estateSummary} />
            <LegalInsightsCard insights={legalInsights} />
            <QuickActionsCard
              onAddAsset={() => setActiveTab('assets')}
              onAddDebt={() => setActiveTab('debts')}
              onCreateWill={() => {
                // TODO: Navigate to will creation
                console.log('Create will clicked');
              }}
              onViewLegal={() => {
                // Scroll to legal insights or show more details
                console.log('View legal clicked');
              }}
            />
          </div>

          {/* Recent Activity / Getting Started Guide (Unchanged) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* ... (Keep your Getting Started content here) ... */}
             <div className="p-6 border rounded-lg bg-gradient-to-br from-blue-50 to-purple-50">
              <h3 className="text-lg font-semibold mb-4">Getting Started with Estate Planning</h3>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-semibold text-xs">1</span>
                  <div>
                    <p className="font-medium">Record Your Assets</p>
                    <p className="text-muted-foreground text-xs">Add all properties, vehicles, bank accounts, and valuables</p>
                  </div>
                </li>
                {/* ... other items ... */}
              </ol>
            </div>

            <div className="p-6 border rounded-lg bg-muted/30">
              <h3 className="text-lg font-semibold mb-4">Legal Framework Reference</h3>
              {/* ... Reference content ... */}
            </div>
          </div>
        </TabsContent>

        {/* ASSETS TAB */}
        <TabsContent value="assets" className="space-y-6">
          <AssetList estateId={overview.id} /> {/* Use overview.id */}
        </TabsContent>

        {/* DEBTS TAB */}
        <TabsContent value="debts" className="space-y-6">
          <DebtList estateId={overview.id} /> {/* Use overview.id */}
        </TabsContent>
      </Tabs>
    </div>
  );
};