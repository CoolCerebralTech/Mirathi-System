// FILE: src/features/user/user.api.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import { authKeys } from '../auth/auth.api';
import type {
  User,
  UpdateUserProfileInput,
  ChangePasswordInput,
  UserQuery,
  PaginatedResponse,
} from '../../types';

// ============================================================================
// QUERY KEYS FACTORY
// ============================================================================

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserQuery) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
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

const getUsers = async (params: UserQuery): Promise<PaginatedResponse<User>> => {
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

/**
 * Hook to fetch the authenticated user's profile
 * Only runs when user is authenticated
 * 
 * @example
 * const { data: profile, isLoading } = useProfile();
 */
export const useProfile = () => {
  const status = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: getProfile,
    enabled: status === 'authenticated',
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (formerly cacheTime)
  });
};

/**
 * Hook to update the authenticated user's profile
 * 
 * @example
 * const updateMutation = useUpdateProfile();
 * updateMutation.mutate({ bio: 'New bio', phoneNumber: '...' });
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: updateProfile,
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.profile() });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData<User>(userKeys.profile());

      // Optimistically update
      if (previousProfile) {
        queryClient.setQueryData<User>(userKeys.profile(), {
          ...previousProfile,
          profile: {
            ...previousProfile.profile,
            ...newData,
          },
        });
      }

      return { previousProfile };
    },
    onSuccess: (updatedUser) => {
      // Update Zustand store
      setUser(updatedUser);

      // Update cache with server response
      queryClient.setQueryData(userKeys.profile(), updatedUser);
      queryClient.setQueryData(authKeys.profile(), updatedUser);
    },
    onError: (error, _newData, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(userKeys.profile(), context.previousProfile);
      }
      console.error('Profile update failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to change user password
 * 
 * @example
 * const changePasswordMutation = useChangePassword();
 * changePasswordMutation.mutate({ currentPassword: '...', newPassword: '...' });
 */
export const useChangePassword = () => {
  return useMutation({
    mutationFn: changePassword,
    onError: (error) => {
      console.error('Password change failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to fetch paginated list of users (Admin only)
 * 
 * @example
 * const { data: usersPage, isLoading } = useUsers({ page: 1, limit: 10 });
 */
export const useUsers = (params: UserQuery) => {
  const status = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => getUsers(params),
    enabled: status === 'authenticated',
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to fetch a single user by ID
 * 
 * @example
 * const { data: user, isLoading } = useUser(userId);
 */
export const useUser = (userId: string) => {
  const status = useAuthStore((state) => state.status);

  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => getUserById(userId),
    enabled: status === 'authenticated' && !!userId,
    staleTime: 5 * 60 * 1000,
  });
};