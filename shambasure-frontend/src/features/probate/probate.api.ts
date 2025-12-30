// ============================================================================
// probate.api.ts - Probate Service API Layer
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { toast } from 'sonner';

import {
  type CreateApplicationInput,
  type AutoGenerateInput,
  type GenerateFormsInput,
  type SignFormInput,
  type SendConsentInput,
  type GrantConsentInput,
  type DeclineConsentInput,
  type PayFilingFeeInput,
  type SubmitFilingInput,
  type ProbateDashboardResponse,
  type FormBundleResponse,
  type ConsentMatrixResponse,
  type FilingReadinessResponse,
} from './probate.types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = '/probate-applications';

export const probateKeys = {
  all: ['probate'] as const,
  detail: (id: string) => [...probateKeys.all, id] as const,
  dashboard: (id: string) => [...probateKeys.detail(id), 'dashboard'] as const,
  forms: (id: string) => [...probateKeys.detail(id), 'forms'] as const,
  consents: (id: string) => [...probateKeys.detail(id), 'consents'] as const,
  readiness: (id: string) => [...probateKeys.detail(id), 'readiness'] as const,
};

// ============================================================================
// API FUNCTIONS (COMMANDS - WRITE)
// ============================================================================

const createApplication = async (data: CreateApplicationInput) => {
  const res = await apiClient.post<{ id: string }>(BASE_URL, data);
  return res.data;
};

const autoGenerateApplication = async (data: AutoGenerateInput) => {
  const res = await apiClient.post<{ id: string }>(`${BASE_URL}/auto-generate`, data);
  return res.data;
};

const generateForms = async ({ id, data }: { id: string; data: GenerateFormsInput }) => {
  const res = await apiClient.post(`${BASE_URL}/${id}/forms/generate`, data);
  return res.data;
};

const signForm = async ({ id, formId, data }: { id: string; formId: string; data: SignFormInput }) => {
  const res = await apiClient.post(`${BASE_URL}/${id}/forms/${formId}/sign`, data);
  return res.data;
};

const requestConsent = async ({ id, consentId, data }: { id: string; consentId: string; data: SendConsentInput }) => {
  const res = await apiClient.post(`${BASE_URL}/${id}/consents/${consentId}/request`, data);
  return res.data;
};

const grantConsent = async ({ id, consentId, data }: { id: string; consentId: string; data: GrantConsentInput }) => {
  const res = await apiClient.post(`${BASE_URL}/${id}/consents/${consentId}/grant`, data);
  return res.data;
};

const payFees = async ({ id, data }: { id: string; data: PayFilingFeeInput }) => {
  const res = await apiClient.post(`${BASE_URL}/${id}/fees/pay`, data);
  return res.data;
};

const submitFiling = async ({ id, data }: { id: string; data: SubmitFilingInput }) => {
  const res = await apiClient.post(`${BASE_URL}/${id}/filing/submit`, data);
  return res.data;
};

// ============================================================================
// API FUNCTIONS (QUERIES - READ)
// ============================================================================

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

export const useCreateApplication = (options?: { onSuccess?: (data: { id: string }) => void }) => {
  return useMutation({
    mutationFn: createApplication,
    onSuccess: (data) => {
      toast.success('Probate Application Created');
      options?.onSuccess?.(data);
    },
    onError: (err) => toast.error('Creation Failed', { description: extractErrorMessage(err) }),
  });
};

export const useAutoGenerateApplication = (options?: { onSuccess?: (data: { id: string }) => void }) => {
  return useMutation({
    mutationFn: autoGenerateApplication,
    onSuccess: (data) => {
      toast.success('Application Generated');
      options?.onSuccess?.(data);
    },
    onError: (err) => toast.error('Generation Failed', { description: extractErrorMessage(err) }),
  });
};

export const useGenerateForms = (id: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateFormsInput) => generateForms({ id, data }),
    onSuccess: () => {
      toast.success('Forms Generated Successfully');
      queryClient.invalidateQueries({ queryKey: probateKeys.forms(id) });
      queryClient.invalidateQueries({ queryKey: probateKeys.dashboard(id) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Form Generation Failed', { description: extractErrorMessage(err) }),
  });
};

export const useSignForm = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ formId, data }: { formId: string; data: SignFormInput }) => signForm({ id, formId, data }),
    onSuccess: () => {
      toast.success('Document Signed');
      queryClient.invalidateQueries({ queryKey: probateKeys.forms(id) });
    },
    onError: (err) => toast.error('Signature Failed', { description: extractErrorMessage(err) }),
  });
};

export const useRequestConsent = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ consentId, data }: { consentId: string; data: SendConsentInput }) => requestConsent({ id, consentId, data }),
    onSuccess: () => {
      toast.success('Consent Request Sent');
      queryClient.invalidateQueries({ queryKey: probateKeys.consents(id) });
    },
  });
};

export const useSubmitFiling = (id: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SubmitFilingInput) => submitFiling({ id, data }),
    onSuccess: () => {
      toast.success('Application Filed to Court!');
      queryClient.invalidateQueries({ queryKey: probateKeys.dashboard(id) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Filing Failed', { description: extractErrorMessage(err) }),
  });
};

// ============================================================================
// REACT QUERY HOOKS (QUERIES)
// ============================================================================

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