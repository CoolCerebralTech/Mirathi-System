// src/api/user.api.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/api/client';

// Types
import {
  UserOutputSchema,
  UpdateProfileInputSchema,
  UpdateSettingsInputSchema,
  type UserOutput,
  type UpdateProfileInput,
  type UpdateSettingsInput,
} from '@/types/user.types';

// ============================================================================
// GRAPHQL DOCUMENTS
// ============================================================================

const ME_QUERY = `
  query GetCurrentUser {
    me {
      id
      role
      status
      displayName
      isActive
      profile {
        firstName
        lastName
        avatarUrl
        phoneNumber
        phoneVerified
        county
        physicalAddress
        postalAddress
      }
      settings {
        language
        theme
        emailNotifications
        smsNotifications
      }
    }
  }
`;

const UPDATE_PROFILE_MUTATION = `
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      profile {
        firstName
        lastName
        phoneNumber
        county
        physicalAddress
      }
    }
  }
`;

const UPDATE_SETTINGS_MUTATION = `
  mutation UpdateSettings($input: UpdateSettingsInput!) {
    updateSettings(input: $input) {
      id
      settings {
        language
        theme
        emailNotifications
      }
    }
  }
`;

// ============================================================================
// QUERY KEYS
// ============================================================================

export const userKeys = {
  all: ['user'] as const,
  profile: () => [...userKeys.all, 'profile'] as const,
  settings: () => [...userKeys.all, 'settings'] as const,
  onboarding: () => [...userKeys.all, 'onboarding'] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

const getCurrentUser = async (): Promise<UserOutput> => {
  const { data } = await apiClient.post('/graphql', { query: ME_QUERY });
  
  if (data.errors && data.errors.length > 0) {
    throw new Error(data.errors[0].message);
  }
  
  return UserOutputSchema.parse(data.data.me);
};

const updateProfile = async (input: UpdateProfileInput): Promise<UserOutput> => {
  const validated = UpdateProfileInputSchema.parse(input);
  const { data } = await apiClient.post('/graphql', {
    query: UPDATE_PROFILE_MUTATION,
    variables: { input: validated },
  });

  if (data.errors && data.errors.length > 0) {
    throw new Error(data.errors[0].message);
  }

  return UserOutputSchema.parse(data.data.updateProfile);
};

const updateSettings = async (input: UpdateSettingsInput): Promise<UserOutput> => {
  const validated = UpdateSettingsInputSchema.parse(input);
  const { data } = await apiClient.post('/graphql', {
    query: UPDATE_SETTINGS_MUTATION,
    variables: { input: validated },
  });

  if (data.errors && data.errors.length > 0) {
    throw new Error(data.errors[0].message);
  }

  return UserOutputSchema.parse(data.data.updateSettings);
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

export const useCurrentUser = () => {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: getCurrentUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false, // Don't retry 401s
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(userKeys.profile(), data);
      toast.success('Profile updated successfully');
    },
    // Fix: Explicitly typed error or used 'unknown' + generic handling
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to update profile');
    },
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSettings,
    // Fix: Removed unused 'data' parameter
    onSuccess: () => {
      // Invalidate query to trigger re-fetch or optimistically update
      queryClient.invalidateQueries({ queryKey: userKeys.profile() });
      toast.success('Settings saved');
    },
  });
};