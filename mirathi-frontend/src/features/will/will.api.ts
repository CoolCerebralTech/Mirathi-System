// ============================================================================
// will.api.ts - Will Service API Layer
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient, extractErrorMessage } from '../../api/client';
import type {
  AddBeneficiaryInput,
  AddCodicilInput,
  AddWitnessInput,
  AppointExecutorInput,
  ComplianceReportResponse,
  CreateDraftWillInput,
  ExecuteWillInput,
  ExecutorAssignmentResponse,
  PaginatedWillResponse,
  RecordDisinheritanceInput,
  RecordWitnessSignatureInput,
  RevokeWillInput,
  UpdateCapacityInput,
  WillDetailResponse,
  WillSearchFilterInput,
  WillSummaryResponse,
} from '../../types/will.types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = '/will/wills';

export const willKeys = {
  all: ['wills'] as const,
  active: () => [...willKeys.all, 'active'] as const,
  history: () => [...willKeys.all, 'history'] as const,
  search: (filters?: WillSearchFilterInput) => [...willKeys.all, 'search', filters] as const,
  detail: (id: string) => [...willKeys.all, id] as const,
  compliance: (id: string) => [...willKeys.detail(id), 'compliance'] as const,
  executorAssignments: () => [...willKeys.all, 'executor-assignments'] as const,
};

// ============================================================================
// 1. LIFECYCLE: DRAFTING
// ============================================================================

const createDraft = async (data: CreateDraftWillInput) => {
  const res = await apiClient.post<string>(`${BASE_URL}/draft`, data);
  return res.data;
};

const appointExecutor = async ({
  willId,
  data,
}: {
  willId: string;
  data: AppointExecutorInput;
}) => {
  const res = await apiClient.post(`${BASE_URL}/${willId}/executors`, data);
  return res.data;
};

const addBeneficiary = async ({
  willId,
  data,
}: {
  willId: string;
  data: AddBeneficiaryInput;
}) => {
  const res = await apiClient.post(`${BASE_URL}/${willId}/beneficiaries`, data);
  return res.data;
};

const recordDisinheritance = async ({
  willId,
  data,
}: {
  willId: string;
  data: RecordDisinheritanceInput;
}) => {
  const res = await apiClient.post(`${BASE_URL}/${willId}/disinheritance`, data);
  return res.data;
};

// ============================================================================
// 2. RISK MANAGEMENT
// ============================================================================

const updateCapacity = async ({
  willId,
  data,
}: {
  willId: string;
  data: UpdateCapacityInput;
}) => {
  const res = await apiClient.put(`${BASE_URL}/${willId}/capacity`, data);
  return res.data;
};

// ============================================================================
// 3. LIFECYCLE: EXECUTION
// ============================================================================

const addWitness = async ({ willId, data }: { willId: string; data: AddWitnessInput }) => {
  const res = await apiClient.post(`${BASE_URL}/${willId}/witnesses`, data);
  return res.data;
};

const executeWill = async ({ willId, data }: { willId: string; data: ExecuteWillInput }) => {
  const res = await apiClient.post(`${BASE_URL}/${willId}/execute`, data);
  return res.data;
};

const recordWitnessSignature = async ({
  willId,
  data,
}: {
  willId: string;
  data: RecordWitnessSignatureInput;
}) => {
  const res = await apiClient.post(`${BASE_URL}/${willId}/witnesses/sign`, data);
  return res.data;
};

// ============================================================================
// 4. LIFECYCLE: POST-EXECUTION
// ============================================================================

const addCodicil = async ({ willId, data }: { willId: string; data: AddCodicilInput }) => {
  const res = await apiClient.post(`${BASE_URL}/${willId}/codicils`, data);
  return res.data;
};

const revokeWill = async ({ willId, data }: { willId: string; data: RevokeWillInput }) => {
  const res = await apiClient.post(`${BASE_URL}/${willId}/revoke`, data);
  return res.data;
};

// ============================================================================
// 5. QUERIES
// ============================================================================

