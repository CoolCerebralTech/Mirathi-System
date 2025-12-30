// ============================================================================
// will.api.ts - Will Service API Layer
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { toast } from 'sonner';

import {
  type CreateDraftWillInput,
  type AddBeneficiaryInput,
  type AppointExecutorInput,
  type AddWitnessInput,
  type ExecuteWillInput,
  type WillDetailResponse,
  type WillSummaryResponse,
  type ComplianceReportResponse,
} from './will.types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = '/wills';

export const willKeys = {
  all: ['wills'] as const,
  active: () => [...willKeys.all, 'active'] as const,
  history: () => [...willKeys.all, 'history'] as const,
  detail: (id: string) => [...willKeys.all, id] as const,
  compliance: (id: string) => [...willKeys.detail(id), 'compliance'] as const,
};

// ============================================================================
// API FUNCTIONS (COMMANDS)
// ============================================================================

const createDraft = async (data: CreateDraftWillInput) => {
  const res = await apiClient.post<{ id: string }>(`${BASE_URL}/draft`, data);
  return res.data;
};

const addBeneficiary = async ({ willId, data }: { willId: string; data: AddBeneficiaryInput }) => {
  const res = await apiClient.post(`${BASE_URL}/${willId}/beneficiaries`, data);
  return res.data;
};

const appointExecutor = async ({ willId, data }: { willId: string; data: AppointExecutorInput }) => {
  const res = await apiClient.post(`${BASE_URL}/${willId}/executors`, data);
  return res.data;
};

const addWitness = async ({ willId, data }: { willId: string; data: AddWitnessInput }) => {
  const res = await apiClient.post(`${BASE_URL}/${willId}/witnesses`, data);
  return res.data;
};

const executeWill = async ({ willId, data }: { willId: string; data: ExecuteWillInput }) => {
  const res = await apiClient.post(`${BASE_URL}/${willId}/execute`, data);
  return res.data;
};

// ============================================================================
// API FUNCTIONS (QUERIES)
// ============================================================================

const getActiveWill = async (): Promise<WillDetailResponse | null> => {
  const res = await apiClient.get<WillDetailResponse>(`${BASE_URL}/active`);
  return res.data;
};

const getWillHistory = async (): Promise<WillSummaryResponse[]> => {
  const res = await apiClient.get<WillSummaryResponse[]>(`${BASE_URL}/history`);
  return res.data;
};

const getWillById = async (id: string): Promise<WillDetailResponse> => {
  const res = await apiClient.get<WillDetailResponse>(`${BASE_URL}/${id}`);
  return res.data;
};

const getComplianceReport = async (id: string): Promise<ComplianceReportResponse> => {
  const res = await apiClient.get<ComplianceReportResponse>(`${BASE_URL}/${id}/compliance`);
  return res.data;
};

// ============================================================================
// REACT QUERY HOOKS (MUTATIONS)
// ============================================================================

export const useCreateDraftWill = (options?: { onSuccess?: (data: { id: string }) => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDraft,
    onSuccess: (data) => {
      toast.success('Draft Will Started');
      queryClient.invalidateQueries({ queryKey: willKeys.active() });
      options?.onSuccess?.(data);
    },
    onError: (err) => toast.error('Failed to create draft', { description: extractErrorMessage(err) }),
  });
};

export const useAddBeneficiary = (willId: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddBeneficiaryInput) => addBeneficiary({ willId, data }),
    onSuccess: () => {
      toast.success('Beneficiary Added');
      queryClient.invalidateQueries({ queryKey: willKeys.detail(willId) });
      queryClient.invalidateQueries({ queryKey: willKeys.compliance(willId) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Failed to add beneficiary', { description: extractErrorMessage(err) }),
  });
};

export const useAppointExecutor = (willId: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AppointExecutorInput) => appointExecutor({ willId, data }),
    onSuccess: () => {
      toast.success('Executor Appointed');
      queryClient.invalidateQueries({ queryKey: willKeys.detail(willId) });
      queryClient.invalidateQueries({ queryKey: willKeys.compliance(willId) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Failed to appoint executor', { description: extractErrorMessage(err) }),
  });
};

export const useExecuteWill = (willId: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ExecuteWillInput) => executeWill({ willId, data }),
    onSuccess: () => {
      toast.success('Will Executed Successfully', { description: 'Your digital will is now legally binding.' });
      queryClient.invalidateQueries({ queryKey: willKeys.all }); // Refresh everything
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Execution Failed', { description: extractErrorMessage(err) }),
  });
};

// ============================================================================
// REACT QUERY HOOKS (QUERIES)
// ============================================================================

export const useActiveWill = () => {
  return useQuery({
    queryKey: willKeys.active(),
    queryFn: getActiveWill,
    retry: false, // Don't retry if 404 (no active will)
  });
};

export const useWillDetail = (id: string) => {
  return useQuery({
    queryKey: willKeys.detail(id),
    queryFn: () => getWillById(id),
    enabled: !!id,
  });
};

export const useWillCompliance = (id: string) => {
  return useQuery({
    queryKey: willKeys.compliance(id),
    queryFn: () => getComplianceReport(id),
    enabled: !!id,
  });
};