// FILE: src/features/families/families.api.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import type {
  Family,
  CreateFamilyInput,
  UpdateFamilyInput,
  AddFamilyMemberInput,
  UpdateFamilyMemberInput,
  PaginatedResponse,
} from '../../types';

// ============================================================================
// QUERY KEYS FACTORY
// ============================================================================

export const familyKeys = {
  all: ['families'] as const,
  lists: () => [...familyKeys.all, 'list'] as const,
  list: (filters?: any) => [...familyKeys.lists(), filters] as const,
  details: () => [...familyKeys.all, 'detail'] as const,
  detail: (id: string) => [...familyKeys.details(), id] as const,
  members: (familyId: string) => [...familyKeys.detail(familyId), 'members'] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

const getFamilies = async (params?: any): Promise<PaginatedResponse<Family>> => {
  const response = await apiClient.get('/families', { params });
  return response.data;
};

const getFamilyById = async (familyId: string): Promise<Family> => {
  const response = await apiClient.get(`/families/${familyId}`);
  return response.data;
};

const createFamily = async (data: CreateFamilyInput): Promise<Family> => {
  const response = await apiClient.post('/families', data);
  return response.data;
};

const updateFamily = async (params: {
  familyId: string;
  data: UpdateFamilyInput;
}): Promise<Family> => {
  const response = await apiClient.patch(`/families/${params.familyId}`, params.data);
  return response.data;
};

const deleteFamily = async (familyId: string): Promise<void> => {
  await apiClient.delete(`/families/${familyId}`);
};

const addFamilyMember = async (params: {
  familyId: string;
  data: AddFamilyMemberInput;
}): Promise<Family> => {
  const response = await apiClient.post(
    `/families/${params.familyId}/members`,
    params.data
  );
  return response.data;
};

const removeFamilyMember = async (params: {
  familyId: string;
  userId: string;
}): Promise<void> => {
  await apiClient.delete(`/families/${params.familyId}/members/${params.userId}`);
};

const updateFamilyMember = async (params: {
  familyId: string;
  userId: string;
  data: UpdateFamilyMemberInput;
}): Promise<Family> => {
  const response = await apiClient.patch(
    `/families/${params.familyId}/members/${params.userId}`,
    params.data
  );
  return response.data;
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch paginated list of families
 */
export const useFamilies = (params?: any) => {
  const status = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: familyKeys.list(params),
    queryFn: () => getFamilies(params),
    enabled: status === 'authenticated',
    staleTime: 2 * 60 * 1000,
    keepPreviousData: true,
  });
};

/**
 * Hook to fetch a single family by ID
 */
export const useFamily = (familyId: string) => {
  const status = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: familyKeys.detail(familyId),
    queryFn: () => getFamilyById(familyId),
    enabled: status === 'authenticated' && !!familyId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to create a new family
 */
export const useCreateFamily = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFamily,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.lists() });
    },
    onError: (error) => {
      console.error('Create family failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to update an existing family
 */
export const useUpdateFamily = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFamily,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: familyKeys.detail(variables.familyId) });
      queryClient.invalidateQueries({ queryKey: familyKeys.lists() });
    },
    onError: (error) => {
      console.error('Update family failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to delete a family
 */
export const useDeleteFamily = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFamily,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.lists() });
    },
    onError: (error) => {
      console.error('Delete family failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to add a member to a family
 */
export const useAddFamilyMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addFamilyMember,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: familyKeys.detail(variables.familyId) });
      queryClient.invalidateQueries({ queryKey: familyKeys.members(variables.familyId) });
    },
    onError: (error) => {
      console.error('Add family member failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to remove a member from a family
 */
export const useRemoveFamilyMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeFamilyMember,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: familyKeys.detail(variables.familyId) });
      queryClient.invalidateQueries({ queryKey: familyKeys.members(variables.familyId) });
    },
    onError: (error) => {
      console.error('Remove family member failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to update a family member's role
 */
export const useUpdateFamilyMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFamilyMember,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: familyKeys.detail(variables.familyId) });
      queryClient.invalidateQueries({ queryKey: familyKeys.members(variables.familyId) });
    },
    onError: (error) => {
      console.error('Update family member failed:', extractErrorMessage(error));
    },
  });
};