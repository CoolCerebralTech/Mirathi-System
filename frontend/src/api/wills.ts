// src/api/wills.ts
// ============================================================================
// Wills API Service
// ============================================================================
// - Encapsulates all API calls for the /wills endpoints.
// - Provides functions for managing wills and their beneficiary assignments.
// ============================================================================

import { apiClient } from '../lib/axios';
import type { Will } from '../types';

interface CreateWillRequest {
    title: string;
}

interface AssignBeneficiaryRequest {
    assetId: string;
    beneficiaryId: string;
    sharePercent?: number;
}

/**
 * Fetches all wills created by the current user.
 */
export const getMyWills = async (): Promise<Will[]> => {
    const response = await apiClient.get<Will[]>('/wills');
    return response.data;
};

/**
 * Fetches a single will by its ID.
 * @param willId The ID of the will to fetch.
 */
export const getWillById = async (willId: string): Promise<Will> => {
    const response = await apiClient.get<Will>(`/wills/${willId}`);
    return response.data;
}

/**
 * Creates a new will.
 * @param data The data for the new will.
 */
export const createWill = async (data: CreateWillRequest): Promise<Will> => {
    const response = await apiClient.post<Will>('/wills', data);
    return response.data;
};

/**
 * Deletes a will by its ID.
 * @param willId The ID of the will to delete.
 */
export const deleteWill = async (willId: string): Promise<void> => {
    await apiClient.delete(`/wills/${willId}`);
};

/**
 * Activates a draft will.
 * @param willId The ID of the will to activate.
 */
export const activateWill = async(willId: string): Promise<Will> => {
    const response = await apiClient.post<Will>(`/wills/${willId}/activate`);
    return response.data;
}

/**
 * Assigns a beneficiary to an asset within a will.
 * @param willId The ID of the will.
 * @param data The assignment data.
 */
export const assignBeneficiary = async (willId: string, data: AssignBeneficiaryRequest): Promise<Will> => {
    const response = await apiClient.post<Will>(`/wills/${willId}/assignments`, data);
    return response.data;
};

/**
 * Removes a beneficiary assignment from a will.
 * @param willId The ID of the will.
 * @param assignmentId The ID of the assignment to remove.
 */
export const removeBeneficiary = async (willId: string, assignmentId: string): Promise<void> => {
    await apiClient.delete(`/wills/${willId}/assignments/${assignmentId}`);
};