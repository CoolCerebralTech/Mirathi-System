// ============================================================================
// readiness.api.ts - Readiness Service API Layer
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { toast } from 'sonner';

import {
  type InitializeAssessmentInput,
  type UpdateContextInput,
  type ResolveRiskInput,
  type DisputeRiskInput,
  type UpdateMitigationInput,
  type AcknowledgeWarningInput,
  type OverrideStrategyInput,
  type ForceRecalculationInput,
  type SimulateScoreInput,
  type CompleteAssessmentInput,
  type ReadinessDashboardResponse,
  type StrategyRoadmapResponse,
  type FilingChecklistResponse,
  type RiskDetailResponse,
  type SimulationResultResponse,
  type RiskCategory,
  type RiskSeverity,
  type RiskStatus,
} from '../../types/readiness.types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = '/succession/readiness';

export const readinessKeys = {
  all: ['readiness'] as const,
  dashboard: (id: string) => [...readinessKeys.all, id, 'dashboard'] as const,
  dashboardByEstate: (estateId: string) => [...readinessKeys.all, 'estate', estateId] as const,
  strategy: (id: string) => [...readinessKeys.all, id, 'strategy'] as const,
  checklist: (id: string) => [...readinessKeys.all, id, 'checklist'] as const,
  risks: (id: string) => [...readinessKeys.all, id, 'risks'] as const,
  simulation: (id: string) => [...readinessKeys.all, id, 'simulation'] as const,
};

// ============================================================================
// API FUNCTIONS (COMMANDS - WRITE)
// ============================================================================

// --- Lifecycle Commands ---
const initializeAssessment = async (data: InitializeAssessmentInput) => {
  const res = await apiClient.post<{ id: string }>(BASE_URL, data);
  return res.data;
};

const recalculateAssessment = async (id: string, data: ForceRecalculationInput) => {
  const res = await apiClient.post<{ message: string }>(`${BASE_URL}/${id}/recalculate`, data);
  return res.data;
};

const completeAssessment = async (id: string, data: CompleteAssessmentInput) => {
  const res = await apiClient.patch<{ message: string }>(`${BASE_URL}/${id}/complete`, data);
  return res.data;
};

// --- Risk Management Commands ---
const resolveRisk = async (id: string, riskId: string, data: ResolveRiskInput) => {
  const res = await apiClient.patch<{ message: string }>(`${BASE_URL}/${id}/risks/${riskId}/resolve`, data);
  return res.data;
};

const disputeRisk = async (id: string, riskId: string, data: DisputeRiskInput) => {
  const res = await apiClient.patch<{ message: string }>(`${BASE_URL}/${id}/risks/${riskId}/dispute`, data);
  return res.data;
};

const acknowledgeWarning = async (id: string, riskId: string, data: AcknowledgeWarningInput) => {
  const res = await apiClient.patch<{ message: string }>(`${BASE_URL}/${id}/risks/${riskId}/acknowledge`, data);
  return res.data;
};

const updateMitigation = async (id: string, riskId: string, data: UpdateMitigationInput) => {
  const res = await apiClient.post<{ message: string }>(`${BASE_URL}/${id}/risks/${riskId}/mitigation`, data);
  return res.data;
};

// --- Context & Strategy Commands ---
const updateContext = async (id: string, data: UpdateContextInput) => {
  const res = await apiClient.put<{ message: string }>(`${BASE_URL}/${id}/context`, data);
  return res.data;
};

const overrideStrategy = async (id: string, data: OverrideStrategyInput) => {
  const res = await apiClient.put<{ message: string }>(`${BASE_URL}/${id}/strategy`, data);
  return res.data;
};

// ============================================================================
// API FUNCTIONS (QUERIES - READ)
// ============================================================================

// Get dashboard by estate ID (via query parameter)
const getDashboardByEstate = async (estateId: string): Promise<ReadinessDashboardResponse> => {
  const res = await apiClient.get<ReadinessDashboardResponse>(`${BASE_URL}/dashboard`, {
    params: { estateId },
  });
  return res.data;
};

