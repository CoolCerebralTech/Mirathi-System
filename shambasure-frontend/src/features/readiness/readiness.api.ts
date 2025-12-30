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
  type SimulateScoreInput,
  type ReadinessDashboardResponse,
  type StrategyRoadmapResponse,
  type FilingChecklistResponse,
  type RiskDetailResponse,
  type SimulationResultResponse,
} from './readiness.types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = '/readiness';

export const readinessKeys = {
  all: ['readiness'] as const,
  dashboard: (id: string) => [...readinessKeys.all, id, 'dashboard'] as const,
  dashboardByEstate: (estateId: string) => [...readinessKeys.all, 'estate', estateId] as const,
  strategy: (id: string) => [...readinessKeys.all, id, 'strategy'] as const,
  checklist: (id: string) => [...readinessKeys.all, id, 'checklist'] as const,
  risks: (id: string) => [...readinessKeys.all, id, 'risks'] as const,
};

// ============================================================================
// API FUNCTIONS (COMMANDS)
// ============================================================================

const initializeAssessment = async (data: InitializeAssessmentInput) => {
  const res = await apiClient.post<{ id: string }>(BASE_URL, data);
  return res.data;
};

const updateContext = async ({ id, data }: { id: string; data: UpdateContextInput }) => {
  const res = await apiClient.put(`${BASE_URL}/${id}/context`, data);
  return res.data;
};

const resolveRisk = async ({ id, riskId, data }: { id: string; riskId: string; data: ResolveRiskInput }) => {
  const res = await apiClient.patch(`${BASE_URL}/${id}/risks/${riskId}/resolve`, data);
  return res.data;
};

const disputeRisk = async ({ id, riskId, data }: { id: string; riskId: string; data: DisputeRiskInput }) => {
  const res = await apiClient.patch(`${BASE_URL}/${id}/risks/${riskId}/dispute`, data);
  return res.data;
};

const recalculate = async (id: string) => {
  const res = await apiClient.post(`${BASE_URL}/${id}/recalculate`, { triggerReason: 'Manual Refresh' });
  return res.data;
};

const simulateScore = async ({ id, data }: { id: string; data: SimulateScoreInput }) => {
  const res = await apiClient.post<SimulationResultResponse>(`${BASE_URL}/${id}/simulate`, data);
  return res.data;
};

// ============================================================================
// API FUNCTIONS (QUERIES)
// ============================================================================

const getDashboardByEstate = async (estateId: string): Promise<ReadinessDashboardResponse> => {
  const res = await apiClient.get<ReadinessDashboardResponse>(`${BASE_URL}/dashboard`, { params: { estateId } });
  return res.data;
};

const getDashboardById = async (id: string): Promise<ReadinessDashboardResponse> => {
  const res = await apiClient.get<ReadinessDashboardResponse>(`${BASE_URL}/${id}/dashboard`);
  return res.data;
};

const getStrategy = async (id: string): Promise<StrategyRoadmapResponse> => {
  const res = await apiClient.get<StrategyRoadmapResponse>(`${BASE_URL}/${id}/strategy`);
  return res.data;
};

const getChecklist = async (id: string): Promise<FilingChecklistResponse> => {
  const res = await apiClient.get<FilingChecklistResponse>(`${BASE_URL}/${id}/checklist`);
  return res.data;
};

const getRisks = async (id: string, filters?: any): Promise<RiskDetailResponse[]> => {
  const res = await apiClient.get<RiskDetailResponse[]>(`${BASE_URL}/${id}/risks`, { params: filters });
  return res.data;
};

// ============================================================================
// REACT QUERY HOOKS (MUTATIONS)
// ============================================================================

export const useInitializeReadiness = (options?: { onSuccess?: (data: { id: string }) => void }) => {
  return useMutation({
    mutationFn: initializeAssessment,
    onSuccess: (data) => options?.onSuccess?.(data),
    onError: (err) => toast.error('Initialization Failed', { description: extractErrorMessage(err) }),
  });
};

export const useResolveRisk = (assessmentId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ riskId, data }: { riskId: string; data: ResolveRiskInput }) => 
      resolveRisk({ id: assessmentId, riskId, data }),
    onSuccess: () => {
      toast.success('Risk Resolved');
      queryClient.invalidateQueries({ queryKey: readinessKeys.dashboard(assessmentId) });
      queryClient.invalidateQueries({ queryKey: readinessKeys.risks(assessmentId) });
    },
  });
};

export const useRecalculateReadiness = (assessmentId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => recalculate(assessmentId),
    onSuccess: () => {
      toast.success('Readiness Score Updated');
      queryClient.invalidateQueries({ queryKey: readinessKeys.dashboard(assessmentId) });
    },
  });
};

export const useSimulateScore = (assessmentId: string) => {
  return useMutation({
    mutationFn: (data: SimulateScoreInput) => simulateScore({ id: assessmentId, data }),
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

export const useReadinessRisks = (assessmentId: string, filters?: any) => {
  return useQuery({
    queryKey: [...readinessKeys.risks(assessmentId), filters],
    queryFn: () => getRisks(assessmentId, filters),
    enabled: !!assessmentId,
  });
};