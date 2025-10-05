// src/api/assets.ts
// ============================================================================
// Assets API Service
// ============================================================================
// - Encapsulates all API calls for the /assets endpoints.
// - Provides functions for creating, reading, updating, and deleting assets.
// ============================================================================

import { apiClient } from '../lib/axios';
import type { Asset, CreateAssetRequest, UpdateAssetRequest } from '../types';

/**
 * Fetches all assets owned by the current user.
 */
export const getMyAssets = async (): Promise<Asset[]> => {
    const response = await apiClient.get<Asset[]>('/assets');
    return response.data;
};

/**
 * Creates a new asset.
 * @param data The data for the new asset.
 */
export const createAsset = async (data: CreateAssetRequest): Promise<Asset> => {
    const response = await apiClient.post<Asset>('/assets', data);
    return response.data;
};

/**
 * Updates an existing asset.
 * @param assetId The ID of the asset to update.
 * @param data The new data for the asset.
 */
export const updateAsset = async (assetId: string, data: UpdateAssetRequest): Promise<Asset> => {
    const response = await apiClient.patch<Asset>(`/assets/${assetId}`, data);
    return response.data;
};

/**
 * Deletes an asset by its ID.
 * @param assetId The ID of the asset to delete.
 */
export const deleteAsset = async (assetId: string): Promise<void> => {
    await apiClient.delete(`/assets/${assetId}`);
};