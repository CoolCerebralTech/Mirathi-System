// FILE: src/api/family/family.api.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient, extractErrorMessage } from '@/lib/apiClient';

import type {
  // Input Types
  CreateFamilyInput,
  AddFamilyMemberInput,
  UpdateFamilyMemberInput,
  AssignGuardianInput,
  CheckGuardianEligibilityInput,
  // Response Types
  FamilyResponse,
  AddMemberResponse,
  FamilyMemberResponse,
  FamilyTreeNode,
  HeirsResponse,
  GuardianshipStatusResponse,
  EligibilityCheckResponse,
  ChecklistTemplateResponse,
  GuardianAssignmentSummary,
  GuardianshipRecord,
} from '@/types/family.types';

// ============================================================================
// CONFIGURATION & QUERY KEYS
// ============================================================================

// FIX: Both bases must start with /family to pass through the Gateway correctly
const FAMILY_BASE = '/family';
const GUARDIANSHIP_BASE = '/family/guardianship'; 

export const familyKeys = {
  all: ['family'] as const,
  mine: () => [...familyKeys.all, 'mine'] as const,
  tree: (familyId: string) => [...familyKeys.all, familyId, 'tree'] as const,
  myTree: () => [...familyKeys.all, 'mine', 'tree'] as const,
  heirs: (familyId: string) => [...familyKeys.all, familyId, 'heirs'] as const,
  members: (familyId: string) => [...familyKeys.all, familyId, 'members'] as const,
  member: (memberId: string) => [...familyKeys.all, 'members', memberId] as const,
};

export const guardianshipKeys = {
  all: ['guardianship'] as const,
  status: (wardId: string) => [...guardianshipKeys.all, 'ward', wardId, 'status'] as const,
  checklist: () => [...guardianshipKeys.all, 'checklist'] as const,
};

// ============================================================================
// LOCAL TYPES 
// ============================================================================

// We define this locally to compose the specific response shape for this mutation
export interface AssignGuardianResponse {
  guardianship: GuardianshipRecord;
  assignment: GuardianAssignmentSummary;
  eligibility: EligibilityCheckResponse;
}

// ============================================================================
// API FUNCTIONS - FAMILY OPERATIONS (Write)
// ============================================================================

const createFamily = async (data: CreateFamilyInput): Promise<FamilyResponse> => {
  // POST /api/family
  const res = await apiClient.post<FamilyResponse>(FAMILY_BASE, data);
  return res.data;
};

const addFamilyMember = async ({
  familyId,
  data,
}: {
  familyId: string;
  data: AddFamilyMemberInput;
}): Promise<AddMemberResponse> => {
  // POST /api/family/:id/members
  const res = await apiClient.post<AddMemberResponse>(
    `${FAMILY_BASE}/${familyId}/members`,
    data
  );
  return res.data;
};

const updateFamilyMember = async ({
  memberId,
  data,
}: {
  memberId: string;
  data: UpdateFamilyMemberInput;
}): Promise<FamilyMemberResponse> => {
  // PUT /api/family/members/:id
  const res = await apiClient.put<FamilyMemberResponse>(
    `${FAMILY_BASE}/members/${memberId}`,
    data
  );
  return res.data;
};

const removeFamilyMember = async (memberId: string): Promise<void> => {
  // DELETE /api/family/members/:id
  await apiClient.delete(`${FAMILY_BASE}/members/${memberId}`);
};

// ============================================================================
// API FUNCTIONS - FAMILY QUERIES (Read)
// ============================================================================

const getMyFamily = async (): Promise<FamilyResponse> => {
  const res = await apiClient.get<FamilyResponse>(`${FAMILY_BASE}/mine`);
  return res.data;
};

const getMyFamilyTree = async (): Promise<FamilyTreeNode> => {
  const res = await apiClient.get<FamilyTreeNode>(`${FAMILY_BASE}/mine/tree`);
  return res.data;
};

