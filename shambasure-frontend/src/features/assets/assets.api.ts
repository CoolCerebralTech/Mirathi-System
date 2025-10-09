// FILE: src/features/assets/assets.api.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  byType: (type: string) => [...assetKeys.all, 'type', type] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

const getAssets = async (params: AssetQuery): Promise<PaginatedResponse<Asset>> => {
  const response = await apiClient.get('/succession/assets', { params });
  return response.data;
};

const getAssetById = async (assetId: string): Promise<Asset> => {
  const response = await apiClient.get(`/succession/assets/${assetId}`);
  return response.data;
};

const createAsset = async (data: CreateAssetInput): Promise<Asset> => {
  const response = await apiClient.post('/succession/assets', data);
  return response.data;
};

const updateAsset = async (params: {
  assetId: string;
  data: UpdateAssetInput;
}): Promise<Asset> => {
  const response = await apiClient.patch(`/succession/assets/${params.assetId}`, params.data);
  return response.data;
};

const deleteAsset = async (assetId: string): Promise<void> => {
  await apiClient.delete(`/succession/assets/${assetId}`);
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch paginated list of assets
 * Supports filtering by type, sorting, and pagination
 * 
 * @example
 * const { data: assetsPage, isLoading } = useAssets({ 
 *   page: 1, 
 *   type: 'LAND_PARCEL' 
 * });
 */
export const useAssets = (params: AssetQuery = {}) => {
  const status = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: assetKeys.list(params),
    queryFn: () => getAssets(params),
    enabled: status === 'authenticated',
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to fetch a single asset by ID
 * 
 * @example
 * const { data: asset, isLoading } = useAsset(assetId);
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
 * 
 * @example
 * const createMutation = useCreateAsset();
 * createMutation.mutate({ 
 *   name: 'Family Land', 
 *   type: 'LAND_PARCEL',
 *   description: 'Ancestral land in Nyeri' 
 * });
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
 * Supports optimistic updates for better UX
 * 
 * @example
 * const updateMutation = useUpdateAsset();
 * updateMutation.mutate({ 
 *   assetId: '...', 
 *   data: { name: 'Updated Asset Name' } 
 * });
 */
export const useUpdateAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAsset,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: assetKeys.detail(variables.assetId) });

      // Snapshot the previous value
      const previousAsset = queryClient.getQueryData<Asset>(
        assetKeys.detail(variables.assetId)
      );

      // Optimistically update to the new value
      if (previousAsset) {
        queryClient.setQueryData<Asset>(assetKeys.detail(variables.assetId), {
          ...previousAsset,
          ...variables.data,
        });
      }

      return { previousAsset };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(variables.assetId) });
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousAsset) {
        queryClient.setQueryData(
          assetKeys.detail(variables.assetId),
          context.previousAsset
        );
      }
      console.error('Update asset failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to delete an asset
 * 
 * @example
 * const deleteMutation = useDeleteAsset();
 * deleteMutation.mutate(assetId);
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

/**
 * Hook to fetch assets by specific type
 * Convenience hook for filtering by asset type
 * 
 * @example
 * const { data: landParcels } = useAssetsByType('LAND_PARCEL');
 */
export const useAssetsByType = (type: string) => {
  const status = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: assetKeys.byType(type),
    queryFn: () => getAssets({ type: type as any, limit: 100 }),
    enabled: status === 'authenticated' && !!type,
    staleTime: 5 * 60 * 1000,
  });
};