const getActiveWill = async (): Promise<WillDetailResponse | null> => {
  const res = await apiClient.get<WillDetailResponse | null>(`${BASE_URL}/active`);
  return res.data;
};

const getWillHistory = async (): Promise<WillSummaryResponse[]> => {
  const res = await apiClient.get<WillSummaryResponse[]>(`${BASE_URL}/history`);
  return res.data;
};

const searchWills = async (filters?: WillSearchFilterInput): Promise<PaginatedWillResponse> => {
  const res = await apiClient.get<PaginatedWillResponse>(`${BASE_URL}/search`, {
    params: filters,
  });
  return res.data;
};

const getExecutorAssignments = async (
  status?: string[],
): Promise<ExecutorAssignmentResponse[]> => {
  const res = await apiClient.get<ExecutorAssignmentResponse[]>(
    `${BASE_URL}/executor-assignments`,
    {
      params: { status },
    },
  );
  return res.data;
};

const getWillById = async (
  id: string,
  includeDetails: boolean = true,
): Promise<WillDetailResponse> => {
  const res = await apiClient.get<WillDetailResponse>(`${BASE_URL}/${id}`, {
    params: { includeDetails },
  });
  return res.data;
};

const getComplianceReport = async (
  id: string,
  scope: 'INTERNAL' | 'FULL' = 'INTERNAL',
): Promise<ComplianceReportResponse> => {
  const res = await apiClient.get<ComplianceReportResponse>(`${BASE_URL}/${id}/compliance`, {
    params: { scope },
  });
  return res.data;
};

// ============================================================================
// REACT QUERY HOOKS - MUTATIONS
// ============================================================================

// --- 1. Drafting Phase ---
export const useCreateDraftWill = (options?: { onSuccess?: (willId: string) => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDraft,
    onSuccess: (willId) => {
      toast.success('Draft Will Created', { description: 'You can now start adding beneficiaries' });
      queryClient.invalidateQueries({ queryKey: willKeys.active() });
      queryClient.invalidateQueries({ queryKey: willKeys.history() });
      options?.onSuccess?.(willId);
    },
    onError: (err) =>
      toast.error('Failed to create draft', { description: extractErrorMessage(err) }),
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
    onError: (err) =>
      toast.error('Failed to appoint executor', { description: extractErrorMessage(err) }),
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
    onError: (err) =>
      toast.error('Failed to add beneficiary', { description: extractErrorMessage(err) }),
  });
};

export const useRecordDisinheritance = (willId: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RecordDisinheritanceInput) => recordDisinheritance({ willId, data }),
    onSuccess: () => {
      toast.warning('Disinheritance Recorded', {
        description: 'S.26 compliance documentation added',
      });
      queryClient.invalidateQueries({ queryKey: willKeys.detail(willId) });
      queryClient.invalidateQueries({ queryKey: willKeys.compliance(willId) });
      options?.onSuccess?.();
    },
    onError: (err) =>
      toast.error('Failed to record disinheritance', { description: extractErrorMessage(err) }),
  });
};

// --- 2. Risk Management ---
export const useUpdateCapacity = (willId: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateCapacityInput) => updateCapacity({ willId, data }),
    onSuccess: () => {
      toast.info('Capacity Declaration Updated');
      queryClient.invalidateQueries({ queryKey: willKeys.detail(willId) });
      queryClient.invalidateQueries({ queryKey: willKeys.compliance(willId) });
      options?.onSuccess?.();
    },
    onError: (err) =>
      toast.error('Failed to update capacity', { description: extractErrorMessage(err) }),
  });
};

// --- 3. Execution Phase ---
export const useAddWitness = (willId: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddWitnessInput) => addWitness({ willId, data }),
    onSuccess: () => {
      toast.success('Witness Nominated');
      queryClient.invalidateQueries({ queryKey: willKeys.detail(willId) });
      queryClient.invalidateQueries({ queryKey: willKeys.compliance(willId) });
      options?.onSuccess?.();
    },
    onError: (err) =>
      toast.error('Failed to add witness', { description: extractErrorMessage(err) }),
  });
};

