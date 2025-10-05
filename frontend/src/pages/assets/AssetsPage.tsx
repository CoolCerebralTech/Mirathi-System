// src/pages/assets/AssetsPage.tsx
// ============================================================================
// Main Assets Page
// ============================================================================
// - The primary interface for users to manage their assets.
// - Uses the useAssets hook to handle all data fetching and state management.
// - Assembles the `AssetCard` components into a responsive grid.
// - Manages the state and logic for opening the `AssetFormModal` for both
// creating new assets and editing existing ones.
// ============================================================================
import { useState } from 'react';
import { useAssets } from '../../hooks/useAssets';
import { AssetCard } from '../../features/assets/AssetCard';
import { AssetFormModal } from '../../features/assets/AssetFormModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Button } from '../../components/ui/Button';
import type { Asset, CreateAssetRequest, UpdateAssetRequest } from '../../types';
export const AssetsPage = () => {
// State for controlling the modal
const [isModalOpen, setIsModalOpen] = useState(false);
const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null);
// The hook provides all the data and functions we need
const { assets, loading, error, createAsset, updateAsset, deleteAsset } = useAssets();
const handleOpenCreateModal = () => {
setAssetToEdit(null); // Ensure we're in "create" mode
setIsModalOpen(true);
};
const handleOpenEditModal = (asset: Asset) => {
setAssetToEdit(asset); // Set the asset to edit, switching to "edit" mode
setIsModalOpen(true);
};
const handleDeleteAsset = (assetId: string) => {
if (window.confirm('Are you sure you want to delete this asset? This cannot be undone.')) {
deleteAsset(assetId);
}
}
const handleSaveAsset = async (data: CreateAssetRequest | UpdateAssetRequest, assetId?: string) => {
if (assetId) { // If there's an ID, we're updating
await updateAsset(assetId, data as UpdateAssetRequest);
} else { // Otherwise, we're creating
await createAsset(data as CreateAssetRequest);
}
};
const renderContent = () => {
if (loading) {
return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>;
}
if (error) {
  return <div className="text-center py-20 text-red-600 font-medium">{error}</div>;
}

if (assets.length === 0) {
  return (
    <div className="text-center py-20">
      <h3 className="text-lg font-medium text-gray-900">You haven't added any assets yet.</h3>
      <p className="mt-1 text-sm text-gray-500">
        Get started by creating your first asset.
      </p>
    </div>
  );
}

return (
  <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {assets.map((asset) => (
      <AssetCard
        key={asset.id}
        asset={asset}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteAsset}
      />
    ))}
  </ul>
);
};
return (
<>
{/* Page Header */}
<div className="flex flex-col items-start justify-between gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:gap-0">
<div>
<h1 className="text-3xl font-bold text-gray-900">My Assets</h1>
<p className="mt-2 text-sm text-gray-500">
A list of all your registered assets, such as land, property, and vehicles.
</p>
</div>
<div className="ml-auto">
<Button onClick={handleOpenCreateModal}>
Add New Asset
</Button>
</div>
</div>
{/* Assets Grid */}
  <div className="mt-8">
    {renderContent()}
  </div>

  {/* Create/Edit Modal */}
  <AssetFormModal
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    onSave={handleSaveAsset}
    assetToEdit={assetToEdit}
  />
</>
);
};