const getFamilyTree = async (familyId: string): Promise<FamilyTreeNode> => {
  const res = await apiClient.get<FamilyTreeNode>(`${FAMILY_BASE}/${familyId}/tree`);
  return res.data;
};

const getPotentialHeirs = async (familyId: string): Promise<HeirsResponse> => {
  const res = await apiClient.get<HeirsResponse>(`${FAMILY_BASE}/${familyId}/potential-heirs`);
  return res.data;
};

// ============================================================================
// API FUNCTIONS - GUARDIANSHIP OPERATIONS (Write)
// ============================================================================

const checkGuardianEligibility = async (
  data: CheckGuardianEligibilityInput
): Promise<EligibilityCheckResponse> => {
  // FIX: POST /api/family/guardianship/check-eligibility
  const res = await apiClient.post<EligibilityCheckResponse>(
    `${GUARDIANSHIP_BASE}/check-eligibility`,
    data
  );
  return res.data;
};

const assignGuardian = async ({
  familyId,
  data,
}: {
  familyId: string;
  data: AssignGuardianInput;
}): Promise<AssignGuardianResponse> => {
  // FIX: POST /api/family/guardianship/:id/assign
  const res = await apiClient.post<AssignGuardianResponse>(
    `${GUARDIANSHIP_BASE}/${familyId}/assign`,
    data
  );
  return res.data;
};

// ============================================================================
// API FUNCTIONS - GUARDIANSHIP QUERIES (Read)
// ============================================================================

const getGuardianshipStatus = async (wardId: string): Promise<GuardianshipStatusResponse> => {
  // FIX: GET /api/family/guardianship/ward/:id/status
  const res = await apiClient.get<GuardianshipStatusResponse>(
    `${GUARDIANSHIP_BASE}/ward/${wardId}/status`
  );
  return res.data;
};

const getChecklistTemplate = async (): Promise<ChecklistTemplateResponse> => {
  // FIX: GET /api/family/guardianship/checklist-template
  const res = await apiClient.get<ChecklistTemplateResponse>(
    `${GUARDIANSHIP_BASE}/checklist-template`
  );
  return res.data;
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

export const useCreateFamily = (options?: { onSuccess?: (data: FamilyResponse) => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFamily,
    onSuccess: (data) => {
      toast.success('Family Tree Created', { description: `"${data.name}" is ready to use` });
      queryClient.invalidateQueries({ queryKey: familyKeys.mine() });
      options?.onSuccess?.(data);
    },
    onError: (err) => { toast.error('Failed to Create Family', { description: extractErrorMessage(err) }); },
  });
};

export const useAddFamilyMember = (familyId: string, options?: { onSuccess?: (data: AddMemberResponse) => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddFamilyMemberInput) => addFamilyMember({ familyId, data }),
    onSuccess: (data) => {
      toast.success('Member Added');
      queryClient.invalidateQueries({ queryKey: familyKeys.tree(familyId) });
      queryClient.invalidateQueries({ queryKey: familyKeys.myTree() });
      queryClient.invalidateQueries({ queryKey: familyKeys.heirs(familyId) });
      queryClient.invalidateQueries({ queryKey: familyKeys.members(familyId) });
      options?.onSuccess?.(data);
    },
    onError: (err) => { toast.error('Failed to Add Member', { description: extractErrorMessage(err) }); },
  });
};

export const useUpdateFamilyMember = (familyId: string, options?: { onSuccess?: (data: FamilyMemberResponse) => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: UpdateFamilyMemberInput }) => updateFamilyMember({ memberId, data }),
    onSuccess: (data) => {
      toast.success('Member Updated');
      queryClient.invalidateQueries({ queryKey: familyKeys.tree(familyId) });
      queryClient.invalidateQueries({ queryKey: familyKeys.myTree() });
      queryClient.invalidateQueries({ queryKey: familyKeys.heirs(familyId) });
      queryClient.invalidateQueries({ queryKey: familyKeys.member(data.id) });
      options?.onSuccess?.(data);
    },
    onError: (err) => { toast.error('Failed to Update Member', { description: extractErrorMessage(err) }); },
  });
};