export const useExecuteWill = (willId: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ExecuteWillInput) => executeWill({ willId, data }),
    onSuccess: () => {
      toast.success('Will Executed Successfully', {
        description: 'Your will is now legally binding under S.11 LSA',
      });
      queryClient.invalidateQueries({ queryKey: willKeys.all });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Execution Failed', { description: extractErrorMessage(err) }),
  });
};

export const useRecordWitnessSignature = (
  willId: string,
  options?: { onSuccess?: () => void },
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RecordWitnessSignatureInput) => recordWitnessSignature({ willId, data }),
    onSuccess: () => {
      toast.success('Witness Signature Recorded');
      queryClient.invalidateQueries({ queryKey: willKeys.detail(willId) });
      options?.onSuccess?.();
    },
    onError: (err) =>
      toast.error('Failed to record signature', { description: extractErrorMessage(err) }),
  });
};

// --- 4. Post-Execution ---
export const useAddCodicil = (willId: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddCodicilInput) => addCodicil({ willId, data }),
    onSuccess: () => {
      toast.success('Codicil Added', { description: 'Will amendment recorded' });
      queryClient.invalidateQueries({ queryKey: willKeys.detail(willId) });
      queryClient.invalidateQueries({ queryKey: willKeys.compliance(willId) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Failed to add codicil', { description: extractErrorMessage(err) }),
  });
};

export const useRevokeWill = (willId: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RevokeWillInput) => revokeWill({ willId, data }),
    onSuccess: () => {
      toast.warning('Will Revoked', { description: 'This will is no longer valid' });
      queryClient.invalidateQueries({ queryKey: willKeys.all });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Failed to revoke will', { description: extractErrorMessage(err) }),
  });
};

// ============================================================================
// REACT QUERY HOOKS - QUERIES
// ============================================================================

export const useActiveWill = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: willKeys.active(),
    queryFn: getActiveWill,
    retry: false, // Don't retry if 404 (no active will)
    enabled: options?.enabled !== false,
  });
};

export const useWillHistory = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: willKeys.history(),
    queryFn: getWillHistory,
    enabled: options?.enabled !== false,
  });
};

export const useSearchWills = (
  filters?: WillSearchFilterInput,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: willKeys.search(filters),
    queryFn: () => searchWills(filters),
    enabled: options?.enabled !== false,
    staleTime: 30000, // 30 seconds
  });
};

export const useExecutorAssignments = (
  status?: string[],
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: [...willKeys.executorAssignments(), status],
    queryFn: () => getExecutorAssignments(status),
    enabled: options?.enabled !== false,
  });
};

export const useWillDetail = (
  id: string,
  includeDetails: boolean = true,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: willKeys.detail(id),
    queryFn: () => getWillById(id, includeDetails),
    enabled: options?.enabled !== false && !!id,
  });
};

export const useWillCompliance = (
  id: string,
  scope: 'INTERNAL' | 'FULL' = 'INTERNAL',
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: willKeys.compliance(id),
    queryFn: () => getComplianceReport(id, scope),
    enabled: options?.enabled !== false && !!id,
    staleTime: 60000, // 1 minute - compliance doesn't change frequently
  });
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Prefetch will details for faster navigation
 */
export const usePrefetchWillDetail = () => {
  const queryClient = useQueryClient();

  return (willId: string) => {
    queryClient.prefetchQuery({
      queryKey: willKeys.detail(willId),
      queryFn: () => getWillById(willId),
    });
  };
};

/**
 * Invalidate all will-related queries
 */
export const useInvalidateWills = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: willKeys.all });
  };
};

/**
 * Get cached active will without refetching
 */
export const useActiveWillCache = () => {
  const queryClient = useQueryClient();
  return queryClient.getQueryData<WillDetailResponse | null>(willKeys.active());
};

/**
 * Get cached will detail without refetching
 */
export const useWillDetailCache = (willId: string) => {
  const queryClient = useQueryClient();
  return queryClient.getQueryData<WillDetailResponse>(willKeys.detail(willId));
};