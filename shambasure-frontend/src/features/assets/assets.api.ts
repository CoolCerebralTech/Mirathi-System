// FILE: src/features/assets/assets.api.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import {
  AssetResponseSchema,
  CreateAssetRequestSchema,
  UpdateAssetRequestSchema,
  type Asset,
  type CreateAssetInput,
  type UpdateAssetInput,
  type AssetType,
} from '../../types';

// ============================================================================
// QUERY KEYS FACTORY
// ============================================================================

export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (filters: { type?: AssetType }) => [...assetKeys.lists(), filters] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
  stats: () => [...assetKeys.all, 'stats'] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

const createAsset = async (data: CreateAssetInput): Promise<Asset> => {
  try {
    const parsed = CreateAssetRequestSchema.parse(data);
    const response = await apiClient.post('/assets', parsed);
    return AssetResponseSchema.parse(response.data);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
};

const getMyAssets = async (filters: { type?: AssetType }): Promise<Asset[]> => {
  try {
    const response = await apiClient.get('/assets', { params: filters });
    return response.data.map((a: unknown) => AssetResponseSchema.parse(a));
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
};

const getAssetById = async (id: string): Promise<Asset> => {
  try {
    const response = await apiClient.get(`/assets/${id}`);
    return AssetResponseSchema.parse(response.data);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
};

const getAssetStats = async (): Promise<unknown> => {
  try {
    const response = await apiClient.get('/assets/stats');
    return response.data; // could add schema if you define AssetStatsSchema
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
};

const updateAsset = async (params: { id: string; data: UpdateAssetInput }): Promise<Asset> => {
  try {
    const parsed = UpdateAssetRequestSchema.parse(params.data);
    const response = await apiClient.patch(`/assets/${params.id}`, parsed);
    return AssetResponseSchema.parse(response.data);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
};

const deleteAsset = async (id: string) => {
  try {
    await apiClient.delete(`/assets/${id}`);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

export const useMyAssets = (filters: { type?: AssetType } = {}) =>
  useQuery({
    queryKey: assetKeys.list(filters),
    queryFn: () => getMyAssets(filters),
  });

export const useAsset = (id: string) =>
  useQuery({
    queryKey: assetKeys.detail(id),
    queryFn: () => getAssetById(id),
    enabled: !!id,
  });

export const useAssetStats = () =>
  useQuery({
    queryKey: assetKeys.stats(),
    queryFn: getAssetStats,
  });

export const useCreateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.stats() });
    },
  });
};

export const useUpdateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAsset,
    onSuccess: (updatedAsset) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.setQueryData(assetKeys.detail(updatedAsset.id), updatedAsset);
    },
  });
};

export const useDeleteAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.stats() });
    },
  });
};
