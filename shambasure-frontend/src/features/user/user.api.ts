// ============================================================================
// user.api.ts - User Management API Layer
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
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
} from '../../types';
import {
  type GetMyProfileResponse,
  type UpdateMyProfileInput,
  type UpdateMyProfileResponse,
  type SendPhoneVerificationInput,
  type SendPhoneVerificationResponse,
  type VerifyPhoneInput,
  type VerifyPhoneResponse,
  type ResendPhoneVerificationResponse,
  type UpdateMarketingPreferencesInput,
  type UpdateMarketingPreferencesResponse,
  type RemovePhoneNumberResponse,
  type RemoveAddressResponse,
  type RemoveNextOfKinResponse,
  GetMyProfileResponseSchema,
  UpdateMyProfileResponseSchema,
  SendPhoneVerificationResponseSchema,
  VerifyPhoneResponseSchema,
  ResendPhoneVerificationResponseSchema,
  UpdateMarketingPreferencesResponseSchema,
  RemovePhoneNumberResponseSchema,
  RemoveAddressResponseSchema,
  RemoveNextOfKinResponseSchema,
} from '../../types';

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
  PHONE_SEND_VERIFICATION: '/accounts/me/phone/send-verification',
  PHONE_VERIFY: '/accounts/me/phone/verify',
  PHONE_RESEND_VERIFICATION: '/accounts/me/phone/resend-verification',
  PHONE_REMOVE: '/accounts/me/phone',
  MARKETING_PREFERENCES: '/accounts/me/marketing-preferences',
  ADDRESS_REMOVE: '/accounts/me/address',
  NEXT_OF_KIN_REMOVE: '/accounts/me/next-of-kin',
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
 * Send phone verification code
 */
