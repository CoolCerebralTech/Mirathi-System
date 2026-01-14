// api/roadmap.api.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '@/lib/apiClient';
import { toast } from 'sonner';

import {
  type ExecutorRoadmap,
  type RoadmapPhaseOverview,
  type RecommendedTasksResponse,
  type TaskCompletionResult,
  type StartTaskInput,
  type CompleteTaskInput,
  type SkipTaskInput,
  type RoadmapPhase,
} from '@/types/roadmap.types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = '/api/succession/roadmaps';

export const roadmapKeys = {
  all: ['roadmap'] as const,
  detail: (estateId: string) => [...roadmapKeys.all, estateId] as const,
  phase: (estateId: string, phase: string) => [...roadmapKeys.detail(estateId), 'phase', phase] as const,
  recommended: (estateId: string) => [...roadmapKeys.detail(estateId), 'recommended'] as const,
};

// ============================================================================
// API FUNCTIONS (QUERIES)
// ============================================================================

const getRoadmap = async (estateId: string): Promise<ExecutorRoadmap> => {
  const res = await apiClient.get<ExecutorRoadmap>(`${BASE_URL}/${estateId}`);
  return res.data;
};

const getPhaseOverview = async (estateId: string, phase: RoadmapPhase): Promise<RoadmapPhaseOverview> => {
  const res = await apiClient.get<RoadmapPhaseOverview>(`${BASE_URL}/${estateId}/phases/${phase}`);
  return res.data;
};

const getRecommendedTasks = async (estateId: string): Promise<RecommendedTasksResponse> => {
  const res = await apiClient.get<RecommendedTasksResponse>(`${BASE_URL}/${estateId}/tasks/recommended`);
  return res.data;
};

// ============================================================================
// API FUNCTIONS (MUTATIONS)
// ============================================================================

const startTask = async (roadmapId: string, taskId: string, data?: StartTaskInput) => {
  const res = await apiClient.post<{ message: string; task: unknown }>(
    `${BASE_URL}/${roadmapId}/tasks/${taskId}/start`,
    data
  );
  return res.data;
};

const completeTask = async (roadmapId: string, taskId: string, data?: CompleteTaskInput): Promise<TaskCompletionResult> => {
  const res = await apiClient.post<TaskCompletionResult>(
    `${BASE_URL}/${roadmapId}/tasks/${taskId}/complete`,
    data
  );
  return res.data;
};

const skipTask = async (roadmapId: string, taskId: string, data: SkipTaskInput) => {
  const res = await apiClient.post<{ message: string; task: unknown }>(
    `${BASE_URL}/${roadmapId}/tasks/${taskId}/skip`,
    data
  );
  return res.data;
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

export const useRoadmap = (estateId: string) => {
  return useQuery({
    queryKey: roadmapKeys.detail(estateId),
    queryFn: () => getRoadmap(estateId),
    enabled: !!estateId,
  });
};

export const useRoadmapPhase = (estateId: string, phase: RoadmapPhase) => {
  return useQuery({
    queryKey: roadmapKeys.phase(estateId, phase),
    queryFn: () => getPhaseOverview(estateId, phase),
    enabled: !!estateId && !!phase,
  });
};

export const useRecommendedTasks = (estateId: string) => {
  return useQuery({
    queryKey: roadmapKeys.recommended(estateId),
    queryFn: () => getRecommendedTasks(estateId),
    enabled: !!estateId,
  });
};

export const useStartTask = (estateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roadmapId, taskId, data }: { roadmapId: string; taskId: string; data?: StartTaskInput }) =>
      startTask(roadmapId, taskId, data),
    onSuccess: () => {
      toast.info('Task Started');
      queryClient.invalidateQueries({ queryKey: roadmapKeys.detail(estateId) });
    },
    onError: (err) => toast.error('Start Failed', { description: extractErrorMessage(err) }),
  });
};

export const useCompleteTask = (estateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roadmapId, taskId, data }: { roadmapId: string; taskId: string; data?: CompleteTaskInput }) =>
      completeTask(roadmapId, taskId, data),
    onSuccess: () => {
      toast.success('Task Completed!');
      queryClient.invalidateQueries({ queryKey: roadmapKeys.detail(estateId) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.recommended(estateId) });
    },
    onError: (err) => toast.error('Completion Failed', { description: extractErrorMessage(err) }),
  });
};

export const useSkipTask = (estateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roadmapId, taskId, data }: { roadmapId: string; taskId: string; data: SkipTaskInput }) =>
      skipTask(roadmapId, taskId, data),
    onSuccess: () => {
      toast.warning('Task Skipped');
      queryClient.invalidateQueries({ queryKey: roadmapKeys.detail(estateId) });
    },
    onError: (err) => toast.error('Skip Failed', { description: extractErrorMessage(err) }),
  });
};