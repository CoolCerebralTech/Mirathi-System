// FILE: src/features/assets/assets.api.ts (Finalized)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Asset, CreateAssetInput, UpdateAssetInput, AssetType } from '../../types/schemas/assets.schemas';

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
  const response = await apiClient.post('/assets', data);
  return response.data;
};

const getMyAssets = async (filters: { type?: AssetType }): Promise<Asset[]> => {
  const response = await apiClient.get('/assets', { params: filters });
  return response.data;
};

const getAssetById = async (id: string): Promise<Asset> => {
  const response = await apiClient.get(`/assets/${id}`);
  return response.data;
};

const getAssetStats = async (): Promise<any> => {
  const response = await apiClient.get('/assets/stats');
  return response.data;
};

const updateAsset = async (params: { id: string; data: UpdateAssetInput }) => {
  const response = await apiClient.patch(`/assets/${params.id}`, params.data);
  return response.data;
};

const deleteAsset = async (id: string) => {
  await apiClient.delete(`/assets/${id}`);
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

export const useMyAssets = (filters: { type?: AssetType } = {}) => useQuery({
  queryKey: assetKeys.list(filters),
  queryFn: () => getMyAssets(filters),
});

export const useAsset = (id: string) => useQuery({
  queryKey: assetKeys.detail(id),
  queryFn: () => getAssetById(id),
  enabled: !!id,
});

export const useAssetStats = () => useQuery({
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