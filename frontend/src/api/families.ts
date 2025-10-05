// src/api/families.ts
// ============================================================================
// Families API Service
// ============================================================================
// - Encapsulates all API calls for the /families (HeirLink™) endpoints.
// - Provides functions for managing families and their members.
// ============================================================================

import { apiClient } from '../lib/axios';
import type { Family, FamilyMember, RelationshipType } from '../types';

interface CreateFamilyRequest {
    name: string;
}

interface AddFamilyMemberRequest {
    userId: string;
    role: RelationshipType;
}

/**
 * Fetches all families the current user is a member of.
 */
export const getMyFamilies = async (): Promise<Family[]> => {
    const response = await apiClient.get<Family[]>('/families');
    return response.data;
};

/**
 * Creates a new family group.
 * @param data The data for the new family.
 */
export const createFamily = async (data: CreateFamilyRequest): Promise<Family> => {
    const response = await apiClient.post<Family>('/families', data);
    return response.data;
};

/**
 * Deletes a family group by its ID.
 * @param familyId The ID of the family to delete.
 */
export const deleteFamily = async (familyId: string): Promise<void> => {
    await apiClient.delete(`/families/${familyId}`);
};

/**
 * Adds a new member to a family.
 * @param familyId The ID of the family.
 * @param data The details of the member to add.
 */
export const addFamilyMember = async (familyId: string, data: AddFamilyMemberRequest): Promise<FamilyMember> => {
    const response = await apiClient.post<FamilyMember>(`/families/${familyId}/members`, data);
    return response.data;
};

/**
 * Removes a member from a family.
 * @param familyId The ID of the family.
 * @param userId The ID of the user to remove.
 */
export const removeFamilyMember = async (familyId: string, userId: string): Promise<void> => {
    await apiClient.delete(`/families/${familyId}/members/${userId}`);
};