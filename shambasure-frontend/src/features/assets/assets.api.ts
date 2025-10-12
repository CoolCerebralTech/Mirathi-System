// FILE: src/features/assets/assets.api.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import type {
  Asset,
  CreateAssetInput,
  UpdateAssetInput,
  AssetQuery,
  PaginatedResponse,
} from '../../types';

// ============================================================================
// QUERY KEYS FACTORY
// ============================================================================

export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (filters: AssetQuery) => [...assetKeys.lists(), filters] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

const getAssets = async (params: AssetQuery): Promise<PaginatedResponse<Asset>> => {
  const response = await apiClient.get('/assets', { params });
  return response.data;
};

const getAssetById = async (assetId: string): Promise<Asset> => {
  const response = await apiClient.get(`/assets/${assetId}`);
  return response.data;
};

const createAsset = async (data: CreateAssetInput): Promise<Asset> => {
  const response = await apiClient.post('/assets', data);
  return response.data;
};

const updateAsset = async (params: {
  assetId: string;
  data: UpdateAssetInput;
}): Promise<Asset> => {
  const response = await apiClient.patch(`/assets/${params.assetId}`, params.data);
  return response.data;
};

const deleteAsset = async (assetId: string): Promise<void> => {
  await apiClient.delete(`/assets/${assetId}`);
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch paginated list of assets
 */
export const useAssets = (params: AssetQuery = {}) => {
  const status = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: assetKeys.list(params),
    queryFn: () => getAssets(params),
    enabled: status === 'authenticated',
    staleTime: 2 * 60 * 1000,
    keepPreviousData: true,
  });
};

/**
 * Hook to fetch a single asset by ID
 */
export const useAsset = (assetId: string) => {
  const status = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: assetKeys.detail(assetId),
    queryFn: () => getAssetById(assetId),
    enabled: status === 'authenticated' && !!assetId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to create a new asset
 */
export const useCreateAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
    onError: (error) => {
      console.error('Create asset failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to update an existing asset
 */
export const useUpdateAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAsset,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(variables.assetId) });
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
    onError: (error) => {
      console.error('Update asset failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to delete an asset
 */
export const useDeleteAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
    onError: (error) => {
      console.error('Delete asset failed:', extractErrorMessage(error));
    },
  });
};