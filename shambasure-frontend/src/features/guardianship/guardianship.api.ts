// ============================================================================
// guardianship.api.ts - Guardianship Service API Layer
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { toast } from 'sonner';

import {
  type CreateGuardianshipInput,
  type ActivateGuardianshipInput,
  type TerminateGuardianshipInput,
  type AppointGuardianInput,
  type UpdatePowersInput,
  type PostBondInput,
  type SuspendGuardianInput,
  type SubmitComplianceInput,
  type RecordConflictInput,
  type PaginatedGuardianshipResponse,
  type GuardianshipDetailsResponse,
  type ComplianceTimelineResponse,
  type RiskAssessmentResponse,
} from './guardianship.types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = '/guardianships';

export const guardianshipKeys = {
  all: ['guardianships'] as const,
  lists: () => [...guardianshipKeys.all, 'list'] as const,
  list: (filters: string) => [...guardianshipKeys.lists(), { filters }] as const,
  details: () => [...guardianshipKeys.all, 'detail'] as const,
  detail: (id: string) => [...guardianshipKeys.details(), id] as const,
  timeline: (id: string) => [...guardianshipKeys.detail(id), 'timeline'] as const,
  risk: (id: string) => [...guardianshipKeys.detail(id), 'risk'] as const,
};

// ============================================================================
// API FUNCTIONS (COMMANDS - WRITE)
// ============================================================================

const createGuardianship = async (data: CreateGuardianshipInput) => {
  const res = await apiClient.post<{ id: string }>(BASE_URL, data);
  return res.data;
};

const activateGuardianship = async ({ id, data }: { id: string; data: ActivateGuardianshipInput }) => {
  const res = await apiClient.post(`${BASE_URL}/${id}/activate`, data);
  return res.data;
};

const terminateGuardianship = async ({ id, data }: { id: string; data: TerminateGuardianshipInput }) => {
  const res = await apiClient.post(`${BASE_URL}/${id}/terminate`, data);
  return res.data;
};

const appointGuardian = async ({ id, data }: { id: string; data: AppointGuardianInput }) => {
  const res = await apiClient.post<{ assignmentId: string }>(`${BASE_URL}/${id}/guardians`, data);
  return res.data;
};

const updatePowers = async ({ 
  id, 
  guardianId, 
  data 
}: { 
  id: string; 
  guardianId: string; 
  data: UpdatePowersInput 
}) => {
  const res = await apiClient.put(`${BASE_URL}/${id}/guardians/${guardianId}/powers`, data);
  return res.data;
};

const postBond = async ({ 
  id, 
  guardianId, 
  data 
}: { 
  id: string; 
  guardianId: string; 
  data: PostBondInput 
}) => {
  const res = await apiClient.post(`${BASE_URL}/${id}/guardians/${guardianId}/bond`, data);
  return res.data;
};

const suspendGuardian = async ({ 
  id, 
  guardianId, 
  data 
}: { 
  id: string; 
  guardianId: string; 
  data: SuspendGuardianInput 
}) => {
  const res = await apiClient.post(`${BASE_URL}/${id}/guardians/${guardianId}/suspend`, data);
  return res.data;
};

const submitCompliance = async ({ 
  id, 
  checkId, 
  data 
}: { 
  id: string; 
  checkId: string; 
  data: SubmitComplianceInput 
}) => {
  const res = await apiClient.post(`${BASE_URL}/${id}/compliance/${checkId}/submit`, data);
  return res.data;
};

const recordConflict = async ({ id, data }: { id: string; data: RecordConflictInput }) => {
  const res = await apiClient.post(`${BASE_URL}/${id}/risk/conflict`, data);
  return res.data;
};

// ============================================================================
// API FUNCTIONS (QUERIES - READ)
// ============================================================================

const searchGuardianships = async (params: any): Promise<PaginatedGuardianshipResponse> => {
  const res = await apiClient.get(BASE_URL, { params });
  return res.data;
};

const getGuardianshipDetails = async (id: string): Promise<GuardianshipDetailsResponse> => {
  const res = await apiClient.get<GuardianshipDetailsResponse>(`${BASE_URL}/${id}`);
  return res.data;
};

const getTimeline = async (id: string): Promise<ComplianceTimelineResponse> => {
  const res = await apiClient.get<ComplianceTimelineResponse>(`${BASE_URL}/${id}/timeline`);
  return res.data;
};

const getRiskReport = async (id: string): Promise<RiskAssessmentResponse> => {
  const res = await apiClient.get<RiskAssessmentResponse>(`${BASE_URL}/${id}/risk-assessment`);
  return res.data;
};

// ============================================================================
// REACT QUERY HOOKS (MUTATIONS)
// ============================================================================

export const useCreateGuardianship = (options?: { onSuccess?: (data: { id: string }) => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createGuardianship,
    onSuccess: (data) => {
      toast.success('Guardianship Case Opened');
      queryClient.invalidateQueries({ queryKey: guardianshipKeys.lists() });
      options?.onSuccess?.(data);
    },
    onError: (err) => toast.error('Creation Failed', { description: extractErrorMessage(err) }),
  });
};

export const useAppointGuardian = (id: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AppointGuardianInput) => appointGuardian({ id, data }),
    onSuccess: () => {
      toast.success('Guardian Appointed');
      queryClient.invalidateQueries({ queryKey: guardianshipKeys.detail(id) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Appointment Failed', { description: extractErrorMessage(err) }),
  });
};

export const usePostBond = (id: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ guardianId, data }: { guardianId: string; data: PostBondInput }) => 
      postBond({ id, guardianId, data }),
    onSuccess: () => {
      toast.success('Security Bond Posted', { description: 'Section 72 Requirement Met' });
      queryClient.invalidateQueries({ queryKey: guardianshipKeys.detail(id) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Bond Failed', { description: extractErrorMessage(err) }),
  });
};

export const useSubmitCompliance = (id: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ checkId, data }: { checkId: string; data: SubmitComplianceInput }) => 
      submitCompliance({ id, checkId, data }),
    onSuccess: () => {
      toast.success('Compliance Report Submitted');
      queryClient.invalidateQueries({ queryKey: guardianshipKeys.timeline(id) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Submission Failed', { description: extractErrorMessage(err) }),
  });
};

export const useRecordConflict = (id: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RecordConflictInput) => recordConflict({ id, data }),
    onSuccess: () => {
      toast.warning('Conflict of Interest Recorded', { description: 'Risk score updated.' });
      queryClient.invalidateQueries({ queryKey: guardianshipKeys.risk(id) });
      options?.onSuccess?.();
    },
  });
};

// ============================================================================
// REACT QUERY HOOKS (QUERIES)
// ============================================================================

export const useGuardianshipList = (filters: any) => {
  return useQuery({
    queryKey: guardianshipKeys.list(JSON.stringify(filters)),
    queryFn: () => searchGuardianships(filters),
  });
};

export const useGuardianshipDetails = (id: string) => {
  return useQuery({
    queryKey: guardianshipKeys.detail(id),
    queryFn: () => getGuardianshipDetails(id),
    enabled: !!id,
  });
};

export const useGuardianshipTimeline = (id: string) => {
  return useQuery({
    queryKey: guardianshipKeys.timeline(id),
    queryFn: () => getTimeline(id),
    enabled: !!id,
  });
};

export const useGuardianshipRiskReport = (id: string) => {
  return useQuery({
    queryKey: guardianshipKeys.risk(id),
    queryFn: () => getRiskReport(id),
    enabled: !!id,
    refetchOnWindowFocus: false, // Risk reports are expensive/AI-generated
  });
};