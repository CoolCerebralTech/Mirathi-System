// FILE: src/features/wills/wills.api.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import type {
  Will,
  CreateWillInput,
  UpdateWillInput,
  AssignBeneficiaryInput,
  UpdateBeneficiaryAssignmentInput,
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
  beneficiaries: (willId: string) => [...willKeys.detail(willId), 'beneficiaries'] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

const getWills = async (params: WillQuery): Promise<PaginatedResponse<Will>> => {
  const response = await apiClient.get('/succession/wills', { params });
  return response.data;
};

const getWillById = async (willId: string): Promise<Will> => {
  const response = await apiClient.get(`/succession/wills/${willId}`);
  return response.data;
};

const createWill = async (data: CreateWillInput): Promise<Will> => {
  const response = await apiClient.post('/succession/wills', data);
  return response.data;
};

const updateWill = async (params: { willId: string; data: UpdateWillInput }): Promise<Will> => {
  const response = await apiClient.patch(`/succession/wills/${params.willId}`, params.data);
  return response.data;
};

const deleteWill = async (willId: string): Promise<void> => {
  await apiClient.delete(`/succession/wills/${willId}`);
};

const assignBeneficiary = async (params: {
  willId: string;
  data: AssignBeneficiaryInput;
}): Promise<void> => {
  await apiClient.post(`/succession/wills/${params.willId}/beneficiaries`, params.data);
};

const updateBeneficiaryAssignment = async (params: {
  willId: string;
  assignmentId: string;
  data: UpdateBeneficiaryAssignmentInput;
}): Promise<void> => {
  await apiClient.patch(
    `/succession/wills/${params.willId}/beneficiaries/${params.assignmentId}`,
    params.data
  );
};

const removeBeneficiary = async (params: {
  willId: string;
  assignmentId: string;
}): Promise<void> => {
  await apiClient.delete(`/succession/wills/${params.willId}/beneficiaries/${params.assignmentId}`);
};

// ============================================================================
// REACT QUERY HOOKS - WILLS
// ============================================================================

/**
 * Hook to fetch paginated list of wills
 * 
 * @example
 * const { data: willsPage, isLoading } = useWills({ page: 1, status: 'ACTIVE' });
 */
export const useWills = (params: WillQuery = {}) => {
  const status = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: willKeys.list(params),
    queryFn: () => getWills(params),
    enabled: status === 'authenticated',
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to fetch a single will by ID with full details
 * 
 * @example
 * const { data: will, isLoading } = useWill(willId);
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
 * 
 * @example
 * const createMutation = useCreateWill();
 * createMutation.mutate({ title: 'My Will', status: 'DRAFT' });
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
 * 
 * @example
 * const updateMutation = useUpdateWill();
 * updateMutation.mutate({ willId: '...', data: { title: 'Updated Title' } });
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
 * 
 * @example
 * const deleteMutation = useDeleteWill();
 * deleteMutation.mutate(willId);
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

// ============================================================================
// REACT QUERY HOOKS - BENEFICIARIES
// ============================================================================

/**
 * Hook to assign a beneficiary to an asset in a will
 * 
 * @example
 * const assignMutation = useAssignBeneficiary();
 * assignMutation.mutate({ 
 *   willId: '...', 
 *   data: { assetId: '...', beneficiaryId: '...', sharePercent: 50 } 
 * });
 */
export const useAssignBeneficiary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignBeneficiary,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: willKeys.detail(variables.willId) });
      queryClient.invalidateQueries({ queryKey: willKeys.beneficiaries(variables.willId) });
    },
    onError: (error) => {
      console.error('Assign beneficiary failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to update a beneficiary assignment (e.g., change share percentage)
 * 
 * @example
 * const updateMutation = useUpdateBeneficiaryAssignment();
 * updateMutation.mutate({ 
 *   willId: '...', 
 *   assignmentId: '...', 
 *   data: { sharePercent: 75 } 
 * });
 */
export const useUpdateBeneficiaryAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBeneficiaryAssignment,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: willKeys.detail(variables.willId) });
      queryClient.invalidateQueries({ queryKey: willKeys.beneficiaries(variables.willId) });
    },
    onError: (error) => {
      console.error('Update beneficiary assignment failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to remove a beneficiary from a will
 * 
 * @example
 * const removeMutation = useRemoveBeneficiary();
 * removeMutation.mutate({ willId: '...', assignmentId: '...' });
 */
export const useRemoveBeneficiary = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeBeneficiary,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: willKeys.detail(variables.willId) });
      queryClient.invalidateQueries({ queryKey: willKeys.beneficiaries(variables.willId) });
    },
    onError: (error) => {
      console.error('Remove beneficiary failed:', extractErrorMessage(error));
    },
  });
};