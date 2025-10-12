// FILE: src/features/wills/wills.api.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import type {
  Will,
  CreateWillInput,
  UpdateWillInput,
  AssignBeneficiaryInput,
  WillQuery,
  PaginatedResponse,
} from '../../types';

// ============================================================================
// QUERY KEYS FACTORY
// ============================================================================

export const willKeys = {
  all: ['wills'] as const,
  lists: () => [...willKeys.all, 'list'] as const,
  list: (filters: WillQuery) => [...willKeys.lists(), filters] as const,
  details: () => [...willKeys.all, 'detail'] as const,
  detail: (id: string) => [...willKeys.details(), id] as const,
  assignments: (willId: string) => [...willKeys.detail(willId), 'assignments'] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

const getWills = async (params: WillQuery): Promise<PaginatedResponse<Will>> => {
  const response = await apiClient.get('/wills', { params });
  return response.data;
};

const getWillById = async (willId: string): Promise<Will> => {
  const response = await apiClient.get(`/wills/${willId}`);
  return response.data;
};

const createWill = async (data: CreateWillInput): Promise<Will> => {
  const response = await apiClient.post('/wills', data);
  return response.data;
};

const updateWill = async (params: {
  willId: string;
  data: UpdateWillInput;
}): Promise<Will> => {
  const response = await apiClient.patch(`/wills/${params.willId}`, params.data);
  return response.data;
};

const deleteWill = async (willId: string): Promise<void> => {
  await apiClient.delete(`/wills/${willId}`);
};

const addBeneficiaryAssignment = async (params: {
  willId: string;
  data: AssignBeneficiaryInput;
}): Promise<Will> => {
  const response = await apiClient.post(
    `/wills/${params.willId}/beneficiaries`,
    params.data
  );
  return response.data;
};

const removeBeneficiaryAssignment = async (params: {
  willId: string;
  assignmentId: string;
}): Promise<void> => {
  await apiClient.delete(`/wills/${params.willId}/beneficiaries/${params.assignmentId}`);
};

const updateBeneficiaryAssignment = async (params: {
  willId: string;
  assignmentId: string;
  sharePercent?: number;
}): Promise<Will> => {
  const response = await apiClient.patch(
    `/wills/${params.willId}/beneficiaries/${params.assignmentId}`,
    { sharePercent: params.sharePercent }
  );
  return response.data;
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch paginated list of wills
 */
export const useWills = (params: WillQuery = {}) => {
  const status = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: willKeys.list(params),
    queryFn: () => getWills(params),
    enabled: status === 'authenticated',
    staleTime: 2 * 60 * 1000,
    keepPreviousData: true,
  });
};

/**
 * Hook to fetch a single will by ID
 */
export const useWill = (willId: string) => {
  const status = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: willKeys.detail(willId),
    queryFn: () => getWillById(willId),
    enabled: status === 'authenticated' && !!willId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to create a new will
 */
export const useCreateWill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: willKeys.lists() });
    },
    onError: (error) => {
      console.error('Create will failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to update an existing will
 */
export const useUpdateWill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateWill,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: willKeys.detail(variables.willId) });
      queryClient.invalidateQueries({ queryKey: willKeys.lists() });
    },
    onError: (error) => {
      console.error('Update will failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to delete a will
 */
export const useDeleteWill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: willKeys.lists() });
    },
    onError: (error) => {
      console.error('Delete will failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to add a beneficiary assignment to a will
 */
export const useAddBeneficiaryAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addBeneficiaryAssignment,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: willKeys.detail(variables.willId) });
      queryClient.invalidateQueries({ queryKey: willKeys.assignments(variables.willId) });
    },
    onError: (error) => {
      console.error('Add beneficiary assignment failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to remove a beneficiary assignment from a will
 */
export const useRemoveBeneficiaryAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeBeneficiaryAssignment,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: willKeys.detail(variables.willId) });
      queryClient.invalidateQueries({ queryKey: willKeys.assignments(variables.willId) });
    },
    onError: (error) => {
      console.error('Remove beneficiary assignment failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to update a beneficiary assignment
 */
export const useUpdateBeneficiaryAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBeneficiaryAssignment,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: willKeys.detail(variables.willId) });
      queryClient.invalidateQueries({ queryKey: willKeys.assignments(variables.willId) });
    },
    onError: (error) => {
      console.error('Update beneficiary assignment failed:', extractErrorMessage(error));
    },
  });
};