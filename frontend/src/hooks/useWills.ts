// src/hooks/useWills.ts
// ============================================================================
// Custom Hook for Will Management
// ============================================================================
// - Manages state and logic for wills and beneficiary assignments.
// - Can manage a list of all wills, or focus on a single will by ID.
// - Provides actions for all CRUD operations on wills and their assignments.
// ============================================================================
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getMyWills, getWillById, createWill, deleteWill, activateWill, assignBeneficiary, removeBeneficiary } from '../api/wills';
import type { Will } from '../types';
interface AssignBeneficiaryData {
assetId: string;
beneficiaryId: string;
sharePercent?: number;
}
// This hook can operate in two modes: 'list' for all wills, or 'single' for one.
export const useWills = (willId?: string) => {
const [wills, setWills] = useState<Will[]>([]);
const [will, setWill] = useState<Will | null>(null); // For the detail page
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const fetchWills = useCallback(async () => {
try {
setLoading(true);
setError(null);
const fetchedWills = await getMyWills();
setWills(fetchedWills);
} catch (err) {
setError('Failed to load wills.');
toast.error('Could not fetch your wills.');
} finally {
setLoading(false);
}
}, []);
const fetchWillById = useCallback(async (id: string) => {
try {
setLoading(true);
setError(null);
const fetchedWill = await getWillById(id);
setWill(fetchedWill);
} catch(err) {
setError('Failed to load this will.');
toast.error('Could not fetch the specified will.');
} finally {
setLoading(false);
}
}, []);
useEffect(() => {
if (willId) {
fetchWillById(willId);
} else {
fetchWills();
}
}, [willId, fetchWills, fetchWillById]);
const handleCreateWill = useCallback(async (title: string) => {
const toastId = toast.loading('Creating will...');
try {
const newWill = await createWill({ title });
setWills(current => [newWill, ...current]);
toast.success('Draft will created!', { id: toastId });
return newWill; // Return the new will so we can navigate to its detail page
} catch (err) {
toast.error('Failed to create will.', { id: toastId });
throw err;
}
}, []);
const handleActivateWill = useCallback(async (id: string) => {
toast.loading('Activating will...');
try {
const activatedWill = await activateWill(id);
setWill(activatedWill); // Update single will state
toast.success('Will has been activated!');
} catch (err) {
toast.error('Failed to activate will.');
}
}, []);
const handleAssignBeneficiary = useCallback(async (id: string, data: AssignBeneficiaryData) => {
toast.loading('Assigning beneficiary...');
try {
const updatedWill = await assignBeneficiary(id, data);
setWill(updatedWill); // Update the single will state with new assignments
toast.success('Beneficiary assigned.');
} catch (err) {
toast.error('Failed to assign beneficiary. Total shares may exceed 100%.');
}
}, []);
const handleRemoveBeneficiary = useCallback(async (id: string, assignmentId: string) => {
toast.loading('Removing assignment...');
try {
await removeBeneficiary(id, assignmentId);
// Refresh the will data to show the change
await fetchWillById(id);
toast.success('Assignment removed.');
} catch (err) {
toast.error('Failed to remove assignment.');
}
}, [fetchWillById]);
return {
wills, // For the list page
will, // For the detail page
loading,
error,
createWill: handleCreateWill,
activateWill: handleActivateWill,
assignBeneficiary: handleAssignBeneficiary,
removeBeneficiary: handleRemoveBeneficiary,
};
};