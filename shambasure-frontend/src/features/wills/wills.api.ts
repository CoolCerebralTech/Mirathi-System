// FILE: src/features/wills/wills.api.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import {
  WillResponseSchema,
  CreateWillRequestSchema,
  UpdateWillRequestSchema,
  AssignBeneficiaryRequestSchema,
  type Will,
  type CreateWillInput,
  type UpdateWillInput,
  type AssignBeneficiaryInput,
  type BeneficiaryAssignment,
} from '../../types';
import { assetKeys } from '../assets/assets.api';

// ============================================================================
// QUERY KEYS FACTORY
// ============================================================================

export const willKeys = {
  all: ['wills'] as const,
  lists: () => [...willKeys.all, 'list'] as const,
  details: () => [...willKeys.all, 'detail'] as const,
  detail: (id: string) => [...willKeys.details(), id] as const,
  active: () => [...willKeys.all, 'active'] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

const createWill = async (data: CreateWillInput): Promise<Will> => {
  try {
    const parsed = CreateWillRequestSchema.parse(data);
    const response = await apiClient.post('/wills', parsed);
    return WillResponseSchema.parse(response.data);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
};

const getMyWills = async (): Promise<Will[]> => {
  try {
    const response = await apiClient.get('/wills');
    return response.data.map((w: unknown) => WillResponseSchema.parse(w));
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
};

const getActiveWill = async (): Promise<Will | null> => {
  try {
    const response = await apiClient.get('/wills/active');
    return response.data ? WillResponseSchema.parse(response.data) : null;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
};

const getWillById = async (id: string): Promise<Will> => {
  try {
    const response = await apiClient.get(`/wills/${id}`);
    return WillResponseSchema.parse(response.data);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
};

const updateWill = async (params: { id: string; data: UpdateWillInput }): Promise<Will> => {
  try {
    const parsed = UpdateWillRequestSchema.parse(params.data);
    const response = await apiClient.patch(`/wills/${params.id}`, parsed);
    return WillResponseSchema.parse(response.data);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
};

const deleteWill = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/wills/${id}`);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
};

const activateWill = async (id: string): Promise<Will> => {
  try {
    const response = await apiClient.post(`/wills/${id}/activate`);
    return WillResponseSchema.parse(response.data);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
};

const revokeWill = async (id: string): Promise<Will> => {
  try {
    const response = await apiClient.post(`/wills/${id}/revoke`);
    return WillResponseSchema.parse(response.data);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
};

const addBeneficiary = async (params: { 
  willId: string; 
  data: AssignBeneficiaryInput 
}): Promise<BeneficiaryAssignment> => {
  try {
    const parsed = AssignBeneficiaryRequestSchema.parse(params.data);
    const response = await apiClient.post(`/wills/${params.willId}/assignments`, parsed);
    return response.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
};

const removeBeneficiary = async (params: { 
  willId: string; 
  assignmentId: string 
}): Promise<void> => {
  try {
    await apiClient.delete(`/wills/${params.willId}/assignments/${params.assignmentId}`);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
};

const updateBeneficiaryAssignment = async (params: {
  willId: string;
  assignmentId: string;
  data: Partial<AssignBeneficiaryInput>;
}): Promise<BeneficiaryAssignment> => {
  try {
    const response = await apiClient.patch(
      `/wills/${params.willId}/assignments/${params.assignmentId}`,
      params.data
    );
    return response.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
};

// ============================================================================
// HOOKS
// ============================================================================

export const useMyWills = () =>
  useQuery({ 
    queryKey: willKeys.lists(), 
    queryFn: getMyWills,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

export const useActiveWill = () =>
  useQuery({ 
    queryKey: willKeys.active(), 
    queryFn: getActiveWill,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

export const useWill = (id: string) =>
  useQuery({
    queryKey: willKeys.detail(id),
    queryFn: () => getWillById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

export const useCreateWill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: willKeys.lists() });
      queryClient.invalidateQueries({ queryKey: willKeys.active() });
    },
  });
};

export const useUpdateWill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateWill,
    onSuccess: (updatedWill) => {
      queryClient.invalidateQueries({ queryKey: willKeys.lists() });
      queryClient.invalidateQueries({ queryKey: willKeys.active() });
      queryClient.setQueryData(willKeys.detail(updatedWill.id), updatedWill);
    },
  });
};

export const useDeleteWill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteWill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: willKeys.all });
    },
  });
};

export const useActivateWill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: activateWill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: willKeys.all });
    },
  });
};

export const useRevokeWill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeWill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: willKeys.all });
    },
  });
};

export const useAddBeneficiary = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addBeneficiary,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: willKeys.detail(variables.willId) });
      queryClient.invalidateQueries({ queryKey: willKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
};

export const useRemoveBeneficiary = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeBeneficiary,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: willKeys.detail(variables.willId) });
      queryClient.invalidateQueries({ queryKey: willKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
};

export const useUpdateBeneficiaryAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBeneficiaryAssignment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: willKeys.detail(variables.willId) });
      queryClient.invalidateQueries({ queryKey: willKeys.lists() });
    },
  });
};