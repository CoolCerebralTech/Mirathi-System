import React, { useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { Button, Skeleton, Alert, AlertDescription } from '@/components/ui';
import { useAssetList } from '@/api/estate/estate.api';
import { AssetCard } from './AssetCard';
import { AddAssetDialog } from './AddAssetDialog';
import { UpdateAssetValueDialog } from './UpdateAssetValueDialog';
import { VerifyAssetDialog } from './VerifyAssetDialog';
import { EmptyState } from '@/components/common/EmptyState';

interface AssetListProps {
  estateId: string;
}

export const AssetList: React.FC<AssetListProps> = ({ estateId }) => {
  const { data: assets, isLoading, isError, error } = useAssetList(estateId);
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [updateValueAssetId, setUpdateValueAssetId] = useState<string | null>(null);
  const [verifyAssetId, setVerifyAssetId] = useState<string | null>(null);

  // Calculate summary statistics
  const totalValue = assets?.reduce((sum, asset) => sum + asset.estimatedValue, 0) || 0;
  const verifiedCount = assets?.filter(a => a.isVerified).length || 0;
  const encumberedCount = assets?.filter(a => a.isEncumbered).length || 0;

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load assets: {error?.message || 'Unknown error occurred'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  // Success State
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Assets Inventory</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your properties, vehicles, bank accounts, and other valuables
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} size="lg">
          <Plus className="mr-2 h-4 w-4" /> Add Asset
        </Button>
      </div>

      {/* Summary Statistics */}
      {assets && assets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 font-medium">Total Asset Value</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">
              {new Intl.NumberFormat('en-KE', {
                style: 'currency',
                currency: 'KES',
                minimumFractionDigits: 0,
              }).format(totalValue)}
            </p>
            <p className="text-xs text-blue-600 mt-1">{assets.length} asset(s)</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-700 font-medium">Verified Assets</p>
            <p className="text-2xl font-bold text-green-900 mt-1">
              {verifiedCount} / {assets.length}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {Math.round((verifiedCount / assets.length) * 100)}% verified
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-700 font-medium">Encumbered Assets</p>
            <p className="text-2xl font-bold text-orange-900 mt-1">
              {encumberedCount}
            </p>
            <p className="text-xs text-orange-600 mt-1">
              {encumberedCount === 0 ? 'All clear' : 'Requires attention'}
            </p>
          </div>
        </div>
      )}

      {/* Asset Grid or Empty State */}
      {!assets || assets.length === 0 ? (
        <EmptyState 
          title="No Assets Recorded Yet"
          description="Start building your estate inventory by adding your first asset. This will help calculate your net worth and provide legal insights for succession planning."
          actionLabel="Add Your First Asset"
          onAction={() => setIsAddDialogOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {assets.map((asset) => (
            <AssetCard 
              key={asset.id} 
              asset={asset}
              onUpdateValue={(id) => setUpdateValueAssetId(id)}
              onVerify={(id) => setVerifyAssetId(id)}
              onRemove={(id) => {
                // TODO: Implement remove asset functionality
                console.log('Remove asset:', id);
              }}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <AddAssetDialog 
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        estateId={estateId}
      />

      {updateValueAssetId && (
        <UpdateAssetValueDialog
          isOpen={true}
          onClose={() => setUpdateValueAssetId(null)}
          assetId={updateValueAssetId}
          estateId={estateId}
        />
      )}

      {verifyAssetId && (
        <VerifyAssetDialog
          isOpen={true}
          onClose={() => setVerifyAssetId(null)}
          assetId={verifyAssetId}
        />
      )}
    </div>
  );
};