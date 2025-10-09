// FILE: src/features/auth/auth.api.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import type {
  LoginInput,
  RegisterInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  RefreshTokenInput,
  AuthResponse,
  RefreshTokenResponse,
} from '../../types';

// ============================================================================
// QUERY KEYS FACTORY
// Centralized query key management for better cache control
// ============================================================================

export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
  user: (userId: string) => [...authKeys.all, 'user', userId] as const,
};

// ============================================================================
// API FUNCTIONS
// Pure functions that make HTTP requests
// ============================================================================

const loginUser = async (data: LoginInput): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/login', data);
  return response.data;
};

const registerUser = async (data: RegisterInput): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/register', data);
  return response.data;
};

const forgotPassword = async (data: ForgotPasswordInput): Promise<{ message: string }> => {
  const response = await apiClient.post('/auth/forgot-password', data);
  return response.data;
};

const resetPassword = async (data: ResetPasswordInput): Promise<{ message: string }> => {
  const response = await apiClient.post('/auth/reset-password', data);
  return response.data;
};

const refreshToken = async (data: RefreshTokenInput): Promise<RefreshTokenResponse> => {
  const response = await apiClient.post('/auth/refresh', data);
  return response.data;
};

const logout = async (): Promise<void> => {
  // Backend endpoint to invalidate refresh token
  await apiClient.post('/auth/logout');
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

/**
 * Hook for user login
 * 
 * @example
 * const loginMutation = useLogin();
 * loginMutation.mutate({ email: '...', password: '...' });
 */
export const useLogin = () => {
  const loginAction = useAuthStore((state) => state.login);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      // Update Zustand store with auth data
      loginAction(data);
      
      // Pre-populate the profile cache
      queryClient.setQueryData(authKeys.profile(), data.user);
    },
    onError: (error) => {
      console.error('Login failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook for user registration
 * 
 * @example
 * const registerMutation = useRegister();
 * registerMutation.mutate({ email: '...', password: '...', ... });
 */
export const useRegister = () => {
  const loginAction = useAuthStore((state) => state.login);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      // Automatically log in after successful registration
      loginAction(data);
      
      // Pre-populate the profile cache
      queryClient.setQueryData(authKeys.profile(), data.user);
    },
    onError: (error) => {
      console.error('Registration failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook for forgot password request
 * 
 * @example
 * const forgotPasswordMutation = useForgotPassword();
 * forgotPasswordMutation.mutate({ email: '...' });
 */
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: forgotPassword,
    onError: (error) => {
      console.error('Forgot password failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook for resetting password with token
 * 
 * @example
 * const resetPasswordMutation = useResetPassword();
 * resetPasswordMutation.mutate({ token: '...', newPassword: '...' });
 */
export const useResetPassword = () => {
  return useMutation({
    mutationFn: resetPassword,
    onError: (error) => {
      console.error('Password reset failed:', extractErrorMessage(error));
    },
  });
};

/**
 * Hook for refreshing access token
 * Note: This is typically handled by the API client interceptor,
 * but can be used manually if needed
 */
export const useRefreshToken = () => {
  const setTokens = useAuthStore((state) => state.setTokens);

  return useMutation({
    mutationFn: refreshToken,
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
    },
    onError: (error) => {
      console.error('Token refresh failed:', extractErrorMessage(error));
      // Force logout on refresh failure
      useAuthStore.getState().logout();
    },
  });
};

/**
 * Hook for user logout
 * 
 * @example
 * const logoutMutation = useLogout();
 * logoutMutation.mutate();
 */
export const useLogout = () => {
  const logoutAction = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Clear Zustand auth state
      logoutAction();
      
      // Clear all TanStack Query cache
      queryClient.clear();
    },
    onError: (error) => {
      // Even if backend logout fails, clear local state
      console.error('Logout error:', extractErrorMessage(error));
      logoutAction();
      queryClient.clear();
    },
  });
};