const sendPhoneVerification = async (verificationData: SendPhoneVerificationInput): Promise<SendPhoneVerificationResponse> => {
  try {
    const { data } = await apiClient.post<SendPhoneVerificationResponse>(
      API_ENDPOINTS.PHONE_SEND_VERIFICATION,
      verificationData,
    );
    const validatedData = SendPhoneVerificationResponseSchema.parse(data);
    return validatedData;
  } catch (error) {
    console.error('[User API] Send phone verification failed:', {
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Verify phone number with OTP
 */
const verifyPhone = async (verificationData: VerifyPhoneInput): Promise<VerifyPhoneResponse> => {
  try {
    const { data } = await apiClient.post<VerifyPhoneResponse>(
      API_ENDPOINTS.PHONE_VERIFY,
      verificationData,
    );
    const validatedData = VerifyPhoneResponseSchema.parse(data);
    return validatedData;
  } catch (error) {
    console.error('[User API] Verify phone failed:', {
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Resend phone verification code
 * NOTE: This endpoint has NO request body
 */
const resendPhoneVerification = async (): Promise<ResendPhoneVerificationResponse> => {
  try {
    const { data } = await apiClient.post<ResendPhoneVerificationResponse>(
      API_ENDPOINTS.PHONE_RESEND_VERIFICATION,
    );
    const validatedData = ResendPhoneVerificationResponseSchema.parse(data);
    return validatedData;
  } catch (error) {
    console.error('[User API] Resend phone verification failed:', {
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Remove phone number from profile
 */
const removePhoneNumber = async (): Promise<RemovePhoneNumberResponse> => {
  try {
    const { data } = await apiClient.delete<RemovePhoneNumberResponse>(
      API_ENDPOINTS.PHONE_REMOVE,
    );
    const validatedData = RemovePhoneNumberResponseSchema.parse(data);
    return validatedData;
  } catch (error) {
    console.error('[User API] Remove phone number failed:', {
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

/**
 * Remove next of kin from profile
 */
const removeNextOfKin = async (): Promise<RemoveNextOfKinResponse> => {
  try {
    const { data } = await apiClient.delete<RemoveNextOfKinResponse>(
      API_ENDPOINTS.NEXT_OF_KIN_REMOVE,
    );
    const validatedData = RemoveNextOfKinResponseSchema.parse(data);
    return validatedData;
  } catch (error) {
    console.error('[User API] Remove next of kin failed:', {
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
 * Hook to send phone verification code
 */
export const useSendPhoneVerification = (options?: MutationOptions<SendPhoneVerificationResponse>) => {
  return useMutation({
    mutationFn: sendPhoneVerification,
    ...MUTATION_CONFIG,

    onSuccess: (data) => {
      toast.success('Verification code sent', {
        description: data.message,
        duration: 5000,
      });

      options?.onSuccess?.(data);

      console.log('[User] Phone verification code sent:', {
        phoneNumber: data.phoneNumber,
        timestamp: new Date().toISOString(),
      });
    },

    onError: (error) => {
      const errorMessage = extractErrorMessage(error);
      toast.error('Failed to send verification code', {
        description: errorMessage,
        duration: 5000,
      });

      options?.onError?.(error);

      console.error('[User] Send phone verification error:', {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    },
  });
};

/**
 * Hook to verify phone number with OTP
 */
export const useVerifyPhone = (options?: MutationOptions<VerifyPhoneResponse>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: verifyPhone,
    ...MUTATION_CONFIG,

    onSuccess: (data) => {
      if (data.profile) {
        queryClient.setQueryData(userKeys.profile(), data.profile);
      }

      toast.success('Phone number verified', {
        description: data.message,
        duration: 5000,
      });

      options?.onSuccess?.(data);

      console.log('[User] Phone number verified:', {
        phoneNumber: data.phoneNumber,
        timestamp: new Date().toISOString(),
      });
    },

    onError: (error) => {
      const errorMessage = extractErrorMessage(error);
      toast.error('Phone verification failed', {
        description: errorMessage,
        duration: 5000,
      });

      options?.onError?.(error);

      console.error('[User] Verify phone error:', {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    },
  });
};

/**
 * Hook to resend phone verification code
 */
export const useResendPhoneVerification = (options?: MutationOptions<ResendPhoneVerificationResponse>) => {
  return useMutation({
    mutationFn: resendPhoneVerification,
    ...MUTATION_CONFIG,

    onSuccess: (data) => {
      toast.success('Verification code resent', {
        description: data.message,
        duration: 5000,
      });

      options?.onSuccess?.(data);

      console.log('[User] Phone verification code resent:', {
        timestamp: new Date().toISOString(),
      });
    },

    onError: (error) => {
      const errorMessage = extractErrorMessage(error);
      toast.error('Failed to resend verification code', {
        description: errorMessage,
        duration: 5000,
      });

      options?.onError?.(error);

      console.error('[User] Resend phone verification error:', {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    },
  });
};

/**
 * Hook to remove phone number from profile
 */
export const useRemovePhoneNumber = (options?: MutationOptions<RemovePhoneNumberResponse>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removePhoneNumber,
    retry: 1,

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });

      toast.success('Phone number removed', {
        description: data.message,
        duration: 3000,
      });

      options?.onSuccess?.(data);

      console.log('[User] Phone number removed:', {
        timestamp: new Date().toISOString(),
      });
    },

    onError: (error) => {
      const errorMessage = extractErrorMessage(error);
      toast.error('Failed to remove phone number', {
        description: errorMessage,
        duration: 5000,
      });

      options?.onError?.(error);

      console.error('[User] Remove phone error:', {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
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

/**
 * Hook to remove next of kin from profile
 */
export const useRemoveNextOfKin = (options?: MutationOptions<RemoveNextOfKinResponse>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeNextOfKin,
    retry: 1,

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });

      toast.success('Next of kin removed', {
        description: data.message,
        duration: 3000,
      });

      options?.onSuccess?.(data);

      console.log('[User] Next of kin removed:', {
        timestamp: new Date().toISOString(),
      });
    },

    onError: (error) => {
      const errorMessage = extractErrorMessage(error);
      toast.error('Failed to remove next of kin', {
        description: errorMessage,
        duration: 5000,
      });

      options?.onError?.(error);

      console.error('[User] Remove next of kin error:', {
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
  sendPhoneVerification,
  verifyPhone,
  resendPhoneVerification,
  removePhoneNumber,
  updateMarketingPreferences,
  removeAddress,
  removeNextOfKin,
};