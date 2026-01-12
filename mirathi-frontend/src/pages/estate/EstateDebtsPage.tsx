// ============================================================================
// FILE: EstateDebtsPage.tsx
// ============================================================================

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button, Alert, AlertDescription, Skeleton } from '@/components/ui';
import { useCurrentUser } from '@/api/user/user.api';
import { useEstateSummary } from '@/api/estate/estate.api';
import { DebtList } from '@/features/estate/components/debts/DebtList';
import { LegalInsightsCard } from '@/features/estate/components/dashboard/LegalInsightsCard';

export const EstateDebtsPage: React.FC = () => {
  useParams<{ estateId: string; }>();
  const navigate = useNavigate();
  
  const { data: currentUser } = useCurrentUser();
  const userId = currentUser?.id;

  const { data: summary, isLoading, isError, error } = useEstateSummary(
    userId || '', 
    { enabled: !!userId }
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Error state
  if (isError || !summary) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error?.message || 'Failed to load estate data'}
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => navigate('/dashboard/estate')} 
          variant="outline"
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  // DESTRUCTURE HERE
  const { overview, stats, legalInsights } = summary;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard/estate')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Estate Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Liabilities & Debts</h1>
          <p className="text-muted-foreground">
            Track and manage all financial obligations with Section 45 priority ordering
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 border rounded-lg bg-red-50">
          <p className="text-sm text-muted-foreground">Total Debts</p>
          <p className="text-2xl font-bold">{stats.debtCount}</p> {/* Use stats.debtCount */}
        </div>
        <div className="p-4 border rounded-lg bg-amber-50">
          <p className="text-sm text-muted-foreground">Solvency Status</p>
          <p className="text-2xl font-bold">
            {overview.isInsolvent ? 'Insolvent' : 'Solvent'} {/* Use overview.isInsolvent */}
          </p>
        </div>
        <div className="p-4 border rounded-lg bg-blue-50">
          <p className="text-sm text-muted-foreground">Net Worth</p>
          <p className="text-2xl font-bold">
            {new Intl.NumberFormat('en-KE', {
              style: 'currency',
              currency: overview.currency, // Use overview.currency
              minimumFractionDigits: 0,
            }).format(overview.netWorth)} {/* Use overview.netWorth */}
          </p>
        </div>
      </div>

      {/* Legal Priority Notice */}
      <LegalInsightsCard insights={legalInsights} /> {/* Use destructured legalInsights */}

      {/* Debt List */}
      <DebtList estateId={overview.id} /> {/* Use overview.id */}
    </div>
  );
};