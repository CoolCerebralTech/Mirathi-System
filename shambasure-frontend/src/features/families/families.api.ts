// FILE: src/features/families/families.api.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import {
  FamilyResponseSchema,
  CreateFamilyRequestSchema,
  AddFamilyMemberRequestSchema,
  UpdateFamilyMemberRequestSchema,
  type Family,
  type CreateFamilyInput,
  type AddFamilyMemberInput,
  type UpdateFamilyMemberInput,
} from '../../types';

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
  try {
    const parsed = CreateFamilyRequestSchema.parse(data);
    const response = await apiClient.post('/families', parsed);
    return FamilyResponseSchema.parse(response.data);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
};

const getMyFamilies = async (): Promise<Family[]> => {
  try {
    const response = await apiClient.get('/families');
    return response.data.map((f: unknown) => FamilyResponseSchema.parse(f));
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
};

const getFamilyById = async (id: string): Promise<Family> => {
  try {
    const response = await apiClient.get(`/families/${id}`);
    return FamilyResponseSchema.parse(response.data);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
};

const addFamilyMember = async (params: { familyId: string; data: AddFamilyMemberInput }) => {
  try {
    const parsed = AddFamilyMemberRequestSchema.parse(params.data);
    const response = await apiClient.post(`/families/${params.familyId}/members`, parsed);
    return response.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
};

const updateFamilyMember = async (params: {
  familyId: string;
  userId: string;
  data: UpdateFamilyMemberInput;
}) => {
  try {
    const parsed = UpdateFamilyMemberRequestSchema.parse(params.data);
    const response = await apiClient.patch(
      `/families/${params.familyId}/members/${params.userId}`,
      parsed
    );
    return response.data;
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
};

const removeFamilyMember = async (params: { familyId: string; userId: string }) => {
  try {
    await apiClient.delete(`/families/${params.familyId}/members/${params.userId}`);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
};

const deleteFamily = async (id: string) => {
  try {
    await apiClient.delete(`/families/${id}`);
  } catch (err) {
    throw new Error(extractErrorMessage(err));
  }
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

export const useMyFamilies = () => {
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  return useQuery({
    queryKey: familyKeys.lists(),
    queryFn: getMyFamilies,
    enabled: isAuthenticated,
  });
};

export const useFamily = (id: string) => {
  const isAuthenticated = useAuthStore((state) => state.status === 'authenticated');
  return useQuery({
    queryKey: familyKeys.detail(id),
    queryFn: () => getFamilyById(id),
    enabled: isAuthenticated && !!id,
  });
};

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

export const useUpdateFamilyMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFamilyMember,
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
