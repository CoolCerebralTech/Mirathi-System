// api/assessment.api.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '@/lib/apiClient';
import { toast } from 'sonner';

import {
  type SuccessionAssessment,
  type QuickAssessment,
  type AssetSummary,
  type LegalRequirement,
  type ResolveRiskInput,
} from '@/types/assessment.types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = '/api/succession/assessments';

export const assessmentKeys = {
  all: ['assessment'] as const,
  detail: (estateId: string) => [...assessmentKeys.all, estateId] as const,
  quick: (estateId: string) => [...assessmentKeys.detail(estateId), 'quick'] as const,
  assets: (estateId: string) => [...assessmentKeys.detail(estateId), 'assets'] as const,
  requirements: (estateId: string) => [...assessmentKeys.detail(estateId), 'requirements'] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

const createOrUpdateAssessment = async (estateId: string): Promise<SuccessionAssessment> => {
  const res = await apiClient.post<SuccessionAssessment>(BASE_URL, { estateId });
  return res.data;
};

const getAssessment = async (estateId: string): Promise<SuccessionAssessment> => {
  const res = await apiClient.get<SuccessionAssessment>(`${BASE_URL}/${estateId}`);
  return res.data;
};

const getQuickAssessment = async (estateId: string): Promise<QuickAssessment> => {
  const res = await apiClient.get<QuickAssessment>(`${BASE_URL}/quick/${estateId}`);
  return res.data;
};

const getAssetSummary = async (estateId: string): Promise<AssetSummary> => {
  const res = await apiClient.get<AssetSummary>(`${BASE_URL}/${estateId}/asset-summary`);
  return res.data;
};

const getLegalRequirements = async (estateId: string): Promise<LegalRequirement[]> => {
  const res = await apiClient.get<LegalRequirement[]>(`${BASE_URL}/${estateId}/legal-requirements`);
  return res.data;
};

const resolveRisk = async (assessmentId: string, riskId: string, data: ResolveRiskInput) => {
  const res = await apiClient.put<{ message: string; risk: unknown }>(
    `${BASE_URL}/assessments/${assessmentId}/risks/${riskId}/resolve`,
    data
  );
  return res.data;
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

export const useAssessment = (estateId: string) => {
  return useQuery({
    queryKey: assessmentKeys.detail(estateId),
    queryFn: () => getAssessment(estateId),
    enabled: !!estateId,
  });
};

export const useQuickAssessment = (estateId: string) => {
  return useQuery({
    queryKey: assessmentKeys.quick(estateId),
    queryFn: () => getQuickAssessment(estateId),
    enabled: !!estateId,
  });
};

export const useAssetSummary = (estateId: string) => {
  return useQuery({
    queryKey: assessmentKeys.assets(estateId),
    queryFn: () => getAssetSummary(estateId),
    enabled: !!estateId,
  });
};

export const useLegalRequirements = (estateId: string) => {
  return useQuery({
    queryKey: assessmentKeys.requirements(estateId),
    queryFn: () => getLegalRequirements(estateId),
    enabled: !!estateId,
  });
};

export const useAssessSuccession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (estateId: string) => createOrUpdateAssessment(estateId),
    onSuccess: (data) => {
      toast.success('Assessment Updated');
      queryClient.setQueryData(assessmentKeys.detail(data.estateId), data);
      queryClient.invalidateQueries({ queryKey: assessmentKeys.quick(data.estateId) });
    },
    onError: (err) => toast.error('Assessment Failed', { description: extractErrorMessage(err) }),
  });
};

export const useResolveRisk = (estateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ assessmentId, riskId, data }: { assessmentId: string; riskId: string; data: ResolveRiskInput }) =>
      resolveRisk(assessmentId, riskId, data),
    onSuccess: () => {
      toast.success('Risk Resolved');
      queryClient.invalidateQueries({ queryKey: assessmentKeys.detail(estateId) });
      queryClient.invalidateQueries({ queryKey: assessmentKeys.quick(estateId) });
    },
    onError: (err) => toast.error('Risk Resolution Failed', { description: extractErrorMessage(err) }),
  });
};