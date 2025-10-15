// FILE: src/features/user/user.api.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import { toast } from 'sonner';
import {
  type User,
  UserSchema,
  type UpdateUserProfileInput,
  type UserQuery,
  type ChangePasswordInput,
  type SuccessResponse,
  SuccessResponseSchema,
  type Paginated,
  createPaginatedResponseSchema,
} from '../../types';

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// API ENDPOINTS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

const ApiEndpoints = {
  PROFILE: '/users/profile',
  CHANGE_PASSWORD: '/users/profile/change-password',
  USERS: '/users',
  USER_BY_ID: (userId: string) => `/users/${userId}`,
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// QUERY KEY FACTORY
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export const userKeys = {
  all: ['users'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserQuery) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// API FUNCTIONS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

// --- Current User Functions ---

/**
 * Fetches the profile of the currently authenticated user.
 */
const getProfile = async (): Promise<User> => {
  const { data } = await apiClient.get(ApiEndpoints.PROFILE);
  return UserSchema.parse(data); // Runtime validation
};

/**
 * Updates the profile of the currently authenticated user.
 */
const updateProfile = async (
  profileData: UpdateUserProfileInput,
): Promise<User> => {
  const { data } = await apiClient.patch(ApiEndpoints.PROFILE, profileData);
  return UserSchema.parse(data);
};

/**
 * Changes the password for the currently authenticated user.
 */
const changePassword = async (
  passwordData: ChangePasswordInput,
): Promise<SuccessResponse> => {
  const { data } = await apiClient.post(
    ApiEndpoints.CHANGE_PASSWORD,
    passwordData,
  );
  return SuccessResponseSchema.parse(data);
};

// --- Admin-Only Functions ---

/**
 * Fetches a paginated list of all users. (Admin only)
 */
const getUsers = async (params: UserQuery): Promise<Paginated<User>> => {
  const { data } = await apiClient.get(ApiEndpoints.USERS, { params });
  return createPaginatedResponseSchema(UserSchema).parse(data);
};

/**
 * Fetches a single user by their ID. (Admin only)
 */
const getUserById = async (userId: string): Promise<User> => {
  const { data } = await apiClient.get(ApiEndpoints.USER_BY_ID(userId));
  return UserSchema.parse(data);
};

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// REACT QUERY HOOKS
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

// --- Current User Hooks ---

/**
 * Hook to fetch the current user's profile.
 * Automatically enabled only when the user is authenticated.
 */
export const useProfile = () => {
  const { status } = useAuthStore();
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: getProfile,
    enabled: status === 'authenticated',
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
};

/**
 * Hook to update the current user's profile with optimistic updates.
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: updateProfile,
    onMutate: async (updatedProfile) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: userKeys.profile() });

      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData<User>(userKeys.profile());

      // Optimistically update to the new value
      if (previousProfile) {
        const newProfile = { ...previousProfile, ...updatedProfile };
        queryClient.setQueryData(userKeys.profile(), newProfile);
        setUser(newProfile); // Also update the auth store
      }

      return { previousProfile };
    },
    onError: (err, _, context) => {
      // Rollback on failure
      if (context?.previousProfile) {
        queryClient.setQueryData(userKeys.profile(), context.previousProfile);
        setUser(context.previousProfile);
      }
      toast.error(extractErrorMessage(err));
    },
    onSuccess: () => {
      toast.success('Profile updated successfully');
    },
    onSettled: () => {
      // Invalidate both profile and user list queries to ensure freshness
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

/**
 * Hook to change the user's password.
 */
export const useChangePassword = () => {
  return useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (err) => {
      toast.error(extractErrorMessage(err));
    },
  });
};

// --- Admin-Only Hooks ---

/**
 * Hook to fetch a paginated list of users. (Admin only)
 */
export const useUsers = (params: UserQuery = {}) => {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => getUsers(params),
    enabled: user?.role === 'ADMIN',
  });
};

/**
 * Hook to fetch a single user by ID. (Admin only)
 */
export const useUser = (userId?: string) => {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: userKeys.detail(userId!),
    queryFn: () => getUserById(userId!),
    // Query is only enabled if the user is an ADMIN and a userId is provided.
    enabled: !!userId && user?.role === 'ADMIN',
  });
};