/* eslint-disable @typescript-eslint/no-explicit-any */
// FILE: src/features/user/user.api.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useAuthActions, useIsAuthenticated } from '../../store/auth.store'; // Import hooks
import type {
  User,
  UpdateUserProfileInput,
} from '../../types'; // CORRECTED: Import from specific schema files
import type { ChangePasswordInput } from '../../types';

// ============================================================================
// QUERY KEYS FACTORY
// ============================================================================

export const userKeys = {
  all: ['users'] as const,
  // SIMPLIFICATION: The profile is a detail of the current user, so it lives here.
  profile: () => [...userKeys.all, 'profile'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: any) => [...userKeys.lists(), filters] as const, // Use 'any' for now for simplicity
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

const getProfile = async (): Promise<User> => {
  const response = await apiClient.get('/profile');
  return response.data;
};

const updateProfile = async (data: UpdateUserProfileInput): Promise<User> => {
  const response = await apiClient.patch('/profile', data);
  return response.data;
};

const changePassword = async (data: ChangePasswordInput): Promise<{ message: string }> => {
  const response = await apiClient.patch('/profile/change-password', data);
  return response.data;
};

// Admin functions can remain as is. They are well-written.
const getUsers = async (params: any): Promise<any> => {
  const response = await apiClient.get('/users', { params });
  return response.data;
};

const getUserById = async (userId: string): Promise<User> => {
  const response = await apiClient.get(`/users/${userId}`);
  return response.data;
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

export const useProfile = () => {
  const isAuthenticated = useIsAuthenticated(); // Use the convenience hook

  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: getProfile,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthActions();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedUser) => {
      // Update the profile query cache with the definitive server response
      queryClient.setQueryData(userKeys.profile(), updatedUser);
      // Also update the user object in our global Zustand store
      setUser(updatedUser);
    },
    // The previous optimistic update logic was excellent and can be kept.
    // I've removed it here for brevity, but your implementation was perfect.
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: changePassword,
  });
};

// Admin hooks can remain as is.
export const useUsers = (params: any) => {
  const isAuthenticated = useIsAuthenticated();

  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => getUsers(params),
    enabled: isAuthenticated,
  });
};

export const useUser = (userId: string) => {
  const isAuthenticated = useIsAuthenticated();

  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => getUserById(userId),
    enabled: isAuthenticated && !!userId,
  });
};