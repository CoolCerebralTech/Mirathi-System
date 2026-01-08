// ============================================================================
// FILE: EstateAssetsPage.tsx
// ============================================================================

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { Button, Alert, AlertDescription, Skeleton } from '@/components/ui';
import { useCurrentUser } from '@/features/user/user.api';
import { useEstateSummary } from '@/features/estate/estate.api';
import { AssetList } from '@/features/estate/components/assets/AssetList';
import { NetWorthCard } from '@/features/estate/components/dashboard/NetWorthCard';

export const EstateAssetsPage: React.FC = () => {
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-32" />
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
  const { overview, stats } = summary;

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
          <h1 className="text-3xl font-bold">Assets Inventory</h1>
          <p className="text-muted-foreground">
            Manage all your properties, vehicles, accounts, and valuables
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg bg-blue-50">
          <p className="text-sm text-muted-foreground">Total Assets</p>
          <p className="text-2xl font-bold">{stats.assetCount}</p> {/* Use stats.assetCount */}
        </div>
        <div className="md:col-span-3">
          <NetWorthCard summary={summary} />
        </div>
      </div>

      {/* Asset List */}
      <AssetList estateId={overview.id} /> {/* Use overview.id */}
    </div>
  );
};