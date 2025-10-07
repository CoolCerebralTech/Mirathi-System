// FILE: src/features/families/families.api.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import type {
  Family,
  CreateFamilyInput,
  UpdateFamilyInput,
  AddFamilyMemberInput,
  UpdateFamilyMemberInput,
} from '../../types';

// ============================================================================
// QUERY KEYS FACTORY
// ============================================================================

export const familyKeys = {
  all: ['families'] as const,
  lists: () => [...familyKeys.all, 'list'] as const,
  details: () => [...familyKeys.all, 'detail'] as const,
  detail: (id: string) => [...familyKeys.details(), id] as const,
  members: (familyId: string) => [...familyKeys.detail(familyId), 'members'] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

const getFamilies = async (): Promise<Family[]> => {
  const response = await apiClient.get('/succession/families');
  return response.data;
};

const getFamilyById = async (familyId: string): Promise<Family> => {
  const response = await apiClient.get(`/succession/families/${familyId}`);
  return response.data;
};

const createFamily = async (data: CreateFamilyInput): Promise<Family> => {
  const response = await apiClient.post('/succession/families', data);
  return response.data;
};

const updateFamily = async (params: {
  familyId: string;
  data: UpdateFamilyInput;
}): Promise<Family> => {
  const response = await apiClient.patch(`/succession/families/${params.familyId}`, params.data);
  return response.data;
};

const deleteFamily = async (familyId: string): Promise<void> => {
  await apiClient.delete(`/succession/families/${familyId}`);
};

const addFamilyMember = async (params: {
  familyId: string;
  data: AddFamilyMemberInput;
}): Promise<void> => {
  await apiClient.post(`/succession/families/${params.familyId}/members`, params.data);
};

const updateFamilyMember = async (params: {
  familyId: string;
  userId: string;
  data: UpdateFamilyMemberInput;
}): Promise<void> => {
  await apiClient.patch(
    `/succession/families/${params.familyId}/members/${params.userId}`,
    params.data
  );
};

const removeFamilyMember = async (params: {
  familyId: string;
  userId: string;
}): Promise<void> => {
  await apiClient.delete(`/succession/families/${params.familyId}/members/${params.userId}`);
};

// ============================================================================
// REACT QUERY HOOKS - FAMILIES
// ============================================================================

/**
 * Hook to fetch all families for the authenticated user
 * 
 * @example
 * const { data: families, isLoading } = useFamilies();
 */
export const useFamilies = () => {
  const status = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: familyKeys.lists(),
    queryFn: getFamilies,
    enabled: status === 'authenticated',
    staleTime: 5 * 60 * 1000, // 5 minutes - families don't change often
  });
};

/**
 * Hook to fetch a single family with all members
 * 
 * @example
 * const { data: family, isLoading } = useFamily(familyId);
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
 * 
 * @example
 * const createMutation = useCreateFamily();
 * createMutation.mutate({ name: 'Kamau Family' });
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
 * Hook to update family information
 * 
 * @example
 * const updateMutation = useUpdateFamily();
 * updateMutation.mutate({ familyId: '...', data: { name: 'Updated Name' } });
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
 * 
 * @example
 * const deleteMutation = useDeleteFamily();
 * deleteMutation.mutate(familyId);
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

// ============================================================================
// REACT QUERY HOOKS - FAMILY MEMBERS
// ============================================================================

/**
 * Hook to add a new member to a family
 * 
 * @example
 * const addMutation = useAddFamilyMember();
 * addMutation.mutate({ 
 *   familyId: '...', 
 *   data: { userId: '...', role: 'CHILD' } 
 * });
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
 * Hook to update a family member's role
 * 
 * @example
 * const updateMutation = useUpdateFamilyMember();
 * updateMutation.mutate({ 
 *   familyId: '...', 
 *   userId: '...', 
 *   data: { role: 'SPOUSE' } 
 * });
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

/**
 * Hook to remove a member from a family
 * 
 * @example
 * const removeMutation = useRemoveFamilyMember();
 * removeMutation.mutate({ familyId: '...', userId: '...' });
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