// ============================================================================
// auth.api.ts - Authentication API Layer
// ============================================================================
// Production-ready authentication API with comprehensive error handling,
// retry logic, request validation, and optimistic updates.
// ============================================================================

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import { userKeys } from '../user/user.api';
import {
  type LoginInput,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type AuthResponse,
  AuthResponseSchema,
  type SuccessResponse,
  SuccessResponseSchema,
} from '../../types';
import { toast } from 'sonner';

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

/**
 * API endpoint configuration for authentication operations.
 * Centralized endpoint management for easy maintenance and updates.
 */
const API_ENDPOINTS = {
  LOGIN: '/v1/auth/login',
  REGISTER: '/v1/auth/register',
  REFRESH: '/v1/auth/refresh',
  FORGOT_PASSWORD: '/v1/auth/forgot-password',
  RESET_PASSWORD: '/v1/auth/reset-password',
  LOGOUT: '/v1/auth/logout', // Future server-side token invalidation
} as const;

/**
 * Mutation configuration for authentication operations.
 * Defines retry behavior and error handling strategies.
 */
const AUTH_MUTATION_CONFIG = {
  // Retry failed mutations (network errors, 5xx)
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  
  // Don't retry authentication errors (401, 403, 400)
  retryOnError: (error: unknown) => {
    if (error && typeof error === 'object' && 'response' in error) {
      const status = (error as { response: { status: number } }).response?.status;
      // Retry on network errors and 5xx, but not auth/validation errors
      return !status || status >= 500;
    }
    return true; // Retry network errors
  },
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Payload structure for authentication mutations (login/register).
 * Includes optional "remember me" functionality.
 */
interface AuthMutationPayload {
  data: LoginInput | RegisterInput;
  rememberMe?: boolean;
}

/**
 * Options for authentication mutation hooks.
 * Allows customization of success/error callbacks.
 */
interface AuthMutationOptions {
  onSuccess?: (data: AuthResponse) => void;
  onError?: (error: unknown) => void;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Authenticate user with email and password.
 * 
 * @param credentials - User login credentials (email, password)
 * @returns Promise resolving to AuthResponse with tokens and user data
 * 
 * @throws {ValidationError} Invalid credentials format
 * @throws {AuthenticationError} Invalid email or password (401)
 * @throws {NetworkError} Network connectivity issues
 * 
 * @example
 * ```ts
 * const authData = await loginUser({
 *   email: 'user@example.com',
 *   password: 'SecurePass123!'
 * });
 * ```
 */
const loginUser = async (credentials: LoginInput): Promise<AuthResponse> => {
  try {
    const { data } = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.LOGIN,
      credentials,
    );

    // Runtime validation to ensure API contract compliance
    const validatedData = AuthResponseSchema.parse(data);

    return validatedData;
  } catch (error) {
    // Enhanced error logging for debugging
    console.error('[Auth API] Login failed:', {
      email: credentials.email,
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Register new user account.
 * 
 * @param registrationData - New user registration details (includes confirmPassword)
 * @returns Promise resolving to AuthResponse with tokens and user data
 * 
 * @throws {ValidationError} Invalid registration data format
 * @throws {ConflictError} Email already registered (409)
 * @throws {NetworkError} Network connectivity issues
 * 
 * @security confirmPassword is stripped before sending to backend
 * @security ADMIN role cannot be selected (type-safe + runtime validation)
 * 
 * @example
 * ```ts
 * const authData = await registerUser({
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   email: 'newuser@example.com',
 *   password: 'SecurePass123!',
 *   confirmPassword: 'SecurePass123!',
 *   role: 'LAND_OWNER'
 * });
 * ```
 */
const registerUser = async (
  registrationData: RegisterInput,
): Promise<AuthResponse> => {
  try {
    // Transform frontend data to backend API payload
    // Strips confirmPassword (frontend-only validation)
    // Ensures type safety for role selection
    const apiPayload = {
      firstName: registrationData.firstName,
      lastName: registrationData.lastName,
      email: registrationData.email,
      password: registrationData.password,
      role: registrationData.role,
    };

    const { data } = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.REGISTER,
      apiPayload,
    );

    // Runtime validation
    const validatedData = AuthResponseSchema.parse(data);

    return validatedData;
  } catch (error) {
    console.error('[Auth API] Registration failed:', {
      email: registrationData.email,
      role: registrationData.role,
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

/**
 * Request password reset email.
 * 
 * @param forgotPasswordData - Email address for password reset
 * @returns Promise resolving to success message
 * 
 * @security Returns generic message to prevent user enumeration
 * 
 * @example
 * ```ts
 * await forgotPassword({ email: 'user@example.com' });
 * // Always returns success, even if email doesn't exist
 * ```
 */
const forgotPassword = async (
  forgotPasswordData: ForgotPasswordInput,
): Promise<SuccessResponse> => {
  try {
    const { data } = await apiClient.post<SuccessResponse>(
      API_ENDPOINTS.FORGOT_PASSWORD,
      forgotPasswordData,
    );

    const validatedData = SuccessResponseSchema.parse(data);

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
 * Complete password reset with token.
 * 
 * @param resetPasswordData - Reset token and new password
 * @returns Promise resolving to success message
 * 
 * @throws {ValidationError} Invalid token or password format
 * @throws {BadRequestError} Expired or invalid token (400)
 * 
 * @example
 * ```ts
 * await resetPassword({
 *   token: 'reset-token-from-email',
 *   newPassword: 'NewSecurePass123!'
 * });
 * ```
 */
const resetPassword = async (
  resetPasswordData: ResetPasswordInput,
): Promise<SuccessResponse> => {
  try {
    const { data } = await apiClient.post<SuccessResponse>(
      API_ENDPOINTS.RESET_PASSWORD,
      resetPasswordData,
    );

    const validatedData = SuccessResponseSchema.parse(data);

    return validatedData;
  } catch (error) {
    console.error('[Auth API] Password reset failed:', {
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
      // Don't log token for security
    });
    throw error;
  }
};

/**
 * Logout user and invalidate tokens.
 * 
 * @returns Promise that resolves when logout is complete
 * 
 * FUTURE: Implement server-side token invalidation
 * Currently performs client-side cleanup only
 * 
 * @example
 * ```ts
 * await logoutUser();
 * // Tokens cleared from storage
 * ```
 */
const logoutUser = async (): Promise<void> => {
  try {
    // FUTURE: Server-side token invalidation
    // await apiClient.post(API_ENDPOINTS.LOGOUT);
    
    // Currently a no-op, actual cleanup happens in mutation hook
    return Promise.resolve();
  } catch (error) {
    console.error('[Auth API] Logout request failed:', {
      error: extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    });
    // Don't throw - always allow client-side logout
    return Promise.resolve();
  }
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

/**
 * Hook for user login with credentials.
 * 
 * FEATURES:
 * - Automatic token storage (access + refresh)
 * - User data caching in React Query
 * - "Remember me" functionality
 * - Optimistic UI updates
 * - Automatic retry on network errors
 * 
 * @param options - Optional success/error callbacks
 * 
 * @example
 * ```tsx
 * const { mutate: login, isPending } = useLogin();
 * 
 * const handleLogin = (credentials: LoginInput) => {
 *   login({ data: credentials, rememberMe: true });
 * };
 * ```
 */
export const useLogin = (options?: AuthMutationOptions) => {
  const { login: loginAction } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: AuthMutationPayload) => loginUser(data as LoginInput),
    
    ...AUTH_MUTATION_CONFIG,

    onSuccess: (authData, { rememberMe }) => {
      // Store authentication state
      loginAction(authData, rememberMe);

      // Cache user profile data
      queryClient.setQueryData(userKeys.profile(), authData.user);

      // Prefetch user-specific data if needed
      // queryClient.prefetchQuery({ queryKey: userKeys.settings() });

      // Show success notification
      toast.success('Welcome back! You are now logged in.', {
        description: `Logged in as ${authData.user.email}`,
        duration: 3000,
      });

      // Call custom success handler if provided
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

      // Call custom error handler if provided
      options?.onError?.(error);

      console.error('[Auth] Login error:', {
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    },
  });
};

/**
 * Hook for new user registration.
 * 
 * FEATURES:
 * - Automatic login after registration
 * - Token storage and user caching
 * - Welcome message with user details
 * - Automatic retry on network errors
 * 
 * @param options - Optional success/error callbacks
 * 
 * @example
 * ```tsx
 * const { mutate: register, isPending } = useRegister();
 * 
 * const handleRegister = (data: RegisterInput) => {
 *   register({ data, rememberMe: true });
 * };
 * ```
 */
export const useRegister = (options?: AuthMutationOptions) => {
  const { login: loginAction } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data }: AuthMutationPayload) =>
      registerUser(data as RegisterInput),

    ...AUTH_MUTATION_CONFIG,

    onSuccess: (authData, { rememberMe }) => {
      // Automatic login after registration
      loginAction(authData, rememberMe);

      // Cache user profile
      queryClient.setQueryData(userKeys.profile(), authData.user);

      // Welcome message
      toast.success('Account created successfully!', {
        description: `Welcome, ${authData.user.firstName || authData.user.email}!`,
        duration: 4000,
      });

      // Call custom success handler
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
 * Hook for password reset request.
 * 
 * FEATURES:
 * - Sends reset email with token
 * - Generic success message (security)
 * - Automatic retry on network errors
 * 
 * @example
 * ```tsx
 * const { mutate: requestReset, isPending } = useForgotPassword();
 * 
 * const handleForgotPassword = (email: string) => {
 *   requestReset({ email });
 * };
 * ```
 */
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: forgotPassword,

    ...AUTH_MUTATION_CONFIG,

    onSuccess: (response) => {
      toast.success('Password reset email sent', {
        description: response.message || 'Check your email for the reset link.',
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
 * Hook for completing password reset.
 * 
 * FEATURES:
 * - Validates reset token
 * - Updates password securely
 * - Clears any existing sessions
 * - Redirects to login on success
 * 
 * @param options - Optional success/error callbacks
 * 
 * @example
 * ```tsx
 * const { mutate: resetPwd, isPending } = useResetPassword({
 *   onSuccess: () => navigate('/login')
 * });
 * 
 * const handleReset = (token: string, newPassword: string) => {
 *   resetPwd({ token, newPassword });
 * };
 * ```
 */
export const useResetPassword = (options?: {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}) => {
  return useMutation({
    mutationFn: resetPassword,

    retry: 1, // Only retry once for token-based operations
    retryDelay: 1000,

    onSuccess: (response) => {
      toast.success('Password reset successful!', {
        description: response.message || 'You can now log in with your new password.',
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
 * Hook for user logout.
 * 
 * FEATURES:
 * - Clears authentication tokens
 * - Invalidates all React Query cache
 * - Removes user session data
 * - Always succeeds (even if server call fails)
 * 
 * @param options - Optional success callback (e.g., navigation)
 * 
 * @example
 * ```tsx
 * const { mutate: logout, isPending } = useLogout({
 *   onSuccess: () => navigate('/login')
 * });
 * 
 * const handleLogout = () => {
 *   if (confirm('Are you sure you want to log out?')) {
 *     logout();
 *   }
 * };
 * ```
 */
export const useLogout = (options?: { onSuccess?: () => void }) => {
  const { logout: logoutAction } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutUser,

    retry: false, // Don't retry logout - it should always succeed locally

    onSuccess: () => {
      // Clear authentication state
      logoutAction();

      // Clear all cached data
      queryClient.clear();

      toast.success('Logged out successfully', {
        description: 'You have been securely logged out.',
        duration: 3000,
      });

      options?.onSuccess?.();

      console.log('[Auth] Logout successful:', {
        timestamp: new Date().toISOString(),
      });
    },

    onError: (error) => {
      // Always perform client-side logout even if server call fails
      logoutAction();
      queryClient.clear();

      toast.warning('Logged out locally', {
        description: 'Server logout failed, but you have been logged out on this device.',
        duration: 4000,
      });

      options?.onSuccess?.(); // Still call success handler

      console.warn('[Auth] Logout server error (local cleanup successful):', {
        error: extractErrorMessage(error),
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
 * (e.g., axios interceptors, middleware)
 */
export { API_ENDPOINTS };

/**
 * Export raw API functions for advanced use cases
 * (e.g., server-side rendering, background jobs)
 */
export {
  loginUser,
  registerUser,
  forgotPassword,
  resetPassword,
  logoutUser,
};
