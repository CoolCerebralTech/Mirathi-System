// src/hooks/useAssets.ts
// ============================================================================
// Custom Hook for Asset Management
// ============================================================================
// - Encapsulates all state and logic for interacting with the assets API.
// - Manages the assets list, loading states, and error messages.
// - Provides asynchronous actions (create, update, delete) that components
//   can call, with automatic state updates upon completion.
// - Uses toasts for user feedback on all actions.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getMyAssets, createAsset, updateAsset, deleteAsset } from '../api/assets';
import type { Asset, CreateAssetRequest, UpdateAssetRequest } from '../types';

export const useAssets = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoized function to fetch assets
  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedAssets = await getMyAssets();
      setAssets(fetchedAssets);
    } catch (err) {
      setError('Failed to load your assets.');
      toast.error('Could not fetch your assets.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on component mount
  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Action to create a new asset
  const handleCreate = useCallback(async (data: CreateAssetRequest) => {
    const toastId = toast.loading('Creating new asset...');
    try {
      const newAsset = await createAsset(data);
      // Add the new asset to the list for immediate feedback
      setAssets(currentAssets => [newAsset, ...currentAssets]);
      toast.success('Asset created successfully!', { id: toastId });
    } catch (err) {
      toast.error('Failed to create asset. Please try again.', { id: toastId });
      console.error(err);
      throw err; // Re-throw to allow form to handle error state
    }
  }, []);

  // Action to update an asset
  const handleUpdate = useCallback(async (assetId: string, data: UpdateAssetRequest) => {
    const toastId = toast.loading('Updating asset...');
    try {
      const updatedAsset = await updateAsset(assetId, data);
      // Update the asset in our local state
      setAssets(currentAssets => 
        currentAssets.map(asset => (asset.id === assetId ? updatedAsset : asset))
      );
      toast.success('Asset updated successfully!', { id: toastId });
    } catch (err) {
        toast.error('Failed to update asset.', { id: toastId });
        console.error(err);
        throw err;
    }
  }, []);

  // Action to delete an asset
  const handleDelete = useCallback(async (assetId: string) => {
    const originalAssets = assets;
    // Optimistic UI update
    setAssets(currentAssets => currentAssets.filter(asset => asset.id !== assetId));
    
    const toastId = toast.loading('Deleting asset...');
    try {
      await deleteAsset(assetId);
      toast.success('Asset deleted.', { id: toastId });
    } catch (err) {
      // Revert on failure
      setAssets(originalAssets);
      toast.error('Failed to delete asset. It may be assigned to a will.', { id: toastId });
      console.error(err);
    }
  }, [assets]);

  return {
    assets,
    loading,
    error,
    createAsset: handleCreate,
    updateAsset: handleUpdate,
    deleteAsset: handleDelete,
    refreshAssets: fetchAssets,
  };
};