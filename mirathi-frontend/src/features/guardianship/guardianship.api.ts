// ============================================================================
// guardianship.api.ts - Guardianship Service API Layer
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { toast } from 'sonner';

import {
  // Input Types
  type CreateGuardianshipInput,
  type ActivateGuardianshipInput,
  type TerminateGuardianshipInput,
  type AppointGuardianInput,
  type UpdatePowersInput,
  type PostBondInput,
  type SuspendGuardianInput,
  type SubmitComplianceInput,
  type RecordConflictInput,
  type ResolveConflictInput,
  type ReviewComplianceInput,
  type AutoGenerateSectionInput,
  // Response Types
  type PaginatedGuardianshipResponse,
  type GuardianshipDetailsResponse,
  type ComplianceTimelineResponse,
  type RiskAssessmentResponse,
} from '../../types/guardianship.types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = '/family/guardianships';

export const guardianshipKeys = {
  all: ['guardianships'] as const,
  lists: () => [...guardianshipKeys.all, 'list'] as const,
  list: (filters: string) => [...guardianshipKeys.lists(), { filters }] as const,
  details: () => [...guardianshipKeys.all, 'detail'] as const,
  detail: (id: string) => [...guardianshipKeys.details(), id] as const,
  timeline: (id: string) => [...guardianshipKeys.detail(id), 'timeline'] as const,
  risk: (id: string) => [...guardianshipKeys.detail(id), 'risk'] as const,
};

// ============================================================================
// TYPES
// ============================================================================

interface SearchGuardianshipsParams {
  page?: number;
  pageSize?: number;
  status?: string;
  wardName?: string;
  riskLevel?: string;
}

interface DocumentPreviewResponse {
  content: string;
  metadata: {
    title: string;
    generatedAt: string;
    version: string;
  };
}

// ============================================================================
// API FUNCTIONS (COMMANDS - WRITE)
// ============================================================================

// --- Lifecycle Management ---
const createGuardianship = async (data: CreateGuardianshipInput) => {
  const res = await apiClient.post<{ id: string }>(BASE_URL, data);
  return res.data;
};

const activateGuardianship = async ({ id, data }: { id: string; data: ActivateGuardianshipInput }) => {
  const res = await apiClient.post<{ success: boolean }>(`${BASE_URL}/${id}/activate`, data);
  return res.data;
};

const terminateGuardianship = async ({ id, data }: { id: string; data: TerminateGuardianshipInput }) => {
  const res = await apiClient.post<{ success: boolean }>(`${BASE_URL}/${id}/terminate`, data);
  return res.data;
};

// --- Guardian Operations ---
const appointGuardian = async ({ id, data }: { id: string; data: AppointGuardianInput }) => {
  const res = await apiClient.post<{ assignmentId: string }>(`${BASE_URL}/${id}/guardians`, data);
  return res.data;
};

const updatePowers = async ({
  id,
  guardianId,
  data,
}: {
  id: string;
  guardianId: string;
  data: UpdatePowersInput;
}) => {
  const res = await apiClient.put<{ success: boolean }>(
    `${BASE_URL}/${id}/guardians/${guardianId}/powers`,
    data
  );
  return res.data;
};

const postBond = async ({
  id,
  guardianId,
  data,
}: {
  id: string;
  guardianId: string;
  data: PostBondInput;
}) => {
  const res = await apiClient.post<{ success: boolean }>(
    `${BASE_URL}/${id}/guardians/${guardianId}/bond`,
    data
  );
  return res.data;
};

const suspendGuardian = async ({
  id,
  guardianId,
  data,
}: {
  id: string;
  guardianId: string;
  data: SuspendGuardianInput;
}) => {
  const res = await apiClient.post<{ success: boolean }>(
    `${BASE_URL}/${id}/guardians/${guardianId}/suspend`,
    data
  );
  return res.data;
};

// --- Compliance Management ---
const submitCompliance = async ({
  id,
  checkId,
  data,
}: {
  id: string;
  checkId: string;
  data: SubmitComplianceInput;
}) => {
  const res = await apiClient.post<{ success: boolean }>(
    `${BASE_URL}/${id}/compliance/${checkId}/submit`,
    data
  );
  return res.data;
};

const reviewCompliance = async ({
  id,
  checkId,
  data,
}: {
  id: string;
  checkId: string;
  data: ReviewComplianceInput;
}) => {
  const res = await apiClient.post<{ success: boolean }>(
    `${BASE_URL}/${id}/compliance/${checkId}/review`,
    data
  );
  return res.data;
};

const autoGenerateSection = async ({
  id,
  checkId,
  data,
}: {
  id: string;
  checkId: string;
  data: AutoGenerateSectionInput;
}) => {
  const res = await apiClient.post<{ generatedContent: string }>(
    `${BASE_URL}/${id}/compliance/${checkId}/auto-generate`,
    data
  );
  return res.data;
};

// --- Risk Management ---
const recordConflict = async ({ id, data }: { id: string; data: RecordConflictInput }) => {
  const res = await apiClient.post<{ success: boolean }>(`${BASE_URL}/${id}/risk/conflict`, data);
  return res.data;
};

const resolveConflict = async ({ id, data }: { id: string; data: ResolveConflictInput }) => {
  const res = await apiClient.post<{ success: boolean }>(`${BASE_URL}/${id}/risk/resolve`, data);
  return res.data;
};

// ============================================================================
// API FUNCTIONS (QUERIES - READ)
// ============================================================================

const searchGuardianships = async (
  params: SearchGuardianshipsParams
): Promise<PaginatedGuardianshipResponse> => {
  const res = await apiClient.get<PaginatedGuardianshipResponse>(BASE_URL, { params });
  return res.data;
};

const getGuardianshipDetails = async (id: string): Promise<GuardianshipDetailsResponse> => {
  const res = await apiClient.get<GuardianshipDetailsResponse>(`${BASE_URL}/${id}`);
  return res.data;
};

const getTimeline = async (id: string): Promise<ComplianceTimelineResponse> => {
  const res = await apiClient.get<ComplianceTimelineResponse>(`${BASE_URL}/${id}/timeline`);
  return res.data;
};

const getRiskReport = async (id: string): Promise<RiskAssessmentResponse> => {
  const res = await apiClient.get<RiskAssessmentResponse>(`${BASE_URL}/${id}/risk-assessment`);
  return res.data;
};

const previewDocument = async (
  id: string,
  docType: string,
  refId: string
): Promise<DocumentPreviewResponse> => {
  const res = await apiClient.get<DocumentPreviewResponse>(
    `${BASE_URL}/${id}/documents/${docType}/${refId}/preview`
  );
  return res.data;
};

// ============================================================================
// REACT QUERY HOOKS (MUTATIONS)
// ============================================================================

// --- Lifecycle Mutations ---
export const useCreateGuardianship = (options?: { onSuccess?: (data: { id: string }) => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createGuardianship,
    onSuccess: (data) => {
      toast.success('Guardianship Case Opened', {
        description: 'New case created successfully.',
      });
      queryClient.invalidateQueries({ queryKey: guardianshipKeys.lists() });
      options?.onSuccess?.(data);
    },
    onError: (err) => toast.error('Creation Failed', { description: extractErrorMessage(err) }),
  });
};

export const useActivateGuardianship = (id: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ActivateGuardianshipInput) => activateGuardianship({ id, data }),
    onSuccess: () => {
      toast.success('Guardianship Activated', { description: 'Case is now active.' });
      queryClient.invalidateQueries({ queryKey: guardianshipKeys.detail(id) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Activation Failed', { description: extractErrorMessage(err) }),
  });
};

export const useTerminateGuardianship = (id: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TerminateGuardianshipInput) => terminateGuardianship({ id, data }),
    onSuccess: () => {
      toast.success('Guardianship Terminated', { description: 'Case has been closed.' });
      queryClient.invalidateQueries({ queryKey: guardianshipKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: guardianshipKeys.lists() });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Termination Failed', { description: extractErrorMessage(err) }),
  });
};

// --- Guardian Operations Mutations ---
export const useAppointGuardian = (id: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AppointGuardianInput) => appointGuardian({ id, data }),
    onSuccess: () => {
      toast.success('Guardian Appointed', { description: 'Guardian added to the case.' });
      queryClient.invalidateQueries({ queryKey: guardianshipKeys.detail(id) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Appointment Failed', { description: extractErrorMessage(err) }),
  });
};

export const useUpdatePowers = (
  id: string,
  guardianId: string,
  options?: { onSuccess?: () => void }
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdatePowersInput) => updatePowers({ id, guardianId, data }),
    onSuccess: () => {
      toast.success('Powers Updated', { description: 'Guardian powers have been modified.' });
      queryClient.invalidateQueries({ queryKey: guardianshipKeys.detail(id) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Update Failed', { description: extractErrorMessage(err) }),
  });
};

export const usePostBond = (id: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ guardianId, data }: { guardianId: string; data: PostBondInput }) =>
      postBond({ id, guardianId, data }),
    onSuccess: () => {
      toast.success('Security Bond Posted', { description: 'Section 72 requirement met.' });
      queryClient.invalidateQueries({ queryKey: guardianshipKeys.detail(id) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Bond Failed', { description: extractErrorMessage(err) }),
  });
};

export const useSuspendGuardian = (
  id: string,
  guardianId: string,
  options?: { onSuccess?: () => void }
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SuspendGuardianInput) => suspendGuardian({ id, guardianId, data }),
    onSuccess: () => {
      toast.warning('Guardian Suspended', { description: 'Guardian has been suspended.' });
      queryClient.invalidateQueries({ queryKey: guardianshipKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: guardianshipKeys.risk(id) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Suspension Failed', { description: extractErrorMessage(err) }),
  });
};

// --- Compliance Mutations ---
export const useSubmitCompliance = (id: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ checkId, data }: { checkId: string; data: SubmitComplianceInput }) =>
      submitCompliance({ id, checkId, data }),
    onSuccess: () => {
      toast.success('Compliance Report Submitted', {
        description: 'Your report has been submitted.',
      });
      queryClient.invalidateQueries({ queryKey: guardianshipKeys.timeline(id) });
      queryClient.invalidateQueries({ queryKey: guardianshipKeys.detail(id) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Submission Failed', { description: extractErrorMessage(err) }),
  });
};

export const useReviewCompliance = (id: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ checkId, data }: { checkId: string; data: ReviewComplianceInput }) =>
      reviewCompliance({ id, checkId, data }),
    onSuccess: () => {
      toast.success('Review Recorded', { description: 'Compliance review completed.' });
      queryClient.invalidateQueries({ queryKey: guardianshipKeys.timeline(id) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Review Failed', { description: extractErrorMessage(err) }),
  });
};

export const useAutoGenerateSection = (id: string, options?: { onSuccess?: (content: string) => void }) => {
  return useMutation({
    mutationFn: ({ checkId, data }: { checkId: string; data: AutoGenerateSectionInput }) =>
      autoGenerateSection({ id, checkId, data }),
    onSuccess: (result) => {
      toast.success('Section Generated', { description: 'AI content generated successfully.' });
      options?.onSuccess?.(result.generatedContent);
    },
    onError: (err) => toast.error('Generation Failed', { description: extractErrorMessage(err) }),
  });
};

// --- Risk Mutations ---
export const useRecordConflict = (id: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RecordConflictInput) => recordConflict({ id, data }),
    onSuccess: () => {
      toast.warning('Conflict of Interest Recorded', { description: 'Risk score updated.' });
      queryClient.invalidateQueries({ queryKey: guardianshipKeys.risk(id) });
      queryClient.invalidateQueries({ queryKey: guardianshipKeys.detail(id) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Record Failed', { description: extractErrorMessage(err) }),
  });
};

export const useResolveConflict = (id: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ResolveConflictInput) => resolveConflict({ id, data }),
    onSuccess: () => {
      toast.success('Conflict Resolved', { description: 'Risk mitigation recorded.' });
      queryClient.invalidateQueries({ queryKey: guardianshipKeys.risk(id) });
      queryClient.invalidateQueries({ queryKey: guardianshipKeys.detail(id) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Resolution Failed', { description: extractErrorMessage(err) }),
  });
};

// ============================================================================
// REACT QUERY HOOKS (QUERIES)
// ============================================================================

export const useSearchGuardianships = (params: SearchGuardianshipsParams) => {
  return useQuery({
    queryKey: guardianshipKeys.list(JSON.stringify(params)),
    queryFn: () => searchGuardianships(params),
    staleTime: 1000 * 60 * 1, // 1 min
  });
};

export const useGuardianshipDetails = (id: string) => {
  return useQuery({
    queryKey: guardianshipKeys.detail(id),
    queryFn: () => getGuardianshipDetails(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 mins
  });
};

export const useGuardianshipTimeline = (id: string) => {
  return useQuery({
    queryKey: guardianshipKeys.timeline(id),
    queryFn: () => getTimeline(id),
    enabled: !!id,
  });
};

export const useGuardianshipRiskReport = (id: string) => {
  return useQuery({
    queryKey: guardianshipKeys.risk(id),
    queryFn: () => getRiskReport(id),
    enabled: !!id,
    refetchOnWindowFocus: false, // Risk reports are expensive/AI-generated
    staleTime: 1000 * 60 * 5, // 5 mins
  });
};

export const useDocumentPreview = (id: string, docType: string, refId: string) => {
  return useQuery({
    queryKey: [...guardianshipKeys.detail(id), 'document', docType, refId],
    queryFn: () => previewDocument(id, docType, refId),
    enabled: !!id && !!docType && !!refId,
    refetchOnWindowFocus: false,
  });
};

// ============================================================================
// EXPORTS
// ============================================================================

export type { SearchGuardianshipsParams, DocumentPreviewResponse };