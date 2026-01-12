// ============================================================================
// user.api.ts - User Management API Layer
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '@/lib/apiClient';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';
import {
  type GetMyUserResponse,
  type UpdateMyUserInput,
  type UpdateMyUserResponse,
  type DeactivateMyAccountInput,
  type DeactivateMyAccountResponse,
  GetMyUserResponseSchema,
  UpdateMyUserResponseSchema,
  DeactivateMyAccountResponseSchema,
} from '@/types/user.types';
import {
  type GetMyProfileResponse,
  type UpdateMyProfileInput,
  type UpdateMyProfileResponse,
  type UpdateMarketingPreferencesInput,
  type UpdateMarketingPreferencesResponse,
  type RemoveAddressResponse,
  GetMyProfileResponseSchema,
  UpdateMyProfileResponseSchema,
  UpdateMarketingPreferencesResponseSchema,
  RemoveAddressResponseSchema,
} from '@/types/profile.types';

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

/**
 * API endpoint configuration for user operations
 * Prefix: /accounts (to route through Gateway to Accounts Service)
 */
const API_ENDPOINTS = {
  // Current user endpoints
  ME: '/accounts/me',
  DEACTIVATE_ACCOUNT: '/accounts/me/deactivate',
  
  // Profile endpoints
  PROFILE: '/accounts/me/profile',
  MARKETING_PREFERENCES: '/accounts/me/marketing-preferences',
  ADDRESS_REMOVE: '/accounts/me/address',
} as const;

/**
 * Cache configuration for different query types
 */
const CACHE_CONFIG = {
  USER_STALE_TIME: 1000 * 60 * 15, // 15 minutes
  USER_CACHE_TIME: 1000 * 60 * 30, // 30 minutes
  PROFILE_STALE_TIME: 1000 * 60 * 10, // 10 minutes
  PROFILE_CACHE_TIME: 1000 * 60 * 20, // 20 minutes
} as const;

/**
 * Mutation configuration
 */
const MUTATION_CONFIG = {
  retry: (failureCount: number, error: unknown) => {
    if (error && typeof error === 'object' && 'response' in error) {
      const status = (error as { response: { status: number } }).response?.status;
      if (status && status >= 400 && status < 500) return false;
    }
    return failureCount < 2;
  },
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
} as const;

interface MutationOptions<TData = unknown> {
  onSuccess?: (data: TData) => void;
  onError?: (error: unknown) => void;
}

// ============================================================================
// QUERY KEY FACTORY
// ============================================================================

