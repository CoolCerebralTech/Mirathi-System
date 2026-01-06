// mirathi-frontend/src/family/family.api.ts
// ============================================================================
// Unified Family & Guardianship API Layer
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient, extractErrorMessage } from '@/api/client';

import type {
  // Input Types
  CreateFamilyInput,
  AddFamilyMemberInput,
  UpdateFamilyMemberInput,
  AssignGuardianInput,
  GuardianEligibilityChecklist,
  // Response Types
  CreateFamilyResponse,
  FamilyResponse,
  AddMemberResponse,
  FamilyMemberResponse,
  FamilyTreeNode,
  HeirsResponse,
  GuardianshipStatusResponse,
  EligibilityCheckResponse,
  ChecklistTemplateResponse,
  GuardianAssignmentSummary,
} from '@/types/family.types';

// ============================================================================
// CONFIGURATION & QUERY KEYS
// ============================================================================

const FAMILY_BASE = '/family';
const GUARDIANSHIP_BASE = '/guardianship';

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
// API FUNCTIONS - FAMILY OPERATIONS (Write)
// ============================================================================

/**
 * Create or get existing family (idempotent)
 * POST /family
 */
const createFamily = async (data: CreateFamilyInput): Promise<CreateFamilyResponse> => {
  const res = await apiClient.post<CreateFamilyResponse>(FAMILY_BASE, data);
  return res.data;
};

/**
 * Add member to family
 * POST /family/:familyId/members
 */
const addFamilyMember = async ({
  familyId,
  data,
}: {
  familyId: string;
  data: AddFamilyMemberInput;
}): Promise<AddMemberResponse> => {
  const res = await apiClient.post<AddMemberResponse>(
    `${FAMILY_BASE}/${familyId}/members`,
    data
  );
  return res.data;
};

/**
 * Update family member
 * PUT /family/members/:memberId
 */
const updateFamilyMember = async ({
  memberId,
  data,
}: {
  memberId: string;
  data: UpdateFamilyMemberInput;
}): Promise<FamilyMemberResponse> => {
  const res = await apiClient.put<FamilyMemberResponse>(
    `${FAMILY_BASE}/members/${memberId}`,
    data
  );
  return res.data;
};

/**
 * Remove family member (soft delete)
 * DELETE /family/members/:memberId
 */
const removeFamilyMember = async (memberId: string): Promise<void> => {
  await apiClient.delete(`${FAMILY_BASE}/members/${memberId}`);
};

// ============================================================================
// API FUNCTIONS - FAMILY QUERIES (Read)
// ============================================================================

/**
 * Get my family aggregate
 * GET /family/mine
 */
const getMyFamily = async (): Promise<FamilyResponse> => {
  const res = await apiClient.get<FamilyResponse>(`${FAMILY_BASE}/mine`);
  return res.data;
};

/**
 * Get my family tree (convenience endpoint)
 * GET /family/mine/tree
 */
const getMyFamilyTree = async (): Promise<FamilyTreeNode> => {
  const res = await apiClient.get<FamilyTreeNode>(`${FAMILY_BASE}/mine/tree`);
  return res.data;
};

/**
 * Get family tree by ID
 * GET /family/:familyId/tree
 */
const getFamilyTree = async (familyId: string): Promise<FamilyTreeNode> => {
  const res = await apiClient.get<FamilyTreeNode>(`${FAMILY_BASE}/${familyId}/tree`);
  return res.data;
};

/**
 * Get potential heirs (Section 40 analysis)
 * GET /family/:familyId/potential-heirs
 */
const getPotentialHeirs = async (familyId: string): Promise<HeirsResponse> => {
  const res = await apiClient.get<HeirsResponse>(`${FAMILY_BASE}/${familyId}/potential-heirs`);
  return res.data;
};

// ============================================================================
// API FUNCTIONS - GUARDIANSHIP OPERATIONS (Write)
// ============================================================================

/**
 * Check guardian eligibility
 * POST /guardianship/check-eligibility
 */
const checkGuardianEligibility = async (data: {
  guardianId: string;
  wardId: string;
  checklist: GuardianEligibilityChecklist;
}): Promise<EligibilityCheckResponse> => {
  const res = await apiClient.post<EligibilityCheckResponse>(
    `${GUARDIANSHIP_BASE}/check-eligibility`,
    data
  );
  return res.data;
};

/**
 * Assign guardian to ward
 * POST /guardianship/:familyId/assign
 */