// Get dashboard by assessment ID
const getDashboardById = async (id: string): Promise<ReadinessDashboardResponse> => {
  const res = await apiClient.get<ReadinessDashboardResponse>(`${BASE_URL}/${id}/dashboard`);
  return res.data;
};

// Get strategy roadmap
const getStrategy = async (id: string): Promise<StrategyRoadmapResponse> => {
  const res = await apiClient.get<StrategyRoadmapResponse>(`${BASE_URL}/${id}/strategy`);
  return res.data;
};

// Get document checklist
const getChecklist = async (id: string): Promise<FilingChecklistResponse> => {
  const res = await apiClient.get<FilingChecklistResponse>(`${BASE_URL}/${id}/checklist`);
  return res.data;
};

// Get filtered risks with query parameters
const getRisks = async (
  id: string,
  filters?: {
    severity?: RiskSeverity;
    category?: RiskCategory;
    status?: RiskStatus;
    isBlocking?: boolean;
    includeResolved?: boolean;
  },
): Promise<RiskDetailResponse[]> => {
  const res = await apiClient.get<RiskDetailResponse[]>(`${BASE_URL}/${id}/risks`, {
    params: filters,
  });
  return res.data;
};

// Simulate score improvement
const simulateScore = async (id: string, data: SimulateScoreInput): Promise<SimulationResultResponse> => {
  const res = await apiClient.post<SimulationResultResponse>(`${BASE_URL}/${id}/simulate`, data);
  return res.data;
};

// ============================================================================
// REACT QUERY HOOKS (MUTATIONS)
// ============================================================================

// --- Lifecycle Mutations ---
export const useInitializeReadiness = (options?: { onSuccess?: (data: { id: string }) => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: initializeAssessment,
    onSuccess: (data) => {
      toast.success('Readiness Assessment Initialized');
      // Note: We can't invalidate a specific dashboard yet since we don't have the ID
      // But we can invalidate all readiness queries
      queryClient.invalidateQueries({ queryKey: readinessKeys.all });
      options?.onSuccess?.(data);
    },
    onError: (err) => toast.error('Initialization Failed', { description: extractErrorMessage(err) }),
  });
};

export const useRecalculateReadiness = (id: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ForceRecalculationInput) => recalculateAssessment(id, data),
    onSuccess: () => {
      toast.success('Readiness Score Recalculated');
      queryClient.invalidateQueries({ queryKey: readinessKeys.dashboard(id) });
      queryClient.invalidateQueries({ queryKey: readinessKeys.risks(id) });
      queryClient.invalidateQueries({ queryKey: readinessKeys.strategy(id) });
      queryClient.invalidateQueries({ queryKey: readinessKeys.checklist(id) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Recalculation Failed', { description: extractErrorMessage(err) }),
  });
};

export const useCompleteAssessment = (id: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CompleteAssessmentInput) => completeAssessment(id, data),
    onSuccess: () => {
      toast.success('Assessment Marked as Ready to File');
      queryClient.invalidateQueries({ queryKey: readinessKeys.dashboard(id) });
      queryClient.invalidateQueries({ queryKey: readinessKeys.strategy(id) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Completion Failed', { description: extractErrorMessage(err) }),
  });
};

// --- Risk Management Mutations ---
export const useResolveRisk = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ riskId, data }: { riskId: string; data: ResolveRiskInput }) =>
      resolveRisk(id, riskId, data),
    onSuccess: () => {
      toast.success('Risk Resolved');
      queryClient.invalidateQueries({ queryKey: readinessKeys.dashboard(id) });
      queryClient.invalidateQueries({ queryKey: readinessKeys.risks(id) });
      queryClient.invalidateQueries({ queryKey: readinessKeys.checklist(id) });
    },
    onError: (err) => toast.error('Risk Resolution Failed', { description: extractErrorMessage(err) }),
  });
};

export const useDisputeRisk = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ riskId, data }: { riskId: string; data: DisputeRiskInput }) =>
      disputeRisk(id, riskId, data),
    onSuccess: () => {
      toast.info('Risk Disputed');
      queryClient.invalidateQueries({ queryKey: readinessKeys.dashboard(id) });
      queryClient.invalidateQueries({ queryKey: readinessKeys.risks(id) });
    },
    onError: (err) => toast.error('Dispute Failed', { description: extractErrorMessage(err) }),
  });
};

export const useAcknowledgeWarning = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ riskId, data }: { riskId: string; data: AcknowledgeWarningInput }) =>
      acknowledgeWarning(id, riskId, data),
    onSuccess: () => {
      toast.info('Warning Acknowledged');
      queryClient.invalidateQueries({ queryKey: readinessKeys.dashboard(id) });
      queryClient.invalidateQueries({ queryKey: readinessKeys.risks(id) });
    },
    onError: (err) => toast.error('Acknowledgement Failed', { description: extractErrorMessage(err) }),
  });
};

export const useUpdateMitigation = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ riskId, data }: { riskId: string; data: UpdateMitigationInput }) =>
      updateMitigation(id, riskId, data),
    onSuccess: () => {
      toast.info('Mitigation Updated');
      queryClient.invalidateQueries({ queryKey: readinessKeys.dashboard(id) });
      queryClient.invalidateQueries({ queryKey: readinessKeys.risks(id) });
    },
    onError: (err) => toast.error('Update Failed', { description: extractErrorMessage(err) }),
  });
};

// --- Context & Strategy Mutations ---
export const useUpdateContext = (id: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateContextInput) => updateContext(id, data),
    onSuccess: () => {
      toast.success('Context Updated');
      queryClient.invalidateQueries({ queryKey: readinessKeys.dashboard(id) });
      queryClient.invalidateQueries({ queryKey: readinessKeys.strategy(id) });
      queryClient.invalidateQueries({ queryKey: readinessKeys.checklist(id) });
      queryClient.invalidateQueries({ queryKey: readinessKeys.risks(id) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Context Update Failed', { description: extractErrorMessage(err) }),
  });
};

export const useOverrideStrategy = (id: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OverrideStrategyInput) => overrideStrategy(id, data),
    onSuccess: () => {
      toast.info('Strategy Overridden');
      queryClient.invalidateQueries({ queryKey: readinessKeys.strategy(id) });
      queryClient.invalidateQueries({ queryKey: readinessKeys.dashboard(id) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Strategy Override Failed', { description: extractErrorMessage(err) }),
  });
};

export const useSimulateScore = (id: string, options?: { onSuccess?: (data: SimulationResultResponse) => void }) => {
  return useMutation({
    mutationFn: (data: SimulateScoreInput) => simulateScore(id, data),
    onSuccess: (data) => {
      options?.onSuccess?.(data);
    },
    onError: (err) => toast.error('Simulation Failed', { description: extractErrorMessage(err) }),
  });
};

// ============================================================================
// REACT QUERY HOOKS (QUERIES)
// ============================================================================

export const useReadinessByEstate = (estateId: string) => {
  return useQuery({
    queryKey: readinessKeys.dashboardByEstate(estateId),
    queryFn: () => getDashboardByEstate(estateId),
    enabled: !!estateId,
    retry: false,
  });
};

export const useReadinessDashboard = (assessmentId: string) => {
  return useQuery({
    queryKey: readinessKeys.dashboard(assessmentId),
    queryFn: () => getDashboardById(assessmentId),
    enabled: !!assessmentId,
  });
};

export const useReadinessStrategy = (assessmentId: string) => {
  return useQuery({
    queryKey: readinessKeys.strategy(assessmentId),
    queryFn: () => getStrategy(assessmentId),
    enabled: !!assessmentId,
  });
};

export const useReadinessChecklist = (assessmentId: string) => {
  return useQuery({
    queryKey: readinessKeys.checklist(assessmentId),
    queryFn: () => getChecklist(assessmentId),
    enabled: !!assessmentId,
  });
};

export const useReadinessRisks = (
  assessmentId: string,
  filters?: {
    severity?: RiskSeverity;
    category?: RiskCategory;
    status?: RiskStatus;
    isBlocking?: boolean;
    includeResolved?: boolean;
  },
) => {
  return useQuery({
    queryKey: [...readinessKeys.risks(assessmentId), filters],
    queryFn: () => getRisks(assessmentId, filters),
    enabled: !!assessmentId,
  });
};