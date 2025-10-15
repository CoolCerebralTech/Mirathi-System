// FILE: src/features/wills/wills.api.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import {
  type Will,
  WillSchema,
  type CreateWillInput,
  type UpdateWillContentsInput,
  type WillQuery,
  type SuccessResponse,
  SuccessResponseSchema,
  type Paginated,
  createPaginatedResponseSchema,
} from '../../types';
import { toast } from 'sonner';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// API ENDPOINTS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const ApiEndpoints = {
  WILLS: '/wills',
  WILL_BY_ID: (willId: string) => `/wills/${willId}`,
  ACTIVE_WILL: '/wills/active',
  ACTIVATE_WILL: (willId: string) => `/wills/${willId}/activate`,
  REVOKE_WILL: (willId: string) => `/wills/${willId}/revoke`,
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// QUERY KEY FACTORY
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export const willKeys = {
  all: ['wills'] as const,
  lists: () => [...willKeys.all, 'list'] as const,
  list: (filters: WillQuery) => [...willKeys.lists(), filters] as const,
  details: () => [...willKeys.all, 'detail'] as const,
  detail: (id: string) => [...willKeys.details(), id] as const,
  active: () => [...willKeys.all, 'active'] as const,
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// API FUNCTIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const createWill = async (willData: CreateWillInput): Promise<Will> => {
  const { data } = await apiClient.post(ApiEndpoints.WILLS, willData);
  return WillSchema.parse(data);
};

const getWills = async (params: WillQuery): Promise<Paginated<Will>> => {
  const { data } = await apiClient.get(ApiEndpoints.WILLS, { params });
  return createPaginatedResponseSchema(WillSchema).parse(data);
};

const getActiveWill = async (): Promise<Will | null> => {
  const { data } = await apiClient.get(ApiEndpoints.ACTIVE_WILL);
  return data ? WillSchema.parse(data) : null;
};

const getWillById = async (id: string): Promise<Will> => {
  const { data } = await apiClient.get(ApiEndpoints.WILL_BY_ID(id));
  return WillSchema.parse(data);
};

const updateWillContents = async ({
  id,
  willData,
}: {
  id: string;
  willData: UpdateWillContentsInput;
}): Promise<Will> => {
  const { data } = await apiClient.patch(ApiEndpoints.WILL_BY_ID(id), willData);
  return WillSchema.parse(data);
};

const deleteWill = async (id: string): Promise<SuccessResponse> => {
  const { data } = await apiClient.delete(ApiEndpoints.WILL_BY_ID(id));
  return SuccessResponseSchema.parse(data);
};

const activateWill = async (id: string): Promise<Will> => {
  const { data } = await apiClient.post(ApiEndpoints.ACTIVATE_WILL(id));
  return WillSchema.parse(data);
};

const revokeWill = async (id: string): Promise<Will> => {
  const { data } = await apiClient.post(ApiEndpoints.REVOKE_WILL(id));
  return WillSchema.parse(data);
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// REACT QUERY HOOKS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export const useWills = (params: WillQuery = {}) =>
  useQuery({
    queryKey: willKeys.list(params),
    queryFn: () => getWills(params),
  });

export const useActiveWill = () =>
  useQuery({
    queryKey: willKeys.active(),
    queryFn: getActiveWill,
  });

export const useWill = (id?: string) =>
  useQuery({
    queryKey: willKeys.detail(id!),
    queryFn: () => getWillById(id!),
    enabled: !!id,
  });

export const useCreateWill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: willKeys.lists() });
      toast.success('Will created successfully');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
};

export const useUpdateWillContents = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateWillContents,
    onSuccess: (updatedWill) => {
      // Invalidate all high-level will queries
      queryClient.invalidateQueries({ queryKey: willKeys.all });
      // Immediately update the cache for this specific will
      queryClient.setQueryData(willKeys.detail(updatedWill.id), updatedWill);
      toast.success('Will updated successfully');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
};

export const useDeleteWill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteWill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: willKeys.all });
      toast.success('Will deleted successfully');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error));
    },
  });
};

const useWillStatusChange = (
  mutationFn: (id: string) => Promise<Will>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (updatedWill) => {
      queryClient.invalidateQueries({ queryKey: willKeys.all });
      queryClient.setQueryData(willKeys.detail(updatedWill.id), updatedWill);
      const action = mutationFn === activateWill ? 'activated' : 'revoked';
      toast.success(`Will ${action} successfully`);
    },
    onMutate: async (willId) => {
      await queryClient.cancelQueries({ queryKey: willKeys.detail(willId) });
      const previousWill = queryClient.getQueryData<Will>(
        willKeys.detail(willId),
      );
      // Optimistically update the status
      // Note: This is a simplified optimistic update. A more robust one would
      // also update the list queries.
      if (previousWill) {
        const newStatus = mutationFn === activateWill ? 'ACTIVE' : 'REVOKED';
        queryClient.setQueryData(willKeys.detail(willId), {
          ...previousWill,
          status: newStatus,
        });
      }
      return { previousWill };
    },
    onError: (err, willId, context) => {
      if (context?.previousWill) {
        queryClient.setQueryData(
          willKeys.detail(willId),
          context.previousWill,
        );
      }
      toast.error(extractErrorMessage(err));
    },
  });
};

export const useActivateWill = () => useWillStatusChange(activateWill);
export const useRevokeWill = () => useWillStatusChange(revokeWill);

