import React, { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger,
  Skeleton,
  Alert,
  AlertDescription,
  Button
} from '@/components/ui';
import { useCurrentUser } from '@/features/user/user.api';
import { useEstateSummary, useCreateWill } from '@/features/estate/estate.api';

// Dashboard Components
import { CreateEstateDialog } from '@/features/estate/components/dashboard/CreateEstateDialog';
import { EstateHeader } from '@/features/estate/components/dashboard/EstateHeader';
import { LegalInsightsCard } from '@/features/estate/components/dashboard/LegalInsightsCard';
import { NetWorthCard } from '@/features/estate/components/dashboard/NetWorthCard';
import { QuickActionsCard } from '@/features/estate/components/dashboard/QuickActionsCard';

// Feature Components
import { AssetList } from '@/features/estate/components/assets/AssetList';
import { DebtList } from '@/features/estate/components/debts/DebtList';

export const EstateDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Get current user
  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();
  const userId = currentUser?.id;
  const userName = currentUser?.firstName && currentUser?.lastName
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : currentUser?.email || 'User';

  // Fetch estate summary
  const { 
    data: summary, 
    isLoading: isLoadingSummary, 
    isError, 
    error 
  } = useEstateSummary(userId || '', {
    enabled: !!userId,
  });

  // Will creation mutation
  const { mutate: createWill, isPending: isCreatingWill } = useCreateWill({
    onSuccess: () => {
      setActiveTab('will');
    },
  });

  // Combined loading state
  const isLoading = isLoadingUser || isLoadingSummary;

  // 1. LOADING STATE
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full col-span-2" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // 2. ERROR STATE - Check if estate doesn't exist (404)
  if (isError) {
    const isNotFound = error?.message?.includes('404') || 
                       error?.message?.toLowerCase().includes('not found') ||
                       error?.message?.toLowerCase().includes('no estate');
    
    if (isNotFound && userId) {
      return (
        <CreateEstateDialog 
          isOpen={true} 
          userId={userId} 
          userName={userName}
        />
      );
    }

    // Other errors
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load estate data: {error?.message || 'Unknown error occurred'}
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline"
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  // 3. NO SUMMARY - Show create dialog
  if (!summary && userId) {
    return (
      <CreateEstateDialog 
        isOpen={true} 
        userId={userId} 
        userName={userName}
      />
    );
  }

  // 4. NO USER - Should not happen if authenticated
  if (!userId || !summary) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unable to load user data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // 5. MAIN DASHBOARD CONTENT
  const handleCreateWill = () => {
    createWill({
      userId,
      testatorName: userName,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      
      {/* ESTATE HEADER */}
      <EstateHeader summary={summary} />

      {/* MAIN TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assets">
            Assets
            {summary.assetCount > 0 && (
              <span className="ml-2 bg-primary/20 text-primary px-2 py-0.5 rounded-full text-xs">
                {summary.assetCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="debts">
            Debts
            {summary.debtCount > 0 && (
              <span className="ml-2 bg-destructive/20 text-destructive px-2 py-0.5 rounded-full text-xs">
                {summary.debtCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="will">Will & Succession</TabsTrigger>
        </TabsList>

        {/* ===== OVERVIEW TAB ===== */}
        <TabsContent value="overview" className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <NetWorthCard summary={summary} />
            <div className="md:col-span-2">
              <LegalInsightsCard insights={summary.legalInsights} />
            </div>
          </div>

          {/* Quick Actions */}
          <QuickActionsCard
            onAddAsset={() => setActiveTab('assets')}
            onAddDebt={() => setActiveTab('debts')}
            onCreateWill={() => setActiveTab('will')}
            onViewLegal={() => {
              document.querySelector('[data-legal-insights]')?.scrollIntoView({ 
                behavior: 'smooth' 
              });
            }}
          />

          {/* Getting Started & Legal Reference */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Getting Started Guide */}
            <div className="p-6 border rounded-lg bg-gradient-to-br from-blue-50 to-purple-50">
              <h3 className="text-lg font-semibold mb-4">Getting Started</h3>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-semibold text-xs">
                    1
                  </span>
                  <div>
                    <p className="font-medium">Record Your Assets</p>
                    <p className="text-muted-foreground text-xs">
                      Add properties, vehicles, bank accounts, and valuables
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-semibold text-xs">
                    2
                  </span>
                  <div>
                    <p className="font-medium">Document Liabilities</p>
                    <p className="text-muted-foreground text-xs">
                      Record debts, loans, and financial obligations
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-semibold text-xs">
                    3
                  </span>
                  <div>
                    <p className="font-medium">Create Your Will</p>
                    <p className="text-muted-foreground text-xs">
                      Designate beneficiaries and witnesses
                    </p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground font-semibold text-xs">
                    4
                  </span>
                  <div>
                    <p className="font-medium">Print & Sign</p>
                    <p className="text-muted-foreground text-xs">
                      Execute your will with 2 witnesses
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            {/* Legal Framework Reference */}
            <div className="p-6 border rounded-lg bg-muted/30">
              <h3 className="text-lg font-semibold mb-4">Legal Framework</h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-background rounded border">
                  <p className="font-semibold text-xs text-muted-foreground">
                    Law of Succession Act (Cap 160)
                  </p>
                  <p className="font-medium mt-1">Section 11 - Will Validity</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requirements for a valid will in Kenya
                  </p>
                </div>
                <div className="p-3 bg-background rounded border">
                  <p className="font-semibold text-xs text-muted-foreground">
                    Law of Succession Act (Cap 160)
                  </p>
                  <p className="font-medium mt-1">Section 40 - Assets Inventory</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Estate asset documentation requirements
                  </p>
                </div>
                <div className="p-3 bg-background rounded border">
                  <p className="font-semibold text-xs text-muted-foreground">
                    Law of Succession Act (Cap 160)
                  </p>
                  <p className="font-medium mt-1">Section 45 - Debt Priority</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Order of payment for estate liabilities
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ===== ASSETS TAB ===== */}
        <TabsContent value="assets" className="space-y-6">
          <AssetList estateId={summary.id} />
        </TabsContent>

        {/* ===== DEBTS TAB ===== */}
        <TabsContent value="debts" className="space-y-6">
          <DebtList estateId={summary.id} />
        </TabsContent>

        {/* ===== WILL TAB ===== */}
        <TabsContent value="will" className="space-y-6">
          <div className="text-center p-12 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold mb-2">Will & Succession Planning</h3>
            <p className="text-muted-foreground mb-6">
              Create your legally compliant will to ensure proper succession
            </p>
            <Button 
              onClick={handleCreateWill}
              size="lg"
              disabled={isCreatingWill}
            >
              {isCreatingWill && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isCreatingWill ? 'Creating Will...' : 'Create Will'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};