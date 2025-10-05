// src/api/admin.ts
// ============================================================================
// Admin API Service
// ============================================================================
// - Encapsulates all API calls for the admin-only section of the application.
// - Provides functions for fetching, updating, and deleting users.
// - Handles query parameters for pagination and filtering.
// ============================================================================

import { apiClient } from '../lib/axios';
import type { PaginatedUsersResponse, User, UpdateUserRoleRequest } from '../types';

/**
 * Fetches a paginated list of all users.
 *
 * @param page The page number to fetch.
 * @returns A promise that resolves with the paginated user data.
 */
export const getUsers = async (page = 1): Promise<PaginatedUsersResponse> => {
  try {
    const response = await apiClient.get<PaginatedUsersResponse>('/users', {
      params: { page, limit: 10 }, // Example pagination
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
};

/**
 * Updates the role of a specific user.
 *
 * @param userId The ID of the user to update.
 * @param data The new role to assign.
 * @returns A promise that resolves with the updated user data.
 */
export const updateUserRole = async (userId: string, data: UpdateUserRoleRequest): Promise<User> => {
  try {
    const response = await apiClient.patch<User>(`/users/${userId}/role`, data);
    return response.data;
  } catch (error) {
    console.error(`Failed to update role for user ${userId}:`, error);
    throw error;
  }
};