const assignGuardian = async ({
  familyId,
  data,
}: {
  familyId: string;
  data: AssignGuardianInput;
}): Promise<GuardianAssignmentSummary> => {
  const res = await apiClient.post<GuardianAssignmentSummary>(
    `${GUARDIANSHIP_BASE}/${familyId}/assign`,
    data
  );
  return res.data;
};

// ============================================================================
// API FUNCTIONS - GUARDIANSHIP QUERIES (Read)
// ============================================================================

/**
 * Get guardianship status for a ward
 * GET /guardianship/ward/:wardId/status
 */
const getGuardianshipStatus = async (wardId: string): Promise<GuardianshipStatusResponse> => {
  const res = await apiClient.get<GuardianshipStatusResponse>(
    `${GUARDIANSHIP_BASE}/ward/${wardId}/status`
  );
  return res.data;
};

/**
 * Get eligibility checklist template
 * GET /guardianship/checklist-template
 */
const getChecklistTemplate = async (): Promise<ChecklistTemplateResponse> => {
  const res = await apiClient.get<ChecklistTemplateResponse>(
    `${GUARDIANSHIP_BASE}/checklist-template`
  );
  return res.data;
};

// ============================================================================
// REACT QUERY HOOKS - FAMILY MUTATIONS
// ============================================================================

/**
 * Hook to create/get family (idempotent)
 */
export const useCreateFamily = (options?: {
  onSuccess?: (data: CreateFamilyResponse) => void;
}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createFamily,
    onSuccess: (data) => {
      toast.success('Family Tree Created', {
        description: `"${data.name}" is ready to use`,
      });
      queryClient.invalidateQueries({ queryKey: familyKeys.mine() });
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      toast.error('Failed to Create Family', {
        description: extractErrorMessage(err),
      });
    },
  });
};

/**
 * Hook to add family member
 */
export const useAddFamilyMember = (
  familyId: string,
  options?: {
    onSuccess?: (data: AddMemberResponse) => void;
  }
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: AddFamilyMemberInput) => addFamilyMember({ familyId, data }),
    onSuccess: (data) => {
      const suggestions = data.suggestions || [];
      const hasSuggestions = suggestions.length > 0;
      
      toast.success('Member Added', {
        description: hasSuggestions
          ? `${suggestions.length} suggestion${suggestions.length > 1 ? 's' : ''} available`
          : 'Family tree updated successfully',
      });
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: familyKeys.tree(familyId) });
      queryClient.invalidateQueries({ queryKey: familyKeys.myTree() });
      queryClient.invalidateQueries({ queryKey: familyKeys.heirs(familyId) });
      queryClient.invalidateQueries({ queryKey: familyKeys.members(familyId) });
      
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      toast.error('Failed to Add Member', {
        description: extractErrorMessage(err),
      });
    },
  });
};

/**
 * Hook to update family member
 */
export const useUpdateFamilyMember = (
  familyId: string,
  options?: {
    onSuccess?: (data: FamilyMemberResponse) => void;
  }
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: UpdateFamilyMemberInput }) =>
      updateFamilyMember({ memberId, data }),
    onSuccess: (data) => {
      toast.success('Member Updated', {
        description: `${data.firstName} ${data.lastName} updated successfully`,
      });
      
      queryClient.invalidateQueries({ queryKey: familyKeys.tree(familyId) });
      queryClient.invalidateQueries({ queryKey: familyKeys.myTree() });
      queryClient.invalidateQueries({ queryKey: familyKeys.heirs(familyId) });
      queryClient.invalidateQueries({ queryKey: familyKeys.member(data.id) });
      
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      toast.error('Failed to Update Member', {
        description: extractErrorMessage(err),
      });
    },
  });
};

/**
 * Hook to remove family member
 */
export const useRemoveFamilyMember = (
  familyId: string,
  options?: {
    onSuccess?: () => void;
  }
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: removeFamilyMember,
    onSuccess: () => {
      toast.success('Member Removed', {
        description: 'Family tree updated',
      });
      
      queryClient.invalidateQueries({ queryKey: familyKeys.tree(familyId) });
      queryClient.invalidateQueries({ queryKey: familyKeys.myTree() });
      queryClient.invalidateQueries({ queryKey: familyKeys.heirs(familyId) });
      
      options?.onSuccess?.();
    },
    onError: (err) => {
      toast.error('Failed to Remove Member', {
        description: extractErrorMessage(err),
      });
    },
  });
};

// ============================================================================
// REACT QUERY HOOKS - GUARDIANSHIP MUTATIONS
// ============================================================================

/**
 * Hook to check guardian eligibility
 */