export const useRemoveFamilyMember = (familyId: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeFamilyMember,
    onSuccess: () => {
      toast.success('Member Removed');
      queryClient.invalidateQueries({ queryKey: familyKeys.tree(familyId) });
      queryClient.invalidateQueries({ queryKey: familyKeys.myTree() });
      queryClient.invalidateQueries({ queryKey: familyKeys.heirs(familyId) });
      options?.onSuccess?.();
    },
    onError: (err) => { toast.error('Failed to Remove Member', { description: extractErrorMessage(err) }); },
  });
};

export const useCheckGuardianEligibility = (options?: { onSuccess?: (data: EligibilityCheckResponse) => void }) => {
  return useMutation({
    mutationFn: checkGuardianEligibility,
    onSuccess: (data) => {
      const status = data.isEligible ? 'Eligible' : 'Not Eligible';
      const variant = data.isEligible ? 'success' : 'warning';
      toast[variant](`Guardian ${status}`, { description: `Overall score: ${data.overallScore}/100` });
      options?.onSuccess?.(data);
    },
    onError: (err) => { toast.error('Eligibility Check Failed', { description: extractErrorMessage(err) }); },
  });
};

export const useAssignGuardian = (familyId: string, wardId: string, options?: { onSuccess?: (data: AssignGuardianResponse) => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignGuardianInput) => assignGuardian({ familyId, data }),
    onSuccess: (data) => {
      toast.success('Guardian Assigned');
      queryClient.invalidateQueries({ queryKey: guardianshipKeys.status(wardId) });
      queryClient.invalidateQueries({ queryKey: familyKeys.tree(familyId) });
      options?.onSuccess?.(data);
    },
    onError: (err) => { toast.error('Assignment Failed', { description: extractErrorMessage(err) }); },
  });
};

export const useMyFamily = (options?: { enabled?: boolean; onError?: (err: Error) => void }) => {
  return useQuery({
    queryKey: familyKeys.mine(),
    queryFn: getMyFamily,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled,
  });
};

export const useMyFamilyTree = (options?: { enabled?: boolean; onError?: (err: Error) => void }) => {
  return useQuery({
    queryKey: familyKeys.myTree(),
    queryFn: getMyFamilyTree,
    retry: false,
    staleTime: 2 * 60 * 1000,
    enabled: options?.enabled,
  });
};

export const useFamilyTree = (familyId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: familyKeys.tree(familyId),
    queryFn: () => getFamilyTree(familyId),
    enabled: !!familyId && (options?.enabled ?? true),
    staleTime: 2 * 60 * 1000,
  });
};

export const usePotentialHeirs = (familyId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: familyKeys.heirs(familyId),
    queryFn: () => getPotentialHeirs(familyId),
    enabled: !!familyId && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
  });
};

export const useGuardianshipStatus = (wardId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: guardianshipKeys.status(wardId),
    queryFn: () => getGuardianshipStatus(wardId),
    enabled: !!wardId && (options?.enabled ?? true),
    staleTime: 2 * 60 * 1000,
  });
};

export const useGuardianshipChecklist = () => {
  return useQuery({
    queryKey: guardianshipKeys.checklist(),
    queryFn: getChecklistTemplate,
    staleTime: Infinity,
    gcTime: Infinity,
  });
};

export const familyApi = {
  createFamily, getMyFamily, getMyFamilyTree, getFamilyTree, addFamilyMember, updateFamilyMember, removeFamilyMember, getPotentialHeirs,
  checkGuardianEligibility, assignGuardian, getGuardianshipStatus, getChecklistTemplate,
};

export default {
  useCreateFamily, useAddFamilyMember, useUpdateFamilyMember, useRemoveFamilyMember,
  useMyFamily, useMyFamilyTree, useFamilyTree, usePotentialHeirs,
  useCheckGuardianEligibility, useAssignGuardian, useGuardianshipStatus, useGuardianshipChecklist,
};