// ============================================================================
// roadmap.api.ts - Roadmap Service API Layer
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { toast } from 'sonner';

import {
  type GenerateRoadmapInput,
  type SubmitProofInput,
  type SkipTaskInput,
  type TaskFilterParams,
  type RoadmapDashboardResponse,
  type RoadmapAnalyticsResponse,
  type TaskSummaryResponse,
  type TaskDetailResponse,
} from './roadmap.types';

const BASE_URL = '/succession/roadmaps';

export const roadmapKeys = {
  all: ['roadmap'] as const,
  detail: (id: string) => [...roadmapKeys.all, id] as const,
  dashboard: (id: string) => [...roadmapKeys.detail(id), 'dashboard'] as const,
  analytics: (id: string) => [...roadmapKeys.detail(id), 'analytics'] as const,
  tasks: (id: string, filters: any) => [...roadmapKeys.detail(id), 'tasks', filters] as const,
  task: (roadmapId: string, taskId: string) => [...roadmapKeys.detail(roadmapId), 'task', taskId] as const,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

const generateRoadmap = async (data: GenerateRoadmapInput) => {
  const res = await apiClient.post<{ id: string }>(BASE_URL, data);
  return res.data;
};

const getDashboard = async (id: string): Promise<RoadmapDashboardResponse> => {
  const res = await apiClient.get<RoadmapDashboardResponse>(`${BASE_URL}/${id}/dashboard`);
  return res.data;
};

const getAnalytics = async (id: string): Promise<RoadmapAnalyticsResponse> => {
  const res = await apiClient.get<RoadmapAnalyticsResponse>(`${BASE_URL}/${id}/analytics`);
  return res.data;
};

const getTasks = async (id: string, params: TaskFilterParams): Promise<{ items: TaskSummaryResponse[], meta: any }> => {
  const res = await apiClient.get<{ items: TaskSummaryResponse[], meta: any }>(`${BASE_URL}/${id}/tasks`, { params });
  return res.data;
};

const getTaskDetail = async (id: string, taskId: string): Promise<TaskDetailResponse> => {
  const res = await apiClient.get<TaskDetailResponse>(`${BASE_URL}/${id}/tasks/${taskId}`);
  return res.data;
};

const startTask = async ({ id, taskId }: { id: string; taskId: string }) => {
  const res = await apiClient.post(`${BASE_URL}/${id}/tasks/${taskId}/start`);
  return res.data;
};

const submitProof = async ({ id, taskId, data }: { id: string; taskId: string; data: SubmitProofInput }) => {
  const res = await apiClient.post(`${BASE_URL}/${id}/tasks/${taskId}/proof`, data);
  return res.data;
};

const skipTask = async ({ id, taskId, data }: { id: string; taskId: string; data: SkipTaskInput }) => {
  const res = await apiClient.post(`${BASE_URL}/${id}/tasks/${taskId}/skip`, data);
  return res.data;
};

// ============================================================================
// HOOKS
// ============================================================================

export const useGenerateRoadmap = (options?: { onSuccess?: (data: { id: string }) => void }) => {
  return useMutation({
    mutationFn: generateRoadmap,
    onSuccess: (data) => {
      toast.success('Roadmap Generated');
      options?.onSuccess?.(data);
    },
    onError: (err) => toast.error('Generation Failed', { description: extractErrorMessage(err) }),
  });
};

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

export const useRoadmapTasks = (id: string, filters: TaskFilterParams) => {
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

export const useStartTask = (roadmapId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => startTask({ id: roadmapId, taskId }),
    onSuccess: () => {
      toast.info('Task Started');
      queryClient.invalidateQueries({ queryKey: roadmapKeys.detail(roadmapId) });
    },
  });
};

export const useSubmitProof = (roadmapId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: SubmitProofInput }) => 
      submitProof({ id: roadmapId, taskId, data }),
    onSuccess: () => {
      toast.success('Task Completed!');
      queryClient.invalidateQueries({ queryKey: roadmapKeys.detail(roadmapId) });
    },
    onError: (err) => toast.error('Submission Failed', { description: extractErrorMessage(err) }),
  });
};

export const useSkipTask = (roadmapId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: SkipTaskInput }) => 
      skipTask({ id: roadmapId, taskId, data }),
    onSuccess: () => {
      toast.warning('Task Skipped');
      queryClient.invalidateQueries({ queryKey: roadmapKeys.detail(roadmapId) });
    },
  });
};