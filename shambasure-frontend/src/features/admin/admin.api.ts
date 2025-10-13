// FILE: src/features/admin/admin.api.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import type { User, UserRole, UserQuery } from '../../types';
import type { PaginatedResponse } from '../../types';

// ============================================================================
// QUERY KEYS FACTORY
// ============================================================================

export const adminKeys = {
  all: ['admin'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  userLists: () => [...adminKeys.users(), 'list'] as const,
  userList: (filters: UserQuery) => [...adminKeys.userLists(), filters] as const,
  userDetails: () => [...adminKeys.users(), 'detail'] as const,
  userDetail: (id: string) => [...adminKeys.userDetails(), id] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

// UPGRADE: All admin user routes are under /users, not /admin/users
const getUsers = async (params: UserQuery): Promise<PaginatedResponse<User>> => {
  const response = await apiClient.get('/users', { params });
  return response.data;
};

const getUserById = async (userId: string): Promise<User> => {
  const response = await apiClient.get(`/users/${userId}`);
  return response.data;
};

const updateUserRole = async (params: { userId: string; role: UserRole }): Promise<User> => {
  const response = await apiClient.patch(`/users/${params.userId}/role`, { role: params.role });
  return response.data;
};

const deleteUser = async (userId: string): Promise<void> => {
  await apiClient.delete(`/users/${userId}`);
};

// NOTE: suspendUser and activateUser hooks are removed as they don't have
// corresponding endpoints in the users.controller.ts you shared.
// They can be added back if the backend implements these routes.

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

export const useAdminUsers = (params: UserQuery = {}) => {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: adminKeys.userList(params),
    queryFn: () => getUsers(params),
    enabled: user?.role === 'ADMIN',
  });
};

export const useAdminUser = (userId: string) => {
  const user = useAuthStore((state) => state.user);
  return useQuery({
    queryKey: adminKeys.userDetail(userId),
    queryFn: () => getUserById(userId),
    enabled: !!userId && user?.role === 'ADMIN',
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserRole,
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.userLists() });
      queryClient.setQueryData(adminKeys.userDetail(updatedUser.id), updatedUser);
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.userLists() });
    },
  });
};