export const userKeys = {
  all: ['users'] as const,
  current: () => [...userKeys.all, 'current'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
  sessions: () => [...userKeys.all, 'sessions'] as const,
} as const;

// ============================================================================
// API FUNCTIONS - USER MANAGEMENT
// ============================================================================

/**
 * Get current user information
 */
const getCurrentUser = async (): Promise<GetMyUserResponse> => {
  try {
    const { data } = await apiClient.get<GetMyUserResponse>(API_ENDPOINTS.ME);
    const validatedData = GetMyUserResponseSchema.parse(data);
    return validatedData;
  } catch (error) {
    console.error('[User API] Get current user failed:', {
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Update current user information
 */
const updateCurrentUser = async (userData: UpdateMyUserInput): Promise<UpdateMyUserResponse> => {
  try {
    const { data } = await apiClient.patch<UpdateMyUserResponse>(
      API_ENDPOINTS.ME,
      userData,
    );
    const validatedData = UpdateMyUserResponseSchema.parse(data);
    return validatedData;
  } catch (error) {
    console.error('[User API] Update current user failed:', {
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Deactivate user account
 */
const deactivateAccount = async (deactivateData: DeactivateMyAccountInput): Promise<DeactivateMyAccountResponse> => {
  try {
    const { data } = await apiClient.post<DeactivateMyAccountResponse>(
      API_ENDPOINTS.DEACTIVATE_ACCOUNT,
      deactivateData,
    );
    const validatedData = DeactivateMyAccountResponseSchema.parse(data);
    return validatedData;
  } catch (error) {
    console.error('[User API] Deactivate account failed:', {
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

// ============================================================================
// API FUNCTIONS - PROFILE MANAGEMENT
// ============================================================================

/**
 * Get current user profile
 */
const getCurrentProfile = async (): Promise<GetMyProfileResponse> => {
  try {
    const { data } = await apiClient.get<GetMyProfileResponse>(API_ENDPOINTS.PROFILE);
    const validatedData = GetMyProfileResponseSchema.parse(data);
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
 * Update current user profile
 */
const updateCurrentProfile = async (profileData: UpdateMyProfileInput): Promise<UpdateMyProfileResponse> => {
  try {
    const { data } = await apiClient.patch<UpdateMyProfileResponse>(
      API_ENDPOINTS.PROFILE,
      profileData,
    );
    const validatedData = UpdateMyProfileResponseSchema.parse(data);
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
 * Update marketing preferences
 */
const updateMarketingPreferences = async (preferencesData: UpdateMarketingPreferencesInput): Promise<UpdateMarketingPreferencesResponse> => {
  try {
    const { data } = await apiClient.patch<UpdateMarketingPreferencesResponse>(
      API_ENDPOINTS.MARKETING_PREFERENCES,
      preferencesData,
    );
    const validatedData = UpdateMarketingPreferencesResponseSchema.parse(data);
    return validatedData;
  } catch (error) {
    console.error('[User API] Update marketing preferences failed:', {
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Remove address from profile
 */
const removeAddress = async (): Promise<RemoveAddressResponse> => {
  try {
    const { data } = await apiClient.delete<RemoveAddressResponse>(
      API_ENDPOINTS.ADDRESS_REMOVE,
    );
    const validatedData = RemoveAddressResponseSchema.parse(data);
    return validatedData;
  } catch (error) {
    console.error('[User API] Remove address failed:', {
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

// ============================================================================
// REACT QUERY HOOKS - USER MANAGEMENT
// ============================================================================

/**
 * Hook to fetch current user information
 */
export const useCurrentUser = () => {
  const { status } = useAuthStore();
  
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: getCurrentUser,
    enabled: status === 'authenticated',
    staleTime: CACHE_CONFIG.USER_STALE_TIME,
    gcTime: CACHE_CONFIG.USER_CACHE_TIME,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
  });
};

/**
 * Hook to update current user information
 */
export const useUpdateCurrentUser = (options?: MutationOptions<UpdateMyUserResponse>) => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: updateCurrentUser,
    ...MUTATION_CONFIG,

    onMutate: async (updatedUser) => {
      await queryClient.cancelQueries({ queryKey: userKeys.current() });
      const previousUser = queryClient.getQueryData<GetMyUserResponse>(userKeys.current());

      if (previousUser) {
        const optimisticUser = { ...previousUser, ...updatedUser };
        queryClient.setQueryData(userKeys.current(), optimisticUser);
        setUser(optimisticUser);
      }

      return { previousUser };
    },

    onError: (error, _, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.current(), context.previousUser);
        setUser(context.previousUser);
      }

      const errorMessage = extractErrorMessage(error);
      toast.error('User update failed', {
        description: errorMessage,
        duration: 5000,
      });

      options?.onError?.(error);
    },

    onSuccess: (data) => {
      queryClient.setQueryData(userKeys.current(), data.user);
      setUser(data.user);

      toast.success('User information updated', {
        description: 'Your changes have been saved.',
        duration: 3000,
      });

      options?.onSuccess?.(data);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.current() });
    },
  });
};

/**
 * Hook to deactivate user account
 */
export const useDeactivateAccount = (options?: MutationOptions<DeactivateMyAccountResponse>) => {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivateAccount,
    retry: 1,
    retryDelay: 1000,

    onSuccess: (data) => {
      toast.success('Account deactivated', {
        description: data.message,
        duration: 5000,
      });

      // Logout user after deactivation
      logout();
      queryClient.clear();

      options?.onSuccess?.(data);

      console.log('[User] Account deactivated:', {
        timestamp: new Date().toISOString(),
      });
    },

    onError: (error) => {
      const errorMessage = extractErrorMessage(error);
      toast.error('Account deactivation failed', {
        description: errorMessage,
        duration: 5000,
      });

      options?.onError?.(error);

      console.error('[User] Account deactivation error:', {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    },
  });
};

// ============================================================================
// REACT QUERY HOOKS - PROFILE MANAGEMENT
// ============================================================================

/**
 * Hook to fetch current user profile
 */
export const useCurrentProfile = () => {
  const { status } = useAuthStore();
  
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: getCurrentProfile,
    enabled: status === 'authenticated',
    staleTime: CACHE_CONFIG.PROFILE_STALE_TIME,
    gcTime: CACHE_CONFIG.PROFILE_CACHE_TIME,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
  });
};

/**
 * Hook to update current user profile
 */
export const useUpdateCurrentProfile = (options?: MutationOptions<UpdateMyProfileResponse>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCurrentProfile,
    ...MUTATION_CONFIG,

    onMutate: async (updatedProfile) => {
      await queryClient.cancelQueries({ queryKey: userKeys.profile() });
      const previousProfile = queryClient.getQueryData<GetMyProfileResponse>(userKeys.profile());

      if (previousProfile) {
        const optimisticProfile = { ...previousProfile, ...updatedProfile };
        queryClient.setQueryData(userKeys.profile(), optimisticProfile);
      }

      return { previousProfile };
    },

    onError: (error, _, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(userKeys.profile(), context.previousProfile);
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
      queryClient.setQueryData(userKeys.profile(), data.profile);

      toast.success('Profile updated successfully', {
        description: data.message,
        duration: 3000,
      });

      options?.onSuccess?.(data);

      console.log('[User] Profile updated:', {
        timestamp: new Date().toISOString(),
      });
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
    },
  });
};

/**
 * Hook to update marketing preferences
 */
export const useUpdateMarketingPreferences = (options?: MutationOptions<UpdateMarketingPreferencesResponse>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMarketingPreferences,
    ...MUTATION_CONFIG,

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });

      toast.success('Preferences updated', {
        description: data.message,
        duration: 3000,
      });

      options?.onSuccess?.(data);

      console.log('[User] Marketing preferences updated:', {
        timestamp: new Date().toISOString(),
      });
    },

    onError: (error) => {
      const errorMessage = extractErrorMessage(error);
      toast.error('Failed to update preferences', {
        description: errorMessage,
        duration: 5000,
      });

      options?.onError?.(error);

      console.error('[User] Update marketing preferences error:', {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    },
  });
};

/**
 * Hook to remove address from profile
 */
export const useRemoveAddress = (options?: MutationOptions<RemoveAddressResponse>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeAddress,
    retry: 1,

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });

      toast.success('Address removed', {
        description: data.message,
        duration: 3000,
      });

      options?.onSuccess?.(data);

      console.log('[User] Address removed:', {
        timestamp: new Date().toISOString(),
      });
    },

    onError: (error) => {
      const errorMessage = extractErrorMessage(error);
      toast.error('Failed to remove address', {
        description: errorMessage,
        duration: 5000,
      });

      options?.onError?.(error);

      console.error('[User] Remove address error:', {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    },
  });
};

// ============================================================================
// EXPORTS
// ============================================================================

export { API_ENDPOINTS };

export {
  getCurrentUser,
  updateCurrentUser,
  deactivateAccount,
  getCurrentProfile,
  updateCurrentProfile,
  updateMarketingPreferences,
  removeAddress,
};