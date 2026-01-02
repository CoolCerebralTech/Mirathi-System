// src/api/auth.api.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient, extractErrorMessage } from '@/api/client';
import { useAuthStore } from '@/store/auth.store';
import { userKeys } from '../user/user.api';

// Types
import {
  AuthResponseOutputSchema,
  OAuthCallbackInputSchema,
  type AuthResponseOutput,
  type OAuthCallbackInput,
} from '@/types/auth.types';

import { 
  UserOutputSchema, 
  type UserOutput 
} from '@/types/user.types';

// ============================================================================
// GRAPHQL DOCUMENTS
// ============================================================================

// Standard User Fragment to ensure consistency across the app
const USER_FRAGMENT = `
  fragment AuthUserFields on User {
    id
    role
    status
    displayName
    isActive
    isSuspended
    isDeleted
    isPendingOnboarding
    hasCompletedOnboarding
    needsOnboarding
    createdAt
    updatedAt
    deletedAt
    
    identities {
      id
      provider
      email
      isPrimary
      linkedAt
    }
    profile {
      id
      firstName
      lastName
      fullName
      avatarUrl
      phoneNumber
      phoneVerified
      county
    }
    settings {
      id
      language
      theme
      emailNotifications
    }
  }
`;

const HANDLE_OAUTH_CALLBACK_MUTATION = `
  ${USER_FRAGMENT}
  mutation HandleOAuthCallback($input: OAuthCallbackInput!) {
    handleOAuthCallback(input: $input) {
      user {
        ...AuthUserFields
      }
      isNewUser
      message
    }
  }
`;

const COMPLETE_ONBOARDING_MUTATION = `
  ${USER_FRAGMENT}
  mutation CompleteOnboarding {
    completeOnboarding {
      ...AuthUserFields
    }
  }
`;

// ============================================================================
// HELPERS
// ============================================================================

const GRAPHQL_ENDPOINT = '/graphql';

interface GraphQLError {
  message: string;
  extensions?: {
    code?: string;
    originalError?: {
      statusCode?: number;
      message?: string;
    };
  };
}

/**
 * Validates and unwraps GraphQL responses
 */
const handleGraphQLRequest = async <T>(
  query: string, 
  variables?: Record<string, unknown>
): Promise<T> => {
  const { data } = await apiClient.post(GRAPHQL_ENDPOINT, {
    query,
    variables,
  });

  if (data.errors && data.errors.length > 0) {
    const error = data.errors[0] as GraphQLError;
    throw new Error(error.message || 'GraphQL Error');
  }

  return data.data;
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Handle OAuth Callback (Google)
 */
const handleOAuthCallback = async (input: OAuthCallbackInput): Promise<AuthResponseOutput> => {
  try {
    const validatedInput = OAuthCallbackInputSchema.parse(input);

    const response = await handleGraphQLRequest<{ handleOAuthCallback: unknown }>(
      HANDLE_OAUTH_CALLBACK_MUTATION,
      { input: validatedInput }
    );

    return AuthResponseOutputSchema.parse(response.handleOAuthCallback);
  } catch (error) {
    console.error('[Auth API] OAuth Callback failed:', error);
    throw error;
  }
};

/**
 * Complete Onboarding
 */
const completeOnboarding = async (): Promise<UserOutput> => {
  try {
    const response = await handleGraphQLRequest<{ completeOnboarding: unknown }>(
      COMPLETE_ONBOARDING_MUTATION
    );

    return UserOutputSchema.parse(response.completeOnboarding);
  } catch (error) {
    console.error('[Auth API] Complete onboarding failed:', error);
    throw error;
  }
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

/**
 * Hook for Google Login
 */
export const useOAuthLogin = (options?: {
  onSuccess?: (data: AuthResponseOutput) => void;
  onError?: (error: unknown) => void;
}) => {
  const { login } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: handleOAuthCallback,
    
    onSuccess: (data) => {
      // 1. Update Global Store (assumes Cookie for session)
      login({ user: data.user, isAuthenticated: true });
      
      // 2. Pre-populate User Cache
      queryClient.setQueryData(userKeys.profile(), data.user);

      // 3. UX Feedback
      toast.success(data.message || 'Authentication successful', {
        description: data.isNewUser 
          ? 'Welcome to Shamba Sure! Let\'s set up your profile.' 
          : `Welcome back, ${data.user.displayName}`,
        duration: 4000,
      });

      options?.onSuccess?.(data);
    },

    onError: (error) => {
      const message = extractErrorMessage(error);
      toast.error('Authentication failed', { description: message });
      options?.onError?.(error);
    },
  });
};

/**
 * Hook for Completing Onboarding
 */
export const useCompleteOnboarding = (options?: {
  onSuccess?: (user: UserOutput) => void;
}) => {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeOnboarding,

    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.setQueryData(userKeys.profile(), updatedUser);

      toast.success('Onboarding Completed', {
        description: 'Your account is now fully active.',
      });

      options?.onSuccess?.(updatedUser);
    },

    onError: (error) => {
      toast.error('Failed to complete onboarding', {
        description: extractErrorMessage(error),
      });
    },
  });
};

/**
 * Hook for Logout
 * WARNING: Performs Client-Side logout only as no Backend Mutation exists.
 */
export const useLogout = (options?: { onSuccess?: () => void }) => {
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Future-proofing: If you add a REST logout endpoint to clear cookies:
      // await apiClient.post('/auth/logout'); 
      return true;
    },
    
    onSuccess: () => {
      logout();
      queryClient.clear(); // Important: Clears all sensitive data from cache
      toast.success('Logged out successfully');
      options?.onSuccess?.();
    },
  });
};