export const useCheckGuardianEligibility = (options?: {
  onSuccess?: (data: EligibilityCheckResponse) => void;
}) => {
  return useMutation({
    mutationFn: checkGuardianEligibility,
    onSuccess: (data) => {
      const status = data.isEligible ? 'Eligible' : 'Not Eligible';
      const variant = data.isEligible ? 'success' : 'warning';
      
      toast[variant](`Guardian ${status}`, {
        description: `Overall score: ${data.overallScore}/100`,
      });
      
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      toast.error('Eligibility Check Failed', {
        description: extractErrorMessage(err),
      });
    },
  });
};

/**
 * Hook to assign guardian
 */
export const useAssignGuardian = (
  familyId: string,
  wardId: string,
  options?: {
    onSuccess?: (data: GuardianAssignmentSummary) => void;
  }
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: AssignGuardianInput) => assignGuardian({ familyId, data }),
    onSuccess: (data) => {
      const role = data.isPrimary ? 'Primary Guardian' : 'Alternate Guardian';
      
      toast.success('Guardian Assigned', {
        description: `${data.guardianName} assigned as ${role}`,
      });
      
      queryClient.invalidateQueries({ queryKey: guardianshipKeys.status(wardId) });
      queryClient.invalidateQueries({ queryKey: familyKeys.tree(familyId) });
      
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      toast.error('Assignment Failed', {
        description: extractErrorMessage(err),
      });
    },
  });
};

// ============================================================================
// REACT QUERY HOOKS - FAMILY QUERIES
// ============================================================================

/**
 * Hook to get my family aggregate
 */
export const useMyFamily = (options?: {
  enabled?: boolean;
  onError?: (err: Error) => void;
}) => {
  return useQuery({
    queryKey: familyKeys.mine(),
    queryFn: getMyFamily,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: options?.enabled,
  });
};

/**
 * Hook to get my family tree
 */
export const useMyFamilyTree = (options?: {
  enabled?: boolean;
  onError?: (err: Error) => void;
}) => {
  return useQuery({
    queryKey: familyKeys.myTree(),
    queryFn: getMyFamilyTree,
    retry: false, // Don't retry if 404 (no family yet)
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: options?.enabled,
  });
};

/**
 * Hook to get family tree by ID
 */
export const useFamilyTree = (
  familyId: string,
  options?: {
    enabled?: boolean;
  }
) => {
  return useQuery({
    queryKey: familyKeys.tree(familyId),
    queryFn: () => getFamilyTree(familyId),
    enabled: !!familyId && (options?.enabled ?? true),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to get potential heirs
 */
export const usePotentialHeirs = (
  familyId: string,
  options?: {
    enabled?: boolean;
  }
) => {
  return useQuery({
    queryKey: familyKeys.heirs(familyId),
    queryFn: () => getPotentialHeirs(familyId),
    enabled: !!familyId && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ============================================================================
// REACT QUERY HOOKS - GUARDIANSHIP QUERIES
// ============================================================================

/**
 * Hook to get guardianship status for a ward
 */
export const useGuardianshipStatus = (
  wardId: string,
  options?: {
    enabled?: boolean;
  }
) => {
  return useQuery({
    queryKey: guardianshipKeys.status(wardId),
    queryFn: () => getGuardianshipStatus(wardId),
    enabled: !!wardId && (options?.enabled ?? true),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to get eligibility checklist template (static data)
 */
export const useGuardianshipChecklist = () => {
  return useQuery({
    queryKey: guardianshipKeys.checklist(),
    queryFn: getChecklistTemplate,
    staleTime: Infinity, // Static data - cache forever
    gcTime: Infinity,
  });
};

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

// Export raw API functions for imperative usage
export const familyApi = {
  // Family operations
  createFamily,
  getMyFamily,
  getMyFamilyTree,
  getFamilyTree,
  addFamilyMember,
  updateFamilyMember,
  removeFamilyMember,
  getPotentialHeirs,
  
  // Guardianship operations
  checkGuardianEligibility,
  assignGuardian,
  getGuardianshipStatus,
  getChecklistTemplate,
};

// Export all hooks as default
export default {
  // Family mutations
  useCreateFamily,
  useAddFamilyMember,
  useUpdateFamilyMember,
  useRemoveFamilyMember,
  
  // Family queries
  useMyFamily,
  useMyFamilyTree,
  useFamilyTree,
  usePotentialHeirs,
  
  // Guardianship mutations
  useCheckGuardianEligibility,
  useAssignGuardian,
  
  // Guardianship queries
  useGuardianshipStatus,
  useGuardianshipChecklist,
};