// ============================================================================
// auth.api.ts - Authentication API Layer
// ============================================================================

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { useAuthStore, useRefreshToken as useStoredRefreshToken } from '../../store/auth.store';
import { userKeys } from '../user/user.api';
import {
  type LoginInput,
  type RegisterInput,
  type VerifyEmailInput,
  type ResendVerificationInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type ValidateResetTokenInput,
  type ChangePasswordInput,
  type RefreshTokenInput,
  type LogoutInput,
  type RequestEmailChangeInput,
  type ConfirmEmailChangeInput,
  type AuthResponse,
  type RefreshTokenResponse,
  type VerifyEmailResponse,
  type ResendVerificationResponse,
  type ForgotPasswordResponse,
  type ValidateResetTokenResponse,
  type ResetPasswordResponse,
  type ChangePasswordResponse,
  type LogoutResponse,
  type RequestEmailChangeResponse,
  type ConfirmEmailChangeResponse,
  AuthResponseSchema,
  RefreshTokenResponseSchema,
  VerifyEmailResponseSchema,
  ResendVerificationResponseSchema,
  ForgotPasswordResponseSchema,
  ValidateResetTokenResponseSchema,
  ResetPasswordResponseSchema,
  ChangePasswordResponseSchema,
  LogoutResponseSchema,
  RequestEmailChangeResponseSchema,
  ConfirmEmailChangeResponseSchema,
} from '../../types';
import { toast } from 'sonner';

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

/**
 * API endpoint configuration for authentication operations
 * Prefix: /accounts (to route through Gateway to Accounts Service)
 */
const API_ENDPOINTS = {
  REGISTER: '/accounts/auth/register',
  LOGIN: '/accounts/auth/login',
  LOGOUT: '/accounts/auth/logout',
  REFRESH: '/accounts/auth/refresh',
  VERIFY_EMAIL: '/accounts/auth/verify-email',
  RESEND_VERIFICATION: '/accounts/auth/resend-verification',
  FORGOT_PASSWORD: '/accounts/auth/forgot-password',
  VALIDATE_RESET_TOKEN: '/accounts/auth/validate-reset-token',
  RESET_PASSWORD: '/accounts/auth/reset-password',
  CHANGE_PASSWORD: '/accounts/auth/change-password',
  REQUEST_EMAIL_CHANGE: '/accounts/auth/request-email-change',
  CONFIRM_EMAIL_CHANGE: '/accounts/auth/confirm-email-change',
} as const;

/**
 * Mutation configuration for authentication operations
 */
const AUTH_MUTATION_CONFIG = {
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  retryOnError: (error: unknown) => {
    if (error && typeof error === 'object' && 'response' in error) {
      const status = (error as { response: { status: number } }).response?.status;
      return !status || status >= 500;
    }
    return true;
  },
} as const;

// ============================================================================
// DEVICE INFO COLLECTION
// ============================================================================

/**
 * Gets current device information for session tracking
 */
const getDeviceInfo = () => {
  if (typeof window === 'undefined') {
    return {
      deviceId: undefined,
      userAgent: undefined,
      ipAddress: undefined,
    };
  }

  // Generate or retrieve device ID
  let deviceId = localStorage.getItem('deviceId');
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('deviceId', deviceId);
  }

  return {
    deviceId,
    userAgent: navigator.userAgent,
    ipAddress: undefined, // Will be set by backend from request headers
  };
};

/**
 * Enhances auth payload with device information (for requests that support it)
 */
const enhanceWithDeviceInfo = <T extends Record<string, unknown>>(
  data: T
): T & { deviceId?: string; userAgent?: string; ipAddress?: string } => {
  const deviceInfo = getDeviceInfo();
  
  // Only add device info if the data object supports these fields
  // Don't add them to objects that don't expect them (like logout)
  return {
    ...data,
    ...((!('deviceId' in data) || data.deviceId === undefined) && { deviceId: deviceInfo.deviceId }),
    ...((!('userAgent' in data) || data.userAgent === undefined) && { userAgent: deviceInfo.userAgent }),
  };
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface AuthMutationPayload {
  data: LoginInput | RegisterInput;
  rememberMe?: boolean;
}

interface AuthMutationOptions {
  onSuccess?: (data: AuthResponse) => void;
  onError?: (error: unknown) => void;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Register new user account
 */
const registerUser = async (registrationData: RegisterInput): Promise<AuthResponse> => {
  try {
    const enhancedData = enhanceWithDeviceInfo(registrationData);
    const { data } = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.REGISTER,
      enhancedData,
    );

    const validatedData = AuthResponseSchema.parse(data);
    return validatedData;
  } catch (error) {
    console.error('[Auth API] Registration failed:', {
      email: registrationData.email,
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Authenticate user with email and password
 */
const loginUser = async (credentials: LoginInput): Promise<AuthResponse> => {
  try {
    const enhancedData = enhanceWithDeviceInfo(credentials);
    const { data } = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.LOGIN,
      enhancedData,
    );

    const validatedData = AuthResponseSchema.parse(data);
    return validatedData;
  } catch (error) {
    console.error('[Auth API] Login failed:', {
      email: credentials.email,
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Logout user and invalidate tokens
 */
const logoutUser = async (logoutData: LogoutInput): Promise<LogoutResponse> => {
  try {
    const { data } = await apiClient.post<LogoutResponse>(
      API_ENDPOINTS.LOGOUT,
      logoutData,
    );

    const validatedData = LogoutResponseSchema.parse(data);
    return validatedData;
  } catch (error) {
    console.error('[Auth API] Logout failed:', {
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Refresh access token
 */
const refreshToken = async (refreshData: RefreshTokenInput): Promise<RefreshTokenResponse> => {
  try {
    const enhancedData = enhanceWithDeviceInfo(refreshData);
    const { data } = await apiClient.post<RefreshTokenResponse>(
      API_ENDPOINTS.REFRESH,
      enhancedData,
    );

    const validatedData = RefreshTokenResponseSchema.parse(data);
    return validatedData;
  } catch (error) {
    console.error('[Auth API] Token refresh failed:', {
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Verify email address
 */
const verifyEmail = async (verificationData: VerifyEmailInput): Promise<VerifyEmailResponse> => {
  try {
    const enhancedData = enhanceWithDeviceInfo(verificationData);
    const { data } = await apiClient.post<VerifyEmailResponse>(
      API_ENDPOINTS.VERIFY_EMAIL,
      enhancedData,
    );

    const validatedData = VerifyEmailResponseSchema.parse(data);
    return validatedData;
  } catch (error) {
    console.error('[Auth API] Email verification failed:', {
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Resend email verification
 */
const resendVerification = async (resendData: ResendVerificationInput): Promise<ResendVerificationResponse> => {
  try {
    const { data } = await apiClient.post<ResendVerificationResponse>(
      API_ENDPOINTS.RESEND_VERIFICATION,
      resendData,
    );

    const validatedData = ResendVerificationResponseSchema.parse(data);
    return validatedData;
  } catch (error) {
    console.error('[Auth API] Resend verification failed:', {
      email: resendData.email,
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Request password reset
 */
const forgotPassword = async (forgotPasswordData: ForgotPasswordInput): Promise<ForgotPasswordResponse> => {
  try {
    const { data } = await apiClient.post<ForgotPasswordResponse>(
      API_ENDPOINTS.FORGOT_PASSWORD,
      forgotPasswordData,
    );

    const validatedData = ForgotPasswordResponseSchema.parse(data);
    return validatedData;
  } catch (error) {
    console.error('[Auth API] Forgot password request failed:', {
      email: forgotPasswordData.email,
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Validate password reset token
 */
const validateResetToken = async (tokenData: ValidateResetTokenInput): Promise<ValidateResetTokenResponse> => {
  try {
    const { data } = await apiClient.get<ValidateResetTokenResponse>(
      API_ENDPOINTS.VALIDATE_RESET_TOKEN,
      { params: tokenData }
    );

    const validatedData = ValidateResetTokenResponseSchema.parse(data);
    return validatedData;
  } catch (error) {
    console.error('[Auth API] Token validation failed:', {
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Reset password with token
 */
const resetPassword = async (resetPasswordData: ResetPasswordInput): Promise<ResetPasswordResponse> => {
  try {
    const enhancedData = enhanceWithDeviceInfo(resetPasswordData);
    const { data } = await apiClient.post<ResetPasswordResponse>(
      API_ENDPOINTS.RESET_PASSWORD,
      enhancedData,
    );

    const validatedData = ResetPasswordResponseSchema.parse(data);
    return validatedData;
  } catch (error) {
    console.error('[Auth API] Password reset failed:', {
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Change password (authenticated)
 */
const changePassword = async (changePasswordData: ChangePasswordInput): Promise<ChangePasswordResponse> => {
  try {
    const { data } = await apiClient.post<ChangePasswordResponse>(
      API_ENDPOINTS.CHANGE_PASSWORD,
      changePasswordData,
    );

    const validatedData = ChangePasswordResponseSchema.parse(data);
    return validatedData;
  } catch (error) {
    console.error('[Auth API] Password change failed:', {
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Request email change
 */
const requestEmailChange = async (emailChangeData: RequestEmailChangeInput): Promise<RequestEmailChangeResponse> => {
  try {
    const { data } = await apiClient.post<RequestEmailChangeResponse>(
      API_ENDPOINTS.REQUEST_EMAIL_CHANGE,
      emailChangeData,
    );

    const validatedData = RequestEmailChangeResponseSchema.parse(data);
    return validatedData;
  } catch (error) {
    console.error('[Auth API] Email change request failed:', {
      newEmail: emailChangeData.newEmail,
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Confirm email change
 */
const confirmEmailChange = async (confirmData: ConfirmEmailChangeInput): Promise<ConfirmEmailChangeResponse> => {
  try {
    const enhancedData = enhanceWithDeviceInfo(confirmData);
    const { data } = await apiClient.post<ConfirmEmailChangeResponse>(
      API_ENDPOINTS.CONFIRM_EMAIL_CHANGE,
      enhancedData,
    );

    const validatedData = ConfirmEmailChangeResponseSchema.parse(data);
    return validatedData;
  } catch (error) {
    console.error('[Auth API] Email change confirmation failed:', {
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Helper to convert AuthResponse to store-compatible format
 */
const convertAuthResponseForStore = (authData: AuthResponse) => {
  return {
    user: {
      id: authData.user.id,
      email: authData.user.email,
      firstName: authData.user.firstName,
      lastName: authData.user.lastName,
      role: authData.user.role,
      isActive: authData.user.isActive,
      emailVerified: authData.user.emailVerified,
      phoneVerified: authData.user.phoneVerified,
      lastLoginAt: authData.user.lastLoginAt || null,
      createdAt: authData.user.createdAt,
      updatedAt: authData.user.updatedAt,
      // Fields that might not be in AuthResponse but are in store
      loginAttempts: 0,
      lockedUntil: null,
      deletedAt: null,
      isLocked: false,
      isDeleted: false,
      profile: undefined,
    },
    accessToken: authData.accessToken,
    refreshToken: authData.refreshToken,
  };
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

/**
 * Hook for user login with credentials
 */
export const useLogin = (options?: AuthMutationOptions) => {
  const { login: loginAction } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: AuthMutationPayload) => loginUser(data as LoginInput),
    ...AUTH_MUTATION_CONFIG,

    onSuccess: (authData, { rememberMe }) => {
      const storeData = convertAuthResponseForStore(authData);
      loginAction(storeData, rememberMe);
      queryClient.setQueryData(userKeys.profile(), authData.user);

      toast.success('Welcome back! You are now logged in.', {
        description: `Logged in as ${authData.user.email}`,
        duration: 3000,
      });

      options?.onSuccess?.(authData);

      console.log('[Auth] Login successful:', {
        userId: authData.user.id,
        email: authData.user.email,
        timestamp: new Date().toISOString(),
      });
    },

    onError: (error) => {
      const errorMessage = extractErrorMessage(error);
      
      toast.error('Login failed', {
        description: errorMessage,
        duration: 5000,
      });

      options?.onError?.(error);

      console.error('[Auth] Login error:', {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    },
  });
};

/**
 * Hook for new user registration
 */
export const useRegister = (options?: AuthMutationOptions) => {
  const { login: loginAction } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: AuthMutationPayload) => registerUser(data as RegisterInput),
    ...AUTH_MUTATION_CONFIG,

    onSuccess: (authData, { rememberMe }) => {
      const storeData = convertAuthResponseForStore(authData);
      loginAction(storeData, rememberMe);
      queryClient.setQueryData(userKeys.profile(), authData.user);

      toast.success('Account created successfully!', {
        description: `Welcome, ${authData.user.firstName || authData.user.email}!`,
        duration: 4000,
      });

      options?.onSuccess?.(authData);

      console.log('[Auth] Registration successful:', {
        userId: authData.user.id,
        email: authData.user.email,
        timestamp: new Date().toISOString(),
      });
    },

    onError: (error) => {
      const errorMessage = extractErrorMessage(error);
      
      toast.error('Registration failed', {
        description: errorMessage,
        duration: 5000,
      });

      options?.onError?.(error);

      console.error('[Auth] Registration error:', {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    },
  });
};

/**
 * Hook for user logout
 */
export const useLogout = (options?: { onSuccess?: () => void }) => {
  // 1. Get the action from the Store Manager
  const { logout: logoutAction } = useAuthStore();
  
  // 2. Get the data using the Unified Selector Hook
  // (This automatically finds the token whether it's in localStorage or Session)
  const storedRefreshToken = useStoredRefreshToken(); 
  
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (logoutData?: LogoutInput | void) => {
      // Use the value retrieved from the hook
      const finalRefreshToken = logoutData?.refreshToken || storedRefreshToken;
      
      if (!finalRefreshToken) {
        return Promise.resolve({
          message: 'Logged out locally.',
          sessionsTerminated: 0,
        });
      }
      return logoutUser({
        refreshToken: finalRefreshToken,
        allDevices: logoutData?.allDevices || false,
      });
    },
    retry: false,

    onSuccess: (response) => {
      logoutAction();
      queryClient.clear(); // This is critical: clears all cached data

      toast.success('Logged out successfully', {
        description: response.message || 'You have been securely logged out.',
        duration: 3000,
      });
      options?.onSuccess?.();
    },

    onError: () => {
      // Failsafe: if the server call fails, we STILL log out locally.
      logoutAction();
      queryClient.clear();

      toast.warning('Logged out locally', {
        description: 'Server logout failed, but you are logged out on this device.',
        duration: 4000,
      });
      options?.onSuccess?.(); // Still call success, as the user is logged out.
    },
  });
};

/**
 * Hook for refreshing access token
 */
export const useRefreshToken = () => {
  const { setTokens } = useAuthStore();
  const { mutate: performLogout } = useLogout();

  return useMutation({
    mutationFn: refreshToken,
    retry: 1,
    retryDelay: 1000,

    onSuccess: (data) => {
      setTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });

      console.log('[Auth] Token refresh successful:', {
        timestamp: new Date().toISOString(),
      });
    },

    onError: (error) => {
      console.error('[Auth] Token refresh failed, initiating full logout:', {
        error: extractErrorMessage(error),
        timestamp: new Date().toISOString(),
      });
      performLogout(undefined);
    },
  });
};
/**
 * Hook for email verification
 */
export const useVerifyEmail = (options?: { onSuccess?: (data: VerifyEmailResponse) => void }) => {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: verifyEmail,
    ...AUTH_MUTATION_CONFIG,

    onSuccess: (data) => {
      if (data.authData) {
        const storeUser = {
          ...data.authData.user,
          loginAttempts: 0,
          isLocked: false,
          isDeleted: false,
          lockedUntil: null,
          deletedAt: null,
        };

        queryClient.setQueryData(userKeys.profile(), storeUser);
        
        // Now 'storeUser' matches the type expected by setUser
        setUser(storeUser);
      }

      toast.success('Email verified successfully!', {
        description: data.message,
        duration: 5000,
      });

      options?.onSuccess?.(data);

      console.log('[Auth] Email verification successful:', {
        timestamp: new Date().toISOString(),
      });
    },

    onError: (error) => {
      const errorMessage = extractErrorMessage(error);
      
      toast.error('Email verification failed', {
        description: errorMessage,
        duration: 5000,
      });

      console.error('[Auth] Email verification error:', {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    },
  });
};

/**
 * Hook for resending email verification
 */
export const useResendVerification = () => {
  return useMutation({
    mutationFn: resendVerification,
    ...AUTH_MUTATION_CONFIG,

    onSuccess: (data) => {
      toast.success('Verification email sent', {
        description: data.message,
        duration: 5000,
      });

      console.log('[Auth] Verification email resent:', {
        timestamp: new Date().toISOString(),
      });
    },

    onError: (error) => {
      const errorMessage = extractErrorMessage(error);
      
      toast.error('Failed to send verification email', {
        description: errorMessage,
        duration: 5000,
      });

      console.error('[Auth] Resend verification error:', {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    },
  });
};

/**
 * Hook for password reset request
 */
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: forgotPassword,
    ...AUTH_MUTATION_CONFIG,

    onSuccess: (response) => {
      toast.success('Password reset email sent', {
        description: response.message,
        duration: 6000,
      });

      console.log('[Auth] Password reset requested:', {
        timestamp: new Date().toISOString(),
      });
    },

    onError: (error) => {
      const errorMessage = extractErrorMessage(error);
      
      toast.error('Password reset request failed', {
        description: errorMessage,
        duration: 5000,
      });

      console.error('[Auth] Forgot password error:', {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    },
  });
};

/**
 * Hook for validating reset token
 */
export const useValidateResetToken = () => {
  return useMutation({
    mutationFn: validateResetToken,
    retry: false,
  });
};

/**
 * Hook for completing password reset
 */
export const useResetPassword = (options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) => {
  const queryClient = useQueryClient();
  const { login: loginAction } = useAuthStore();

  return useMutation({
    mutationFn: resetPassword,
    retry: 1,
    retryDelay: 1000,

    onSuccess: (response) => {
      if (response.authData) {
        const storeData = convertAuthResponseForStore(response.authData);
        loginAction(storeData, false);
        queryClient.setQueryData(userKeys.profile(), response.authData.user);
      }

      toast.success('Password reset successful!', {
        description: response.message,
        duration: 5000,
      });

      options?.onSuccess?.();

      console.log('[Auth] Password reset completed:', {
        timestamp: new Date().toISOString(),
      });
    },

    onError: (error) => {
      const errorMessage = extractErrorMessage(error);
      
      toast.error('Password reset failed', {
        description: errorMessage,
        duration: 5000,
      });

      options?.onError?.(error);

      console.error('[Auth] Reset password error:', {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    },
  });
};

/**
 * Hook for changing password (authenticated)
 */
export const useChangePassword = (options?: {
  onSuccess?: (data: ChangePasswordResponse) => void;
  onError?: (error: unknown) => void;
}) => {
  return useMutation({
    mutationFn: changePassword,
    retry: 1,
    retryDelay: 1000,

    onSuccess: (response) => {
      toast.success('Password changed successfully!', {
        description: response.message,
        duration: 5000,
      });

      options?.onSuccess?.(response);

      console.log('[Auth] Password change successful:', {
        sessionsTerminated: response.sessionsTerminated,
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

      console.error('[Auth] Change password error:', {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    },
  });
};

/**
 * Hook for requesting email change
 */
export const useRequestEmailChange = (options?: {
  onSuccess?: (data: RequestEmailChangeResponse) => void;
  onError?: (error: unknown) => void;
}) => {
  return useMutation({
    mutationFn: requestEmailChange,
    ...AUTH_MUTATION_CONFIG,

    onSuccess: (response) => {
      toast.success('Email change verification sent', {
        description: response.message,
        duration: 5000,
      });

      options?.onSuccess?.(response);

      console.log('[Auth] Email change requested:', {
        newEmail: response.newEmail,
        timestamp: new Date().toISOString(),
      });
    },

    onError: (error) => {
      const errorMessage = extractErrorMessage(error);
      
      toast.error('Email change request failed', {
        description: errorMessage,
        duration: 5000,
      });

      options?.onError?.(error);

      console.error('[Auth] Email change request error:', {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    },
  });
};

/**
 * Hook for confirming email change
 */
export const useConfirmEmailChange = (options?: {
  onSuccess?: (data: ConfirmEmailChangeResponse) => void;
  onError?: (error: unknown) => void;
}) => {
  const queryClient = useQueryClient();
  const { login: loginAction } = useAuthStore();

  return useMutation({
    mutationFn: confirmEmailChange,
    ...AUTH_MUTATION_CONFIG,

    onSuccess: (response) => {
      if (response.authData) {
        const storeData = convertAuthResponseForStore(response.authData);
        loginAction(storeData, false);
        queryClient.setQueryData(userKeys.profile(), response.authData.user);
      }

      toast.success('Email address changed successfully!', {
        description: response.message,
        duration: 5000,
      });

      options?.onSuccess?.(response);

      console.log('[Auth] Email change confirmed:', {
        previousEmail: response.previousEmail,
        newEmail: response.newEmail,
        timestamp: new Date().toISOString(),
      });
    },

    onError: (error) => {
      const errorMessage = extractErrorMessage(error);
      
      toast.error('Email change confirmation failed', {
        description: errorMessage,
        duration: 5000,
      });

      options?.onError?.(error);

      console.error('[Auth] Email change confirmation error:', {
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
  registerUser,
  loginUser,
  logoutUser,
  refreshToken,
  verifyEmail,
  resendVerification,
  forgotPassword,
  validateResetToken,
  resetPassword,
  changePassword,
  requestEmailChange,
  confirmEmailChange,
};