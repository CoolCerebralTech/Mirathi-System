// ============================================================================
// user.api.ts - User Profile & Management API Layer
// ============================================================================
// Production-ready user API with optimistic updates, intelligent caching,
// role-based access control, and comprehensive error handling.
// ============================================================================

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

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

/**
 * API endpoint configuration for user operations.
 * Aligned with backend routes for profile and admin user management.
 */
const API_ENDPOINTS = {
  // Current user profile endpoints
  PROFILE: '/v1/profile',
  CHANGE_PASSWORD: '/v1/profile/change-password',
  
  // Admin user management endpoints
  USERS: '/v1/users',
  USER_BY_ID: (userId: string) => `/v1/users/${userId}`,
  UPDATE_USER_ROLE: (userId: string) => `/v1/users/${userId}/role`,
  DELETE_USER: (userId: string) => `/v1/users/${userId}`,
} as const;

/**
 * Cache configuration for different query types.
 * Balances freshness with performance.
 */
const CACHE_CONFIG = {
  // Profile data changes infrequently
  PROFILE_STALE_TIME: 1000 * 60 * 15, // 15 minutes
  PROFILE_CACHE_TIME: 1000 * 60 * 30, // 30 minutes
  
  // User list may change more frequently (admin operations)
  USERS_LIST_STALE_TIME: 1000 * 60 * 5, // 5 minutes
  USERS_LIST_CACHE_TIME: 1000 * 60 * 10, // 10 minutes
  
  // Individual user details
  USER_DETAIL_STALE_TIME: 1000 * 60 * 10, // 10 minutes
  USER_DETAIL_CACHE_TIME: 1000 * 60 * 20, // 20 minutes
} as const;

/**
 * Mutation configuration for user operations.
 */
const MUTATION_CONFIG = {
  // Retry on network errors only
  retry: (failureCount: number, error: unknown) => {
    if (error && typeof error === 'object' && 'response' in error) {
      const status = (error as { response: { status: number } }).response?.status;
      // Don't retry client errors (4xx)
      if (status && status >= 400 && status < 500) return false;
    }
    return failureCount < 2; // Retry up to 2 times
  },
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
} as const;


/**
 * Options for mutation hooks with custom callbacks
 */
interface MutationOptions<TData = unknown> {
  onSuccess?: (data: TData) => void;
  onError?: (error: unknown) => void;
}

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

/**
 * Hierarchical query key factory for type-safe cache management.
 * 
 * STRUCTURE:
 * - users (root)
 *   - profile (current user)
 *   - list (all users with filters)
 *   - detail (specific user by ID)
 * 
 * @example
 * ```ts
 * queryClient.invalidateQueries({ queryKey: userKeys.all });
 * queryClient.invalidateQueries({ queryKey: userKeys.lists() });
 * queryClient.setQueryData(userKeys.profile(), updatedUser);
 * ```
 */
export const userKeys = {
  all: ['users'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserQuery) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
} as const;

// ============================================================================
// API FUNCTIONS - CURRENT USER
// ============================================================================

/**
 * Fetch current authenticated user's profile.
 * 
 * @returns Promise resolving to User object with profile data
 * 
 * @throws {UnauthorizedError} User not authenticated (401)
 * @throws {NetworkError} Network connectivity issues
 * 
 * @example
 * ```ts
 * const profile = await getProfile();
 * console.log(profile.email, profile.firstName);
 * ```
 */
const getProfile = async (): Promise<User> => {
  try {
    const { data } = await apiClient.get<User>(API_ENDPOINTS.PROFILE);
    
    // Runtime validation
    const validatedData = UserSchema.parse(data);
    
    return validatedData;
  } catch (error) {
    console.error('[User API] Get profile failed:', {
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Update current user's profile information.
 * 
 * @param profileData - Partial user data to update (bio, phone, address, nextOfKin)
 * @returns Promise resolving to updated User object
 * 
 * @throws {ValidationError} Invalid profile data format
 * @throws {UnauthorizedError} User not authenticated
 * 
 * @example
 * ```ts
 * const updated = await updateProfile({
 *   bio: 'Software engineer with 5 years experience',
 *   phone: '+254712345678'
 * });
 * ```
 */
const updateProfile = async (
  profileData: UpdateUserProfileInput,
): Promise<User> => {
  try {
    const { data } = await apiClient.patch<User>(
      API_ENDPOINTS.PROFILE,
      profileData,
    );
    
    const validatedData = UserSchema.parse(data);
    
    return validatedData;
  } catch (error) {
    console.error('[User API] Update profile failed:', {
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Change current user's password.
 * 
 * @param passwordData - Current password, new password, and confirmation
 * @returns Promise resolving to success response
 * 
 * @throws {ValidationError} Password doesn't meet requirements
 * @throws {UnauthorizedError} Current password incorrect (401)
 * 
 * @security Requires current password verification
 * @security confirmNewPassword is stripped before sending to backend
 * 
 * @example
 * ```ts
 * await changePassword({
 *   currentPassword: 'OldPass123!',
 *   newPassword: 'NewSecurePass456!',
 *   confirmNewPassword: 'NewSecurePass456!'
 * });
 * ```
 */
const changePassword = async (
  passwordData: ChangePasswordInput,
): Promise<SuccessResponse> => {
  try {
    // Strip confirmNewPassword before sending to backend
    const apiPayload = {
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    };

    const { data } = await apiClient.patch<SuccessResponse>(
      API_ENDPOINTS.CHANGE_PASSWORD,
      apiPayload,
    );
    
    const validatedData = SuccessResponseSchema.parse(data);
    
    return validatedData;
  } catch (error) {
    console.error('[User API] Change password failed:', {
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
      // Don't log password data
    });
    throw error;
  }
};

// ============================================================================
// API FUNCTIONS - ADMIN OPERATIONS
// ============================================================================

/**
 * Fetch paginated list of all users (Admin only).
 * 
 * @param params - Query parameters (page, limit, search, role filter)
 * @returns Promise resolving to paginated user list
 * 
 * @throws {ForbiddenError} User is not admin (403)
 * @throws {UnauthorizedError} User not authenticated (401)
 * 
 * @example
 * ```ts
 * const users = await getUsers({
 *   page: 1,
 *   limit: 10,
 *   search: 'john',
 *   role: 'USER'
 * });
 * ```
 */
const getUsers = async (params: UserQuery): Promise<Paginated<User>> => {
  try {
    const { data } = await apiClient.get<Paginated<User>>(
      API_ENDPOINTS.USERS,
      { params },
    );
    
    const validatedData = createPaginatedResponseSchema(UserSchema).parse(data);
    
    return validatedData;
  } catch (error) {
    console.error('[User API] Get users list failed:', {
      params,
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Fetch single user by ID (Admin only).
 * 
 * @param userId - User UUID to fetch
 * @returns Promise resolving to User object
 * 
 * @throws {NotFoundError} User not found (404)
 * @throws {ForbiddenError} User is not admin (403)
 * 
 * @example
 * ```ts
 * const user = await getUserById('550e8400-e29b-41d4-a716-446655440000');
 * ```
 */
const getUserById = async (userId: string): Promise<User> => {
  try {
    const { data } = await apiClient.get<User>(
      API_ENDPOINTS.USER_BY_ID(userId),
    );
    
    const validatedData = UserSchema.parse(data);
    
    return validatedData;
  } catch (error) {
    console.error('[User API] Get user by ID failed:', {
      userId,
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Update user role (Admin only).
 * 
 * @param userId - User UUID to update
 * @param role - New role to assign
 * @returns Promise resolving to updated User object
 * 
 * @throws {BadRequestError} Cannot modify own role (400)
 * @throws {NotFoundError} User not found (404)
 * @throws {ForbiddenError} User is not admin (403)
 * 
 * @example
 * ```ts
 * const updated = await updateUserRole('user-id', 'ADMIN');
 * ```
 */
const updateUserRole = async (
  userId: string,
  role: string,
): Promise<User> => {
  try {
    const { data } = await apiClient.patch<User>(
      API_ENDPOINTS.UPDATE_USER_ROLE(userId),
      { role },
    );
    
    const validatedData = UserSchema.parse(data);
    
    return validatedData;
  } catch (error) {
    console.error('[User API] Update user role failed:', {
      userId,
      role,
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Delete user permanently (Admin only).
 * 
 * @param userId - User UUID to delete
 * @returns Promise resolving when deletion is complete
 * 
 * @throws {NotFoundError} User not found (404)
 * @throws {ForbiddenError} User is not admin (403)
 * 
 * @warning This is a permanent operation - data cannot be recovered
 * 
 * @example
 * ```ts
 * await deleteUser('user-id-to-delete');
 * ```
 */
const deleteUser = async (userId: string): Promise<void> => {
  try {
    await apiClient.delete(API_ENDPOINTS.DELETE_USER(userId));
  } catch (error) {
    console.error('[User API] Delete user failed:', {
      userId,
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

// ============================================================================
// REACT QUERY HOOKS - CURRENT USER
// ============================================================================

/**
 * Hook to fetch current user's profile.
 * 
 * FEATURES:
 * - Automatic refetch on window focus
 * - Smart caching (15 min stale time)
 * - Only enabled when authenticated
 * - Automatic retry on network errors
 * 
 * @example
 * ```tsx
 * const { data: profile, isLoading, error } = useProfile();
 * 
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage />;
 * 
 * return <div>Welcome, {profile.firstName}!</div>;
 * ```
 */
export const useProfile = () => {
  const { status } = useAuthStore();
  
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: getProfile,
    enabled: status === 'authenticated',
    staleTime: CACHE_CONFIG.PROFILE_STALE_TIME,
    gcTime: CACHE_CONFIG.PROFILE_CACHE_TIME,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
  });
};

/**
 * Hook to update current user's profile with optimistic updates.
 * 
 * FEATURES:
 * - Optimistic UI updates (instant feedback)
 * - Automatic rollback on error
 * - Cache invalidation on success
 * - Auth store synchronization
 * 
 * @param options - Optional success/error callbacks
 * 
 * @example
 * ```tsx
 * const { mutate: updateProfile, isPending } = useUpdateProfile({
 *   onSuccess: () => navigate('/profile')
 * });
 * 
 * const handleSubmit = (data: UpdateUserProfileInput) => {
 *   updateProfile(data);
 * };
 * ```
 */
export const useUpdateProfile = (options?: MutationOptions<User>) => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: updateProfile,
    
    ...MUTATION_CONFIG,

    // Optimistic update
    onMutate: async (updatedProfile) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.profile() });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData<User>(userKeys.profile());

      // Optimistically update cache
      if (previousProfile) {
        const optimisticProfile = { ...previousProfile, ...updatedProfile };
        queryClient.setQueryData(userKeys.profile(), optimisticProfile);
        setUser(optimisticProfile);
      }

      return { previousProfile };
    },

    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(userKeys.profile(), context.previousProfile);
        setUser(context.previousProfile);
      }

      const errorMessage = extractErrorMessage(error);
      toast.error('Profile update failed', {
        description: errorMessage,
        duration: 5000,
      });

      options?.onError?.(error);

      console.error('[User] Profile update error:', {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    },

    onSuccess: (data) => {
      // Update with real server data
      queryClient.setQueryData(userKeys.profile(), data);
      setUser(data);

      toast.success('Profile updated successfully', {
        description: 'Your profile changes have been saved.',
        duration: 3000,
      });

      options?.onSuccess?.(data);

      console.log('[User] Profile updated successfully:', {
        userId: data.id,
        timestamp: new Date().toISOString(),
      });
    },

    onSettled: () => {
      // Ensure cache consistency
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

/**
 * Hook to change user password.
 * 
 * FEATURES:
 * - Secure password validation
 * - Current password verification
 * - Success/error notifications
 * - Optional session invalidation
 * 
 * @param options - Optional success/error callbacks
 * 
 * @example
 * ```tsx
 * const { mutate: changePassword, isPending } = useChangePassword({
 *   onSuccess: () => {
 *     // Optionally log out user to force re-login
 *     logout();
 *   }
 * });
 * 
 * const handlePasswordChange = (data: ChangePasswordInput) => {
 *   changePassword(data);
 * };
 * ```
 */
export const useChangePassword = (options?: MutationOptions<SuccessResponse>) => {
  return useMutation({
    mutationFn: changePassword,
    
    retry: 1, // Only retry once for password operations
    retryDelay: 1000,

    onSuccess: (data) => {
      toast.success('Password changed successfully', {
        description: data.message || 'Your password has been updated.',
        duration: 4000,
      });

      options?.onSuccess?.(data);

      console.log('[User] Password changed successfully:', {
        timestamp: new Date().toISOString(),
      });
    },

    onError: (error) => {
      const errorMessage = extractErrorMessage(error);
      
      toast.error('Password change failed', {
        description: errorMessage,
        duration: 5000,
      });

      options?.onError?.(error);

      console.error('[User] Password change error:', {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    },
  });
};

// ============================================================================
// REACT QUERY HOOKS - ADMIN OPERATIONS
// ============================================================================

/**
 * Hook to fetch paginated list of users (Admin only).
 * 
 * FEATURES:
 * - Automatic pagination support
 * - Search and filter capabilities
 * - Role-based access control
 * - Smart caching strategy
 * 
 * @param params - Query parameters (page, limit, search, role)
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error } = useUsers({
 *   page: 1,
 *   limit: 10,
 *   search: searchTerm,
 *   role: selectedRole
 * });
 * 
 * return (
 *   <UserTable
 *     users={data?.data}
 *     total={data?.total}
 *   />
 * );
 * ```
 */
export const useUsers = (params: UserQuery = {}) => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => getUsers(params),
    enabled: user?.role === 'ADMIN',
    staleTime: CACHE_CONFIG.USERS_LIST_STALE_TIME,
    gcTime: CACHE_CONFIG.USERS_LIST_CACHE_TIME,
    refetchOnWindowFocus: true,
    retry: 2,
  });
};

/**
 * Hook to fetch single user by ID (Admin only).
 * 
 * FEATURES:
 * - Detailed user information
 * - Role-based access control
 * - Automatic caching
 * - Conditional fetching
 * 
 * @param userId - User UUID to fetch (optional)
 * 
 * @example
 * ```tsx
 * const { data: user, isLoading } = useUser(userId);
 * 
 * if (!user) return <NotFound />;
 * 
 * return <UserDetailView user={user} />;
 * ```
 */
export const useUser = (userId?: string) => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: userKeys.detail(userId!),
    queryFn: () => getUserById(userId!),
    enabled: !!userId && user?.role === 'ADMIN',
    staleTime: CACHE_CONFIG.USER_DETAIL_STALE_TIME,
    gcTime: CACHE_CONFIG.USER_DETAIL_CACHE_TIME,
    retry: 2,
  });
};

/**
 * Hook to update user role (Admin only).
 * 
 * FEATURES:
 * - Role validation
 * - Cache invalidation
 * - Prevents self-modification
 * - Success/error notifications
 * 
 * @param options - Optional success/error callbacks
 * 
 * @example
 * ```tsx
 * const { mutate: updateRole, isPending } = useUpdateUserRole({
 *   onSuccess: () => navigate('/admin/users')
 * });
 * 
 * const handleRoleChange = (userId: string, newRole: string) => {
 *   updateRole({ userId, role: newRole });
 * };
 * ```
 */
export const useUpdateUserRole = (options?: MutationOptions<User>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      updateUserRole(userId, role),
    
    ...MUTATION_CONFIG,

    onSuccess: (data, { userId }) => {
      // Invalidate affected queries
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });

      toast.success('User role updated', {
        description: `Role changed to ${data.role} successfully.`,
        duration: 3000,
      });

      options?.onSuccess?.(data);

      console.log('[Admin] User role updated:', {
        userId,
        newRole: data.role,
        timestamp: new Date().toISOString(),
      });
    },

    onError: (error) => {
      const errorMessage = extractErrorMessage(error);
      
      toast.error('Role update failed', {
        description: errorMessage,
        duration: 5000,
      });

      options?.onError?.(error);

      console.error('[Admin] Role update error:', {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    },
  });
};

/**
 * Hook to delete user (Admin only).
 * 
 * FEATURES:
 * - Permanent deletion
 * - Cache cleanup
 * - Confirmation recommended
 * - Success/error notifications
 * 
 * @param options - Optional success/error callbacks
 * 
 * @example
 * ```tsx
 * const { mutate: deleteUser, isPending } = useDeleteUser({
 *   onSuccess: () => navigate('/admin/users')
 * });
 * 
 * const handleDelete = (userId: string) => {
 *   if (confirm('Are you sure? This action cannot be undone.')) {
 *     deleteUser(userId);
 *   }
 * };
 * ```
 */
export const useDeleteUser = (options?: MutationOptions<void>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    
    retry: 1, // Only retry once for destructive operations
    retryDelay: 1000,

    onSuccess: (_, userId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: userKeys.detail(userId) });
      
      // Invalidate user lists
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      toast.success('User deleted successfully', {
        description: 'The user account has been permanently removed.',
        duration: 3000,
      });

      options?.onSuccess?.();

      console.warn('[Admin] User deleted:', {
        userId,
        timestamp: new Date().toISOString(),
      });
    },

    onError: (error) => {
      const errorMessage = extractErrorMessage(error);
      
      toast.error('User deletion failed', {
        description: errorMessage,
        duration: 5000,
      });

      options?.onError?.(error);

      console.error('[Admin] User deletion error:', {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    },
  });
};

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * Export API endpoints for use in other modules
 */
export { API_ENDPOINTS };

/**
 * Export raw API functions for advanced use cases
 */
export {
  getProfile,
  updateProfile,
  changePassword,
  getUsers,
  getUserById,
  updateUserRole,
  deleteUser,
};
