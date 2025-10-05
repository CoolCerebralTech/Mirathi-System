// src/hooks/useFamilies.ts
// ============================================================================
// Custom Hook for Family Management (HeirLink™)
// ============================================================================
// - Manages all state and logic for family groups.
// - Handles fetching, creating, and deleting families.
// - Manages adding and removing family members, with optimistic UI updates.
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getMyFamilies, createFamily, deleteFamily, addFamilyMember, removeFamilyMember } from '../api/families';
import type { Family, RelationshipType } from '../types';

export const useFamilies = () => {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFamilies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedFamilies = await getMyFamilies();
      setFamilies(fetchedFamilies);
    } catch (err) {
      setError('Failed to load your families.');
      toast.error('Could not fetch your families.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFamilies();
  }, [fetchFamilies]);

  const handleCreateFamily = useCallback(async (name: string) => {
    const toastId = toast.loading('Creating new family...');
    try {
      const newFamily = await createFamily({ name });
      setFamilies(current => [newFamily, ...current]);
      toast.success('Family created!', { id: toastId });
    } catch (err) {
      toast.error('Failed to create family.', { id: toastId });
      throw err;
    }
  }, []);

  const handleDeleteFamily = useCallback(async (familyId: string) => {
    // Optimistic UI
    const originalFamilies = families;
    setFamilies(current => current.filter(f => f.id !== familyId));
    toast.loading('Deleting family...');
    try {
      await deleteFamily(familyId);
      toast.success('Family deleted.');
    } catch (err) {
      setFamilies(originalFamilies);
      toast.error('Failed to delete family.');
    }
  }, [families]);

  const handleAddMember = useCallback(async (familyId: string, userId: string, role: RelationshipType) => {
    toast.loading('Adding member...');
    try {
      await addFamilyMember(familyId, { userId, role });
      // Re-fetch the families to get the updated member list
      await fetchFamilies(); 
      toast.success('Member added.');
    } catch (err) {
      toast.error('Failed to add member. User may already be in the family.');
    }
  }, [fetchFamilies]);

  const handleRemoveMember = useCallback(async (familyId: string, userId: string) => {
    toast.loading('Removing member...');
    try {
      await removeFamilyMember(familyId, userId);
      // Re-fetch is the simplest way to update the state here
      await fetchFamilies();
      toast.success('Member removed.');
    } catch (err) {
      toast.error('Failed to remove member.');
    }
  }, [fetchFamilies]);

  return {
    families,
    loading,
    error,
    createFamily: handleCreateFamily,
    deleteFamily: handleDeleteFamily,
    addMember: handleAddMember,
    removeMember: handleRemoveMember,
  };
};