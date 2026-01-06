import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Skeleton } from '@/components/ui';
import { useAssetList } from '../../estate.api';
import { AssetCard } from './AssetCard';
import { AddAssetDialog } from './AddAssetDialog';
import { EmptyState } from '@/components/common'; // Assuming you have this from your common folder

interface AssetListProps {
  estateId: string;
}

export const AssetList: React.FC<AssetListProps> = ({ estateId }) => {
  const { data: assets, isLoading, isError } = useAssetList(estateId);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      </div>
    );
  }

  // 2. Error State
  if (isError) {
    return <div className="text-red-500">Failed to load assets. Please try again later.</div>;
  }

  // 3. Success State
  return (
    <div className="space-y-6">
      {/* Header Action */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Assets Inventory</h2>
          <p className="text-sm text-muted-foreground">Manage your properties, vehicles, and accounts.</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Asset
        </Button>
      </div>

      {/* Grid Content */}
      {!assets || assets.length === 0 ? (
        <EmptyState 
          title="No Assets Recorded"
          description="Start building your estate inventory by adding your first asset."
          actionLabel="Add Asset"
          onAction={() => setIsAddDialogOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      )}

      {/* Dialog */}
      {isAddDialogOpen && (
        <AddAssetDialog 
          isOpen={isAddDialogOpen} 
          onClose={() => setIsAddDialogOpen(false)} 
          estateId={estateId} 
        />
      )}
    </div>
  );
};