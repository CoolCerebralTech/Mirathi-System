// FILE: src/features/wills/wills.api.ts (Finalized)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import {
  Will,
  CreateWillInput,
  UpdateWillInput,
  AssignBeneficiaryInput,
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
// API FUNCTIONS & HOOKS
// ============================================================================

const createWill = async (data: CreateWillInput): Promise<Will> => {
  const response = await apiClient.post('/wills', data);
  return response.data;
};

const getMyWills = async (): Promise<Will[]> => {
  const response = await apiClient.get('/wills');
  return response.data;
};

const getActiveWill = async (): Promise<Will | null> => {
  const response = await apiClient.get('/wills/active');
  return response.data;
};

const getWillById = async (id: string): Promise<Will> => {
  const response = await apiClient.get(`/wills/${id}`);
  return response.data;
};

const updateWill = async (params: { id: string; data: UpdateWillInput }) => {
  const response = await apiClient.patch(`/wills/${params.id}`, params.data);
  return response.data;
};

const activateWill = async (id: string) => {
  const response = await apiClient.post(`/wills/${id}/activate`);
  return response.data;
};

const addBeneficiary = async (params: { willId: string; data: AssignBeneficiaryInput }) => {
  // UPGRADE: Corrected endpoint from /beneficiaries to /assignments
  const response = await apiClient.post(`/wills/${params.willId}/assignments`, params.data);
  return response.data;
};

const removeBeneficiary = async (params: { willId: string; assignmentId: string }) => {
  await apiClient.delete(`/wills/${params.willId}/assignments/${params.assignmentId}`);
};

export const useMyWills = () => useQuery({ queryKey: willKeys.lists(), queryFn: getMyWills });
export const useActiveWill = () => useQuery({ queryKey: willKeys.active(), queryFn: getActiveWill });
export const useWill = (id: string) => useQuery({ queryKey: willKeys.detail(id), queryFn: () => getWillById(id), enabled: !!id });

export const useCreateWill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWill,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: willKeys.lists() }),
  });
};

export const useUpdateWill = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateWill,
    onSuccess: (updatedWill) => {
      queryClient.invalidateQueries({ queryKey: willKeys.lists() });
      queryClient.setQueryData(willKeys.detail(updatedWill.id), updatedWill);
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

export const useAddBeneficiary = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addBeneficiary,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: willKeys.detail(variables.willId) });
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
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
    },
  });
};