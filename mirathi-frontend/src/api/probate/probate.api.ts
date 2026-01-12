// ============================================================================
// probate.api.ts - Probate Service API Layer
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '@/lib/apiClient';
import { toast } from 'sonner';

import {
  type CreateApplicationInput,
  type AutoGenerateInput,
  type WithdrawApplicationInput,
  type GenerateFormsInput,
  type RegenerateFormsInput,
  type ReviewFormInput,
  type SignFormInput,
  type SendConsentInput,
  type GrantConsentInput,
  type DeclineConsentInput,
  type PayFilingFeeInput,
  type SubmitFilingInput,
  type RecordCourtResponseInput,
  type RecordGrantInput,
  type ProbateDashboardResponse,
  type ApplicationListResponse,
  type FormBundleResponse,
  type ConsentMatrixResponse,
  type FilingReadinessResponse,
} from '@/types/probate.types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = '/succession/probate';

export const probateKeys = {
  all: ['probate'] as const,
  lists: () => [...probateKeys.all, 'list'] as const,
  detail: (id: string) => [...probateKeys.all, id] as const,
  dashboard: (id: string) => [...probateKeys.detail(id), 'dashboard'] as const,
  forms: (id: string) => [...probateKeys.detail(id), 'forms'] as const,
  consents: (id: string) => [...probateKeys.detail(id), 'consents'] as const,
  readiness: (id: string) => [...probateKeys.detail(id), 'readiness'] as const,
};

// ============================================================================
// API FUNCTIONS (COMMANDS - WRITE)
// ============================================================================

// --- Lifecycle Commands ---
const createApplication = async (data: CreateApplicationInput) => {
  const res = await apiClient.post<{ id: string }>(BASE_URL, data);
  return res.data;
};

const autoGenerateApplication = async (data: AutoGenerateInput) => {
  const res = await apiClient.post<{ id: string }>(`${BASE_URL}/auto-generate`, data);
  return res.data;
};

const withdrawApplication = async (id: string, data: WithdrawApplicationInput) => {
  const res = await apiClient.delete<{ message: string }>(`${BASE_URL}/${id}`, { data });
  return res.data;
};

// --- Form Management Commands ---
const generateForms = async (id: string, data: GenerateFormsInput) => {
  const res = await apiClient.post<{ message: string }>(`${BASE_URL}/${id}/forms/generate`, data);
  return res.data;
};

const regenerateForms = async (id: string, data: RegenerateFormsInput) => {
  const res = await apiClient.post<{ message: string }>(`${BASE_URL}/${id}/forms/regenerate`, data);
  return res.data;
};

const reviewForm = async (id: string, formId: string, data: ReviewFormInput) => {
  const res = await apiClient.patch<{ message: string }>(`${BASE_URL}/${id}/forms/${formId}/review`, data);
  return res.data;
};

const signForm = async (id: string, formId: string, data: SignFormInput) => {
  const res = await apiClient.post<{ message: string }>(`${BASE_URL}/${id}/forms/${formId}/sign`, data);
  return res.data;
};

// --- Consent Management Commands ---
const requestConsent = async (id: string, consentId: string, data: SendConsentInput) => {
  const res = await apiClient.post<{ message: string }>(`${BASE_URL}/${id}/consents/${consentId}/request`, data);
  return res.data;
};

const grantConsent = async (id: string, consentId: string, data: GrantConsentInput) => {
  const res = await apiClient.post<{ message: string }>(`${BASE_URL}/${id}/consents/${consentId}/grant`, data);
  return res.data;
};

const declineConsent = async (id: string, consentId: string, data: DeclineConsentInput) => {
  const res = await apiClient.post<{ message: string }>(`${BASE_URL}/${id}/consents/${consentId}/decline`, data);
  return res.data;
};

// --- Filing & Court Interaction Commands ---
const payFees = async (id: string, data: PayFilingFeeInput) => {
  const res = await apiClient.post<{ message: string }>(`${BASE_URL}/${id}/fees/pay`, data);
  return res.data;
};

const submitFiling = async (id: string, data: SubmitFilingInput) => {
  const res = await apiClient.post<{ message: string }>(`${BASE_URL}/${id}/filing/submit`, data);
  return res.data;
};

const recordCourtResponse = async (id: string, data: RecordCourtResponseInput) => {
  const res = await apiClient.post<{ message: string }>(`${BASE_URL}/${id}/court-response`, data);
  return res.data;
};

const recordGrant = async (id: string, data: RecordGrantInput) => {
  const res = await apiClient.post<{ message: string }>(`${BASE_URL}/${id}/grant`, data);
  return res.data;
};

// ============================================================================
// API FUNCTIONS (QUERIES - READ)
// ============================================================================

// Get list of applications (if needed - not in controller but might be useful)
const getApplications = async (): Promise<ApplicationListResponse> => {
  const res = await apiClient.get<ApplicationListResponse>(BASE_URL);
  return res.data;
};

const getDashboard = async (id: string): Promise<ProbateDashboardResponse> => {
  const res = await apiClient.get<ProbateDashboardResponse>(`${BASE_URL}/${id}/dashboard`);
  return res.data;
};

const getForms = async (id: string): Promise<FormBundleResponse> => {
  const res = await apiClient.get<FormBundleResponse>(`${BASE_URL}/${id}/forms`);
  return res.data;
};

const getConsents = async (id: string): Promise<ConsentMatrixResponse> => {
  const res = await apiClient.get<ConsentMatrixResponse>(`${BASE_URL}/${id}/consents`);
  return res.data;
};

const getFilingReadiness = async (id: string): Promise<FilingReadinessResponse> => {
  const res = await apiClient.get<FilingReadinessResponse>(`${BASE_URL}/${id}/filing/readiness`);
  return res.data;
};

// ============================================================================
// REACT QUERY HOOKS (MUTATIONS)
// ============================================================================

// --- Lifecycle Mutations ---
export const useCreateApplication = (options?: { onSuccess?: (data: { id: string }) => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createApplication,
    onSuccess: (data) => {
      toast.success('Probate Application Created');
      queryClient.invalidateQueries({ queryKey: probateKeys.lists() });
      options?.onSuccess?.(data);
    },
    onError: (err) => toast.error('Creation Failed', { description: extractErrorMessage(err) }),
  });
};

export const useAutoGenerateApplication = (options?: { onSuccess?: (data: { id: string }) => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: autoGenerateApplication,
    onSuccess: (data) => {
      toast.success('Application Generated');
      queryClient.invalidateQueries({ queryKey: probateKeys.lists() });
      options?.onSuccess?.(data);
    },
    onError: (err) => toast.error('Generation Failed', { description: extractErrorMessage(err) }),
  });
};

export const useWithdrawApplication = (id: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: WithdrawApplicationInput) => withdrawApplication(id, data),
    onSuccess: () => {
      toast.success('Application Withdrawn');
      queryClient.invalidateQueries({ queryKey: probateKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: probateKeys.lists() });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Withdrawal Failed', { description: extractErrorMessage(err) }),
  });
};

// --- Form Management Mutations ---
export const useGenerateForms = (id: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateFormsInput) => generateForms(id, data),
    onSuccess: () => {
      toast.success('Forms Generated Successfully');
      queryClient.invalidateQueries({ queryKey: probateKeys.forms(id) });
      queryClient.invalidateQueries({ queryKey: probateKeys.dashboard(id) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Form Generation Failed', { description: extractErrorMessage(err) }),
  });
};

export const useRegenerateForms = (id: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RegenerateFormsInput) => regenerateForms(id, data),
    onSuccess: () => {
      toast.success('Forms Regenerated');
      queryClient.invalidateQueries({ queryKey: probateKeys.forms(id) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Form Regeneration Failed', { description: extractErrorMessage(err) }),
  });
};

export const useReviewForm = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ formId, data }: { formId: string; data: ReviewFormInput }) => reviewForm(id, formId, data),
    onSuccess: () => {
      toast.success('Form Review Submitted');
      queryClient.invalidateQueries({ queryKey: probateKeys.forms(id) });
    },
    onError: (err) => toast.error('Review Failed', { description: extractErrorMessage(err) }),
  });
};

export const useSignForm = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ formId, data }: { formId: string; data: SignFormInput }) => signForm(id, formId, data),
    onSuccess: () => {
      toast.success('Document Signed');
      queryClient.invalidateQueries({ queryKey: probateKeys.forms(id) });
      queryClient.invalidateQueries({ queryKey: probateKeys.dashboard(id) });
    },
    onError: (err) => toast.error('Signature Failed', { description: extractErrorMessage(err) }),
  });
};

// --- Consent Management Mutations ---
export const useRequestConsent = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ consentId, data }: { consentId: string; data: SendConsentInput }) => requestConsent(id, consentId, data),
    onSuccess: () => {
      toast.success('Consent Request Sent');
      queryClient.invalidateQueries({ queryKey: probateKeys.consents(id) });
      queryClient.invalidateQueries({ queryKey: probateKeys.dashboard(id) });
    },
    onError: (err) => toast.error('Request Failed', { description: extractErrorMessage(err) }),
  });
};

export const useGrantConsent = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ consentId, data }: { consentId: string; data: GrantConsentInput }) => grantConsent(id, consentId, data),
    onSuccess: () => {
      toast.success('Consent Recorded');
      queryClient.invalidateQueries({ queryKey: probateKeys.consents(id) });
      queryClient.invalidateQueries({ queryKey: probateKeys.dashboard(id) });
      queryClient.invalidateQueries({ queryKey: probateKeys.readiness(id) });
    },
    onError: (err) => toast.error('Consent Recording Failed', { description: extractErrorMessage(err) }),
  });
};

export const useDeclineConsent = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ consentId, data }: { consentId: string; data: DeclineConsentInput }) => declineConsent(id, consentId, data),
    onSuccess: () => {
      toast.warning('Consent Declined Recorded');
      queryClient.invalidateQueries({ queryKey: probateKeys.consents(id) });
      queryClient.invalidateQueries({ queryKey: probateKeys.dashboard(id) });
      queryClient.invalidateQueries({ queryKey: probateKeys.readiness(id) });
    },
    onError: (err) => toast.error('Recording Failed', { description: extractErrorMessage(err) }),
  });
};

// --- Filing & Court Interaction Mutations ---
export const usePayFees = (id: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PayFilingFeeInput) => payFees(id, data),
    onSuccess: () => {
      toast.success('Payment Recorded');
      queryClient.invalidateQueries({ queryKey: probateKeys.dashboard(id) });
      queryClient.invalidateQueries({ queryKey: probateKeys.readiness(id) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Payment Failed', { description: extractErrorMessage(err) }),
  });
};

export const useSubmitFiling = (id: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SubmitFilingInput) => submitFiling(id, data),
    onSuccess: () => {
      toast.success('Application Filed to Court!');
      queryClient.invalidateQueries({ queryKey: probateKeys.dashboard(id) });
      queryClient.invalidateQueries({ queryKey: probateKeys.readiness(id) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Filing Failed', { description: extractErrorMessage(err) }),
  });
};

export const useRecordCourtResponse = (id: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RecordCourtResponseInput) => recordCourtResponse(id, data),
    onSuccess: () => {
      toast.info('Court Response Recorded');
      queryClient.invalidateQueries({ queryKey: probateKeys.dashboard(id) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Recording Failed', { description: extractErrorMessage(err) }),
  });
};

export const useRecordGrant = (id: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RecordGrantInput) => recordGrant(id, data),
    onSuccess: () => {
      toast.success('Grant Recorded Successfully!');
      queryClient.invalidateQueries({ queryKey: probateKeys.dashboard(id) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Grant Recording Failed', { description: extractErrorMessage(err) }),
  });
};

// ============================================================================
// REACT QUERY HOOKS (QUERIES)
// ============================================================================

export const useProbateApplications = () => {
  return useQuery({
    queryKey: probateKeys.lists(),
    queryFn: getApplications,
    // Note: This endpoint might not exist yet, you may need to implement it
    // For now, returning empty or handle appropriately
    enabled: false, // Disable until endpoint is implemented
  });
};

export const useProbateDashboard = (id: string) => {
  return useQuery({
    queryKey: probateKeys.dashboard(id),
    queryFn: () => getDashboard(id),
    enabled: !!id,
  });
};

export const useProbateForms = (id: string) => {
  return useQuery({
    queryKey: probateKeys.forms(id),
    queryFn: () => getForms(id),
    enabled: !!id,
  });
};

export const useProbateConsents = (id: string) => {
  return useQuery({
    queryKey: probateKeys.consents(id),
    queryFn: () => getConsents(id),
    enabled: !!id,
  });
};

export const useFilingReadiness = (id: string) => {
  return useQuery({
    queryKey: probateKeys.readiness(id),
    queryFn: () => getFilingReadiness(id),
    enabled: !!id,
  });
};