// ============================================================================
// family.api.ts - Unified Family & Guardianship API Layer
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { toast } from 'sonner';

import {
  // Input Types
  type CreateFamilyInput,
  type AddFamilyMemberInput,
  type UpdateFamilyMemberInput,
  type AssignGuardianInput,
  type GuardianEligibilityChecklist,
  // Response Types
  type FamilyTreeNode,
  type HeirsResponse,
  type GuardianshipStatusResponse,
  type EligibilityCheckResponse,
  type AddMemberResponse,
  type ChecklistTemplateResponse,
  type CreateFamilyResponse,
} from '../../types/family.types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const FAMILY_BASE_URL = '/family';
const GUARDIANSHIP_BASE_URL = '/guardianship';

export const familyKeys = {
  all: ['family'] as const,
  mine: () => [...familyKeys.all, 'mine'] as const, // The logged-in user's family
  tree: (familyId: string) => [...familyKeys.all, familyId, 'tree'] as const,
  heirs: (familyId: string) => [...familyKeys.all, familyId, 'heirs'] as const,
};

export const guardianshipKeys = {
  all: ['guardianship'] as const,
  status: (wardId: string) => [...guardianshipKeys.all, 'ward', wardId] as const,
  checklist: () => [...guardianshipKeys.all, 'checklist'] as const,
};

// ============================================================================
// API FUNCTIONS (COMMANDS - WRITE)
// ============================================================================

// --- Family Operations ---

const createFamily = async (data: CreateFamilyInput) => {
  // Idempotent call to /family
  const res = await apiClient.post<{ id: string; name: string }>(FAMILY_BASE_URL, data);
  return res.data;
};

const addMember = async ({ familyId, data }: { familyId: string; data: AddFamilyMemberInput }) => {
  const res = await apiClient.post<AddMemberResponse>(
    `${FAMILY_BASE_URL}/${familyId}/members`,
    data
  );
  return res.data;
};

const updateMember = async ({ memberId, data }: { memberId: string; data: UpdateFamilyMemberInput }) => {
  const res = await apiClient.put(`${FAMILY_BASE_URL}/members/${memberId}`, data);
  return res.data;
};

const removeMember = async (memberId: string) => {
  await apiClient.delete(`${FAMILY_BASE_URL}/members/${memberId}`);
};

// --- Guardianship Operations ---

const checkEligibility = async (data: { guardianId: string; wardId: string; checklist: GuardianEligibilityChecklist }) => {
  const res = await apiClient.post<EligibilityCheckResponse>(
    `${GUARDIANSHIP_BASE_URL}/check-eligibility`,
    data
  );
  return res.data;
};

const assignGuardian = async ({ familyId, data }: { familyId: string; data: AssignGuardianInput }) => {
  const res = await apiClient.post(`${GUARDIANSHIP_BASE_URL}/${familyId}/assign`, data);
  return res.data;
};

// ============================================================================
// API FUNCTIONS (QUERIES - READ)
// ============================================================================

// --- Family Queries ---

const getMyFamily = async () => {
  const res = await apiClient.get<{ id: string; name: string }>(`${FAMILY_BASE_URL}/mine`);
  return res.data;
};

const getMyFamilyTree = async () => {
  const res = await apiClient.get<FamilyTreeNode>(`${FAMILY_BASE_URL}/mine/tree`);
  return res.data;
};

const getFamilyTree = async (familyId: string) => {
  const res = await apiClient.get<FamilyTreeNode>(`${FAMILY_BASE_URL}/${familyId}/tree`);
  return res.data;
};

const getPotentialHeirs = async (familyId: string) => {
  const res = await apiClient.get<HeirsResponse>(`${FAMILY_BASE_URL}/${familyId}/potential-heirs`);
  return res.data;
};

// --- Guardianship Queries ---

const getGuardianshipStatus = async (wardId: string) => {
  const res = await apiClient.get<GuardianshipStatusResponse>(
    `${GUARDIANSHIP_BASE_URL}/ward/${wardId}/status`
  );
  return res.data;
};

const getChecklistTemplate = async () => {
  const res = await apiClient.get<ChecklistTemplateResponse>(`${GUARDIANSHIP_BASE_URL}/checklist-template`);
  return res.data;
};

// ============================================================================
// REACT QUERY HOOKS (MUTATIONS)
// ============================================================================

export const useCreateFamily = (options?: { onSuccess?: (data: CreateFamilyResponse) => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFamily,
    onSuccess: (data) => {
      toast.success('Family Tree Created');
      queryClient.invalidateQueries({ queryKey: familyKeys.mine() });
      options?.onSuccess?.(data);
    },
    onError: (err) => toast.error('Creation Failed', { description: extractErrorMessage(err) }),
  });
};

export const useAddMember = (familyId: string, options?: { onSuccess?: (data: AddMemberResponse) => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddFamilyMemberInput) => addMember({ familyId, data }),
    onSuccess: (data) => {
      toast.success('Member Added');
      queryClient.invalidateQueries({ queryKey: familyKeys.tree(familyId) });
      queryClient.invalidateQueries({ queryKey: familyKeys.heirs(familyId) });
      options?.onSuccess?.(data);
    },
    onError: (err) => toast.error('Failed to add member', { description: extractErrorMessage(err) }),
  });
};

export const useUpdateMember = (familyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: UpdateFamilyMemberInput }) =>
      updateMember({ memberId, data }),
    onSuccess: () => {
      toast.success('Member Updated');
      queryClient.invalidateQueries({ queryKey: familyKeys.tree(familyId) });
      queryClient.invalidateQueries({ queryKey: familyKeys.heirs(familyId) });
    },
    onError: (err) => toast.error('Update Failed', { description: extractErrorMessage(err) }),
  });
};

export const useRemoveMember = (familyId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeMember,
    onSuccess: () => {
      toast.success('Member Removed');
      queryClient.invalidateQueries({ queryKey: familyKeys.tree(familyId) });
    },
    onError: (err) => toast.error('Removal Failed', { description: extractErrorMessage(err) }),
  });
};

// --- Guardianship Mutations ---

export const useCheckEligibility = () => {
  return useMutation({
    mutationFn: checkEligibility,
    onError: (err) => toast.error('Check Failed', { description: extractErrorMessage(err) }),
  });
};

export const useAssignGuardian = (familyId: string, wardId: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignGuardianInput) => assignGuardian({ familyId, data }),
    onSuccess: () => {
      toast.success('Guardian Assigned', { description: 'Succession plan updated.' });
      queryClient.invalidateQueries({ queryKey: guardianshipKeys.status(wardId) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Assignment Failed', { description: extractErrorMessage(err) }),
  });
};

// ============================================================================
// REACT QUERY HOOKS (QUERIES)
// ============================================================================

export const useMyFamily = () => {
  return useQuery({
    queryKey: familyKeys.mine(),
    queryFn: getMyFamily,
    retry: 1,
  });
};

export const useMyFamilyTree = () => {
  return useQuery({
    queryKey: ['family', 'mine', 'tree'],
    queryFn: getMyFamilyTree,
    retry: false, // Don't retry if 404 (means no family yet)
  });
};

export const useFamilyTree = (familyId: string) => {
  return useQuery({
    queryKey: familyKeys.tree(familyId),
    queryFn: () => getFamilyTree(familyId),
    enabled: !!familyId,
  });
};

export const usePotentialHeirs = (familyId: string) => {
  return useQuery({
    queryKey: familyKeys.heirs(familyId),
    queryFn: () => getPotentialHeirs(familyId),
    enabled: !!familyId,
  });
};

export const useGuardianshipStatus = (wardId: string) => {
  return useQuery({
    queryKey: guardianshipKeys.status(wardId),
    queryFn: () => getGuardianshipStatus(wardId),
    enabled: !!wardId,
  });
};

export const useGuardianshipChecklist = () => {
  return useQuery({
    queryKey: guardianshipKeys.checklist(),
    queryFn: getChecklistTemplate,
    staleTime: Infinity, // Static data
  });
};