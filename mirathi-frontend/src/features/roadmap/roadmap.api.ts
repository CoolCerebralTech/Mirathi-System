// ============================================================================
// roadmap.api.ts - Roadmap Service API Layer
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { toast } from 'sonner';

import {
  type GenerateRoadmapInput,
  type OptimizeRoadmapInput,
  type TransitionPhaseInput,
  type LinkRiskInput,
  type SubmitTaskProofInput,
  type SkipTaskInput,
  type WaiveTaskInput,
  type EscalateTaskInput,
  type TaskFilterInput,
  type RoadmapDashboardResponse,
  type RoadmapAnalyticsResponse,
  type TaskDetailResponse,
  type TaskListResponse,
} from '../../types/roadmap.types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = '/api/succession/roadmaps';

export const roadmapKeys = {
  all: ['roadmap'] as const,
  detail: (id: string) => [...roadmapKeys.all, id] as const,
  dashboard: (id: string) => [...roadmapKeys.detail(id), 'dashboard'] as const,
  analytics: (id: string) => [...roadmapKeys.detail(id), 'analytics'] as const,
  criticalPath: (id: string) => [...roadmapKeys.detail(id), 'critical-path'] as const,
  tasks: (id: string, filters?: TaskFilterInput) => [...roadmapKeys.detail(id), 'tasks', filters] as const,
  task: (roadmapId: string, taskId: string) => [...roadmapKeys.detail(roadmapId), 'task', taskId] as const,
  taskHistory: (roadmapId: string, taskId: string) => [...roadmapKeys.detail(roadmapId), 'task', taskId, 'history'] as const,
};

// ============================================================================
// API FUNCTIONS (COMMANDS - WRITE)
// ============================================================================

// --- Lifecycle Commands ---
const generateRoadmap = async (data: GenerateRoadmapInput) => {
  const res = await apiClient.post<{ id: string }>(BASE_URL, data);
  return res.data;
};

const optimizeRoadmap = async (id: string, data: OptimizeRoadmapInput) => {
  const res = await apiClient.post<{ status: string }>(`${BASE_URL}/${id}/optimize`, data);
  return res.data;
};

// --- Task Execution Commands ---
const startTask = async (id: string, taskId: string) => {
  const res = await apiClient.post<{ message: string }>(`${BASE_URL}/${id}/tasks/${taskId}/start`);
  return res.data;
};

const submitTaskProof = async (id: string, taskId: string, data: SubmitTaskProofInput) => {
  const res = await apiClient.post<{ message: string }>(`${BASE_URL}/${id}/tasks/${taskId}/proof`, data);
  return res.data;
};

const skipTask = async (id: string, taskId: string, data: SkipTaskInput) => {
  const res = await apiClient.post<{ message: string }>(`${BASE_URL}/${id}/tasks/${taskId}/skip`, data);
  return res.data;
};

// Note: The controllers don't have waive and escalate endpoints yet, but they're in the DTOs
// We'll add them for completeness
const waiveTask = async (id: string, taskId: string, data: WaiveTaskInput) => {
  const res = await apiClient.post<{ message: string }>(`${BASE_URL}/${id}/tasks/${taskId}/waive`, data);
  return res.data;
};

const escalateTask = async (id: string, taskId: string, data: EscalateTaskInput) => {
  const res = await apiClient.post<{ message: string }>(`${BASE_URL}/${id}/tasks/${taskId}/escalate`, data);
  return res.data;
};

// --- Phase & Risk Commands ---
const transitionPhase = async (id: string, data: TransitionPhaseInput) => {
  const res = await apiClient.patch<{ message: string }>(`${BASE_URL}/${id}/phase/transition`, data);
  return res.data;
};

const linkRisk = async (id: string, data: LinkRiskInput) => {
  const res = await apiClient.post<{ message: string }>(`${BASE_URL}/${id}/risks/link`, data);
  return res.data;
};

// ============================================================================
// API FUNCTIONS (QUERIES - READ)
// ============================================================================

// --- Dashboard & Insights ---
const getDashboard = async (id: string): Promise<RoadmapDashboardResponse> => {
  const res = await apiClient.get<RoadmapDashboardResponse>(`${BASE_URL}/${id}/dashboard`);
  return res.data;
};

const getAnalytics = async (id: string): Promise<RoadmapAnalyticsResponse> => {
  const res = await apiClient.get<RoadmapAnalyticsResponse>(`${BASE_URL}/${id}/analytics`);
  return res.data;
};

const getCriticalPath = async (id: string) => {
  const res = await apiClient.get(`${BASE_URL}/${id}/critical-path`);
  return res.data;
};

// --- Task Management ---
const getTasks = async (id: string, filters?: TaskFilterInput): Promise<TaskListResponse> => {
  const res = await apiClient.get<TaskListResponse>(`${BASE_URL}/${id}/tasks`, { 
    params: filters,
    paramsSerializer: {
      indexes: null, // Important for array params like status[]
    },
  });
  return res.data;
};

const getTaskDetail = async (id: string, taskId: string): Promise<TaskDetailResponse> => {
  const res = await apiClient.get<TaskDetailResponse>(`${BASE_URL}/${id}/tasks/${taskId}`);
  return res.data;
};

const getTaskHistory = async (id: string, taskId: string) => {
  const res = await apiClient.get(`${BASE_URL}/${id}/tasks/${taskId}/history`);
  return res.data;
};

// ============================================================================
// REACT QUERY HOOKS (MUTATIONS)
// ============================================================================

// --- Lifecycle Mutations ---
export const useGenerateRoadmap = (options?: { onSuccess?: (data: { id: string }) => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: generateRoadmap,
    onSuccess: (data) => {
      toast.success('Roadmap Generated');
      // Invalidate all roadmap queries since we have a new one
      queryClient.invalidateQueries({ queryKey: roadmapKeys.all });
      options?.onSuccess?.(data);
    },
    onError: (err) => toast.error('Generation Failed', { description: extractErrorMessage(err) }),
  });
};

export const useOptimizeRoadmap = (id: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OptimizeRoadmapInput) => optimizeRoadmap(id, data),
    onSuccess: () => {
      toast.success('Roadmap Optimized');
      queryClient.invalidateQueries({ queryKey: roadmapKeys.dashboard(id) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.analytics(id) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.criticalPath(id) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Optimization Failed', { description: extractErrorMessage(err) }),
  });
};

// --- Task Execution Mutations ---
export const useStartTask = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => startTask(id, taskId),
    onSuccess: () => {
      toast.info('Task Started');
      queryClient.invalidateQueries({ queryKey: roadmapKeys.dashboard(id) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.tasks(id) });
      // Also invalidate the specific task detail
      queryClient.invalidateQueries({ queryKey: roadmapKeys.detail(id) });
    },
    onError: (err) => toast.error('Start Failed', { description: extractErrorMessage(err) }),
  });
};

export const useSubmitTaskProof = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: SubmitTaskProofInput }) =>
      submitTaskProof(id, taskId, data),
    onSuccess: () => {
      toast.success('Task Completed!');
      queryClient.invalidateQueries({ queryKey: roadmapKeys.dashboard(id) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.tasks(id) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.analytics(id) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.criticalPath(id) });
    },
    onError: (err) => toast.error('Submission Failed', { description: extractErrorMessage(err) }),
  });
};

export const useSkipTask = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: SkipTaskInput }) =>
      skipTask(id, taskId, data),
    onSuccess: () => {
      toast.warning('Task Skipped');
      queryClient.invalidateQueries({ queryKey: roadmapKeys.dashboard(id) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.tasks(id) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.analytics(id) });
    },
    onError: (err) => toast.error('Skip Failed', { description: extractErrorMessage(err) }),
  });
};

export const useWaiveTask = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: WaiveTaskInput }) =>
      waiveTask(id, taskId, data),
    onSuccess: () => {
      toast.info('Task Waived');
      queryClient.invalidateQueries({ queryKey: roadmapKeys.dashboard(id) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.tasks(id) });
    },
    onError: (err) => toast.error('Waiver Failed', { description: extractErrorMessage(err) }),
  });
};

export const useEscalateTask = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: EscalateTaskInput }) =>
      escalateTask(id, taskId, data),
    onSuccess: () => {
      toast.warning('Task Escalated');
      queryClient.invalidateQueries({ queryKey: roadmapKeys.dashboard(id) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.tasks(id) });
    },
    onError: (err) => toast.error('Escalation Failed', { description: extractErrorMessage(err) }),
  });
};

// --- Phase & Risk Mutations ---
export const useTransitionPhase = (id: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TransitionPhaseInput) => transitionPhase(id, data),
    onSuccess: () => {
      toast.success('Phase Transitioned');
      queryClient.invalidateQueries({ queryKey: roadmapKeys.dashboard(id) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.analytics(id) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.tasks(id) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Transition Failed', { description: extractErrorMessage(err) }),
  });
};

export const useLinkRisk = (id: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LinkRiskInput) => linkRisk(id, data),
    onSuccess: () => {
      toast.info('Risk Linked');
      queryClient.invalidateQueries({ queryKey: roadmapKeys.dashboard(id) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.tasks(id) });
      queryClient.invalidateQueries({ queryKey: roadmapKeys.criticalPath(id) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Link Failed', { description: extractErrorMessage(err) }),
  });
};

// ============================================================================
// REACT QUERY HOOKS (QUERIES)
// ============================================================================

export const useRoadmapDashboard = (id: string) => {
  return useQuery({
    queryKey: roadmapKeys.dashboard(id),
    queryFn: () => getDashboard(id),
    enabled: !!id,
  });
};

export const useRoadmapAnalytics = (id: string) => {
  return useQuery({
    queryKey: roadmapKeys.analytics(id),
    queryFn: () => getAnalytics(id),
    enabled: !!id,
  });
};

export const useCriticalPath = (id: string) => {
  return useQuery({
    queryKey: roadmapKeys.criticalPath(id),
    queryFn: () => getCriticalPath(id),
    enabled: !!id,
  });
};

export const useRoadmapTasks = (id: string, filters?: TaskFilterInput) => {
  return useQuery({
    queryKey: roadmapKeys.tasks(id, filters),
    queryFn: () => getTasks(id, filters),
    enabled: !!id,
  });
};

export const useTaskDetail = (roadmapId: string, taskId: string) => {
  return useQuery({
    queryKey: roadmapKeys.task(roadmapId, taskId),
    queryFn: () => getTaskDetail(roadmapId, taskId),
    enabled: !!roadmapId && !!taskId,
  });
};

export const useTaskHistory = (roadmapId: string, taskId: string) => {
  return useQuery({
    queryKey: roadmapKeys.taskHistory(roadmapId, taskId),
    queryFn: () => getTaskHistory(roadmapId, taskId),
    enabled: !!roadmapId && !!taskId,
  });
};