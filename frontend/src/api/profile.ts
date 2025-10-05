// src/api/profile.ts
// ============================================================================
// User Profile API Service
// ============================================================================
// - Encapsulates all API calls related to user profile management.
// - Fetches the current user's profile data.
// - Updates the user's profile information.
// - Handles password changes for an authenticated user.
// ============================================================================

import { apiClient } from '../lib/axios';
import type { User, UpdateUserProfileRequest, ChangePasswordRequest } from '../types';

/**
 * Fetches the complete profile for the currently authenticated user.
 *
 * @returns A promise that resolves with the user's profile data.
 */
export const getProfile = async (): Promise<User> => {
  try {
    const response = await apiClient.get<User>('/profile');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    throw error;
  }
};

/**
 * Updates the profile for the currently authenticated user.
 *
 * @param data The profile data to update.
 * @returns A promise that resolves with the updated profile data.
 */
export const updateProfile = async (data: UpdateUserProfileRequest): Promise<User> => {
    try {
      const response = await apiClient.patch<User>('/profile', data);
      return response.data;
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

/**
 * Changes the password for the currently authenticated user.
 *
 * @param data The current and new password data.
 */
export const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
    try {
      await apiClient.patch('/profile/change-password', data);
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    }
};