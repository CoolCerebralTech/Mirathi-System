// FILE: src/features/families/families.api.ts (Finalized)

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import {
  Family,
  CreateFamilyInput,
  AddFamilyMemberInput,
} from '../../types/schemas/families.schemas';

// ============================================================================
// QUERY KEYS FACTORY
// ============================================================================

export const familyKeys = {
  all: ['families'] as const,
  lists: () => [...familyKeys.all, 'list'] as const,
  details: () => [...familyKeys.all, 'detail'] as const,
  detail: (id: string) => [...familyKeys.details(), id] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

const createFamily = async (data: CreateFamilyInput): Promise<Family> => {
  const response = await apiClient.post('/families', data);
  return response.data;
};

const getMyFamilies = async (): Promise<Family[]> => {
  const response = await apiClient.get('/families');
  return response.data;
};

const getFamilyById = async (id: string): Promise<Family> => {
  const response = await apiClient.get(`/families/${id}`);
  return response.data;
};

const addFamilyMember = async (params: { familyId: string; data: AddFamilyMemberInput }) => {
  const response = await apiClient.post(`/families/${params.familyId}/members`, params.data);
  return response.data;
};

const removeFamilyMember = async (params: { familyId: string; userId: string }) => {
  await apiClient.delete(`/families/${params.familyId}/members/${params.userId}`);
};

const deleteFamily = async (id: string) => {
  await apiClient.delete(`/families/${id}`);
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

export const useMyFamilies = () => useQuery({
  queryKey: familyKeys.lists(),
  queryFn: getMyFamilies,
});

export const useFamily = (id: string) => useQuery({
  queryKey: familyKeys.detail(id),
  queryFn: () => getFamilyById(id),
  enabled: !!id,
});

export const useCreateFamily = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFamily,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: familyKeys.lists() }),
  });
};

export const useAddFamilyMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addFamilyMember,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: familyKeys.detail(variables.familyId) });
    },
  });
};

export const useRemoveFamilyMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeFamilyMember,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: familyKeys.detail(variables.familyId) });
    },
  });
};

export const useDeleteFamily = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFamily,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: familyKeys.lists() }),
  });
};