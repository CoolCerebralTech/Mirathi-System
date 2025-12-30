import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Filter } from 'lucide-react';

import { useAssetInventory } from '../../features/estate/estate.api';
import { AssetCard } from '../../features/estate/components/AssetCard';
import { AddAssetDialog } from '../../features/estate/components/AddAssetDialog';

import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export function AssetInventoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // Simple state for filters (can be expanded)
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const { data, isLoading } = useAssetInventory(id || '', { search: searchTerm });

  if (!id) return null;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Asset Inventory</h1>
          <p className="text-muted-foreground">Manage real estate, vehicles, and financial accounts.</p>
        </div>
        <AddAssetDialog estateId={id} />
      </div>

      {/* Toolbar */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search assets..." 
            className="pl-8" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
           {data?.items.map((asset) => (
             <AssetCard key={asset.id} asset={asset} />
           ))}
           
           {data?.items.length === 0 && (
             <div className="col-span-full py-12 text-center border-2 border-dashed rounded-lg bg-slate-50">
               <p className="text-muted-foreground">No assets recorded yet.</p>
             </div>
           )}
        </div>
      )}
    </div>
  );
}