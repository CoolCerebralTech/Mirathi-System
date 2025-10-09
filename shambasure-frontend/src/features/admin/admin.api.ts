// FILE: src/features/admin/admin.api.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import type {
  User,
  UserQuery,
  PaginatedResponse,
} from '../../types';

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

const getUsers = async (params: UserQuery): Promise<PaginatedResponse<User>> => {
  const response = await apiClient.get('/admin/users', { params });
  return response.data;
};

const getUserById = async (userId: string): Promise<User> => {
  const response = await apiClient.get(`/admin/users/${userId}`);
  return response.data;
};

const updateUserRole = async (params: {
  userId: string;
  role: 'LAND_OWNER' | 'HEIR' | 'ADMIN';
}): Promise<User> => {
  const response = await apiClient.patch(`/admin/users/${params.userId}/role`, {
    role: params.role,
  });
  return response.data;
};

const suspendUser = async (userId: string): Promise<User> => {
  const response = await apiClient.patch(`/admin/users/${userId}/suspend`);
  return response.data;
};

const activateUser = async (userId: string): Promise<User> => {
  const response = await apiClient.patch(`/admin/users/${userId}/activate`);
  return response.data;
};

const deleteUser = async (userId: string): Promise<void> => {
  await apiClient.delete(`/admin/users/${userId}`);
};

const getAdminStats = async (): Promise<{
  totalUsers: number;
  totalWills: number;
  totalAssets: number;
  totalFamilies: number;
  recentActivity: number;
}> => {
  const response = await apiClient.get('/admin/stats');
  return response.data;
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

/**
 * Hook to fetch paginated list of all users (Admin only)
 * Supports filtering by role, search, sorting
 * 
 * @example
 * const { data: usersPage, isLoading } = useAdminUsers({ 
 *   page: 1, 
 *   limit: 20,
 *   role: 'LAND_OWNER',
 *   search: 'kamau' 
 * });
 */
export const useAdminUsers = (params: UserQuery = {}) => {
  const status = useAuthStore((state) => state.status);
  const userRole = useAuthStore((state) => state.user?.role);

  return useQuery({
    queryKey: adminKeys.userList(params),
    queryFn: () => getUsers(params),
    enabled: status === 'authenticated' && userRole === 'ADMIN',
    staleTime: 2 * 60 * 1000, // 2 minutes
    keepPreviousData: true, // Smooth pagination experience
  });
};

/**
 * Hook to fetch a single user's details (Admin only)
 * 
 * @example
 * const { data: user, isLoading } = useAdminUser(userId);
 */
export const useAdminUser = (userId: string) => {
  const status = useAuthStore((state) => state.status);
  const userRole = useAuthStore((state) => state.user?.role);

  return useQuery({
    queryKey: adminKeys.userDetail(userId),
    queryFn: () => getUserById(userId),
    enabled: status === 'authenticated' && userRole === 'ADMIN' && !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to update a user's role (Admin only)
 * 
 * @example
 * const updateRoleMutation = useUpdateUserRole();
 * updateRoleMutation.mutate({ userId: '...', role: 'ADMIN' });
 */
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserRole,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(variables.userId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.userLists() });
    },
    onError: (error) => {
      console.error('Update user role failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to suspend a user account (Admin only)
 * 
 * @example
 * const suspendMutation = useSuspendUser();
 * suspendMutation.mutate(userId);
 */
export const useSuspendUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: suspendUser,
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(userId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.userLists() });
    },
    onError: (error) => {
      console.error('Suspend user failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to activate a suspended user account (Admin only)
 * 
 * @example
 * const activateMutation = useActivateUser();
 * activateMutation.mutate(userId);
 */
export const useActivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activateUser,
    onSuccess: (_data, userId) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.userDetail(userId) });
      queryClient.invalidateQueries({ queryKey: adminKeys.userLists() });
    },
    onError: (error) => {
      console.error('Activate user failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to permanently delete a user (Admin only)
 * Use with extreme caution!
 * 
 * @example
 * const deleteMutation = useDeleteUser();
 * deleteMutation.mutate(userId);
 */
export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.userLists() });
    },
    onError: (error) => {
      console.error('Delete user failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook to fetch admin dashboard statistics
 * 
 * @example
 * const { data: stats, isLoading } = useAdminStats();
 */
export const useAdminStats = () => {
  const status = useAuthStore((state) => state.status);
  const userRole = useAuthStore((state) => state.user?.role);

  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: getAdminStats,
    enabled: status === 'authenticated' && userRole === 'ADMIN',
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
  });
};