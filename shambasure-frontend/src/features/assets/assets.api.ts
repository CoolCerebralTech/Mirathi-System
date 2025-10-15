// FILE: src/features/assets/assets.api.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import {
  type Asset,
  AssetSchema,
  type CreateAssetInput,
  type UpdateAssetInput,
  type AssetQuery,
  SuccessResponseSchema,
  type SuccessResponse,
  type Paginated,
  createPaginatedResponseSchema,
} from '../../types';
import { z } from 'zod';
import { toast } from 'sonner';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// API ENDPOINTS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const ApiEndpoints = {
  ASSETS: '/assets',
  ASSET_BY_ID: (assetId: string) => `/assets/${assetId}`,
  ASSET_STATS: '/assets/stats',
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// QUERY KEY FACTORY
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (filters: AssetQuery) => [...assetKeys.lists(), filters] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
  stats: () => [...assetKeys.all, 'stats'] as const,
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// SCHEMAS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const AssetStatsSchema = z.object({
  totalCount: z.number(),
  countByType: z.record(z.string(), z.number()), // e.g., { LAND_PARCEL: 5, VEHICLE: 2 }
});
type AssetStats = z.infer<typeof AssetStatsSchema>;

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// API FUNCTIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const createAsset = async (assetData: CreateAssetInput): Promise<Asset> => {
  const { data } = await apiClient.post(ApiEndpoints.ASSETS, assetData);
  return AssetSchema.parse(data);
};

const getAssets = async (params: AssetQuery): Promise<Paginated<Asset>> => {
  const { data } = await apiClient.get(ApiEndpoints.ASSETS, { params });
  return createPaginatedResponseSchema(AssetSchema).parse(data);
};

const getAssetById = async (id: string): Promise<Asset> => {
  const { data } = await apiClient.get(ApiEndpoints.ASSET_BY_ID(id));
  return AssetSchema.parse(data);
};

const getAssetStats = async (): Promise<AssetStats> => {
  const { data } = await apiClient.get(ApiEndpoints.ASSET_STATS);
  return AssetStatsSchema.parse(data);
};

const updateAsset = async ({
  id,
  assetData,
}: {
  id: string;
  assetData: UpdateAssetInput;
}): Promise<Asset> => {
  const { data } = await apiClient.patch(
    ApiEndpoints.ASSET_BY_ID(id),
    assetData,
  );
  return AssetSchema.parse(data);
};

const deleteAsset = async (id: string): Promise<SuccessResponse> => {
  const { data } = await apiClient.delete(ApiEndpoints.ASSET_BY_ID(id));
  return SuccessResponseSchema.parse(data);
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// REACT QUERY HOOKS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export const useAssets = (params: AssetQuery = {}) =>
  useQuery({
    queryKey: assetKeys.list(params),
    queryFn: () => getAssets(params),
  });

export const useAsset = (id?: string) =>
  useQuery({
    queryKey: assetKeys.detail(id!),
    queryFn: () => getAssetById(id!),
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
      // Invalidate all lists and stats to refetch
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.stats() });
      toast.success('Asset created successfully');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
};

export const useUpdateAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateAsset,
    onSuccess: (updatedAsset) => {
      // Invalidate all asset lists
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      // Update the specific asset's detail query
      queryClient.setQueryData(
        assetKeys.detail(updatedAsset.id),
        updatedAsset,
      );
      toast.success('Asset updated successfully');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
    // Note: A full optimistic update for a discriminated union is complex.
    // A simpler `invalidateQueries` provides a good balance of UX and complexity.
  });
};

export const useDeleteAsset = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => {
      // Invalidate everything related to assets after a deletion
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
      toast.success('Asset deleted successfully');
    },
    // Example of optimistic update for deletion
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: assetKeys.all });
      // Optimistically remove the asset from all lists
      queryClient.setQueriesData<Paginated<Asset>>(
        { queryKey: assetKeys.lists() },
        (oldData) => {
          if (!oldData) return undefined;
          return {
            ...oldData,
            data: oldData.data.filter((asset) => asset.id !== deletedId),
          };
        },
      );
    },
    onError: (error) => {
      // If the mutation fails, refetch all asset queries to rollback
      queryClient.invalidateQueries({ queryKey: assetKeys.all });
      toast.error(extractErrorMessage(error));
    },
  });
};