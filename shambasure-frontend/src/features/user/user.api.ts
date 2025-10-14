// FILE: src/features/user/user.api.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useAuthStore, useAuthActions, useIsAuthenticated } from '../../store/auth.store';
import type { User, UpdateUserProfileInput, UserQuery } from '../../types';
import type { ChangePasswordInput } from '../../types';
import type { PaginatedResponse } from '../../types';

// =_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_
// QUERY KEYS FACTORY
// =_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_

export const userKeys = {
  all: ['users'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: Partial<UserQuery>) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// =_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_
// API FUNCTIONS
// =_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_

// --- Current User Functions ---
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

// --- Admin-Only Functions ---
// UPGRADE: Fully type-safe implementation
const getUsers = async (params: Partial<UserQuery>): Promise<PaginatedResponse<User>> => {
  const response = await apiClient.get('/users', { params });
  return response.data;
};

const getUserById = async (userId: string): Promise<User> => {
  const response = await apiClient.get(`/users/${userId}`);
  return response.data;
};

// =_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_
// REACT QUERY HOOKS
// =_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_=_

// --- Current User Hooks ---
export const useProfile = () => {
  const isAuthenticated = useIsAuthenticated();
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: getProfile,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthActions();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(userKeys.profile(), updatedUser);
      setUser(updatedUser);
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: changePassword,
  });
};

// --- Admin-Only Hooks ---
export const useUsers = (params: Partial<UserQuery> = {}) => {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => getUsers(params),
    // UPGRADE: Security fix - only admins can call this.
    enabled: user?.role === 'ADMIN',
  });
};

export const useUser = (userId: string) => {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => getUserById(userId),
    // UPGRADE: Security fix - only admins can call this.
    enabled: !!userId && user?.role === 'ADMIN',
  });
};