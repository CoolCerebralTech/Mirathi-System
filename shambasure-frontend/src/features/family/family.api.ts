// ============================================================================
// family.api.ts - Family Service API Layer (CQRS Pattern)
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { toast } from 'sonner';

import {
  // Input Types
  type CreateFamilyInput,
  type AddFamilyMemberInput,
  type RegisterMarriageInput,
  type EstablishPolygamousHouseInput,
  type DefineRelationshipInput,
  type RecordCohabitationInput,
  type RecordAdoptionInput,
  type VerifyMemberIdentityInput,
  type ArchiveFamilyInput,
  // Response Types
  type FamilyDetailsResponse,
  type FamilyTreeResponse,
  type FamilyMemberResponse,
  type SuccessionAnalysisResponse,
  type PolygamyStatusResponse,
} from '../../types/family.types';
import { KenyanCounty } from '../../types/family.types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = '/families';

export const familyKeys = {
  all: ['families'] as const,
  lists: () => [...familyKeys.all, 'list'] as const,
  details: () => [...familyKeys.all, 'detail'] as const,
  detail: (id: string) => [...familyKeys.details(), id] as const,
  graph: (id: string) => [...familyKeys.detail(id), 'graph'] as const,
  members: (familyId: string) => [...familyKeys.detail(familyId), 'members'] as const,
  member: (familyId: string, memberId: string) => [...familyKeys.members(familyId), memberId] as const,
  analysis: (familyId: string) => [...familyKeys.detail(familyId), 'analysis'] as const,
  succession: (familyId: string) => [...familyKeys.analysis(familyId), 'succession'] as const,
  polygamy: (familyId: string) => [...familyKeys.analysis(familyId), 'polygamy'] as const,
};

// ============================================================================
// API FUNCTIONS (COMMANDS - WRITE)
// ============================================================================

const createFamily = async (data: CreateFamilyInput) => {
  const res = await apiClient.post<{ id: string }>(BASE_URL, data);
  return res.data;
};

const addMember = async ({ familyId, data }: { familyId: string; data: AddFamilyMemberInput }) => {
  const res = await apiClient.post<{ id: string }>(`${BASE_URL}/${familyId}/members`, data);
  return res.data;
};

const registerMarriage = async ({ familyId, data }: { familyId: string; data: RegisterMarriageInput }) => {
  const res = await apiClient.post<{ id: string }>(`${BASE_URL}/${familyId}/marriages`, data);
  return res.data;
};

const establishHouse = async ({ familyId, data }: { familyId: string; data: EstablishPolygamousHouseInput }) => {
  const res = await apiClient.post<{ id: string }>(`${BASE_URL}/${familyId}/houses`, data);
  return res.data;
};

const defineRelationship = async ({ familyId, data }: { familyId: string; data: DefineRelationshipInput }) => {
  const res = await apiClient.post<{ id: string }>(`${BASE_URL}/${familyId}/relationships`, data);
  return res.data;
};

const recordCohabitation = async ({ familyId, data }: { familyId: string; data: RecordCohabitationInput }) => {
  const res = await apiClient.post<{ id: string }>(`${BASE_URL}/${familyId}/cohabitations`, data);
  return res.data;
};

const recordAdoption = async ({ familyId, data }: { familyId: string; data: RecordAdoptionInput }) => {
  const res = await apiClient.post<{ id: string }>(`${BASE_URL}/${familyId}/adoptions`, data);
  return res.data;
};

const verifyIdentity = async ({ 
  familyId, 
  memberId, 
  data 
}: { 
  familyId: string; 
  memberId: string; 
  data: VerifyMemberIdentityInput 
}) => {
  const res = await apiClient.post<{ id: string }>(
    `${BASE_URL}/${familyId}/members/${memberId}/verify`, 
    data
  );
  return res.data;
};

const archiveFamily = async ({ familyId, data }: { familyId: string; data: ArchiveFamilyInput }) => {
  await apiClient.delete(`${BASE_URL}/${familyId}`, { data });
};

// ============================================================================
// API FUNCTIONS (QUERIES - READ)
// ============================================================================

const searchFamilies = async (params: { 
  page?: number; 
  pageSize?: number; 
  search?: string; 
  county?: KenyanCounty 
}) => {
  // Note: Return type depends on your PaginatedResult<T> generic
  const res = await apiClient.get(`${BASE_URL}`, { params });
  return res.data;
};

const getFamilyDashboard = async (familyId: string): Promise<FamilyDetailsResponse> => {
  const res = await apiClient.get<FamilyDetailsResponse>(`${BASE_URL}/${familyId}`);
  return res.data;
};

const getFamilyGraph = async (familyId: string, depth?: number): Promise<FamilyTreeResponse> => {
  const res = await apiClient.get<FamilyTreeResponse>(`${BASE_URL}/${familyId}/graph`, {
    params: { depth }
  });
  return res.data;
};

const getFamilyMember = async (familyId: string, memberId: string): Promise<FamilyMemberResponse> => {
  const res = await apiClient.get<FamilyMemberResponse>(`${BASE_URL}/${familyId}/members/${memberId}`);
  return res.data;
};

const getSuccessionReadiness = async (familyId: string): Promise<SuccessionAnalysisResponse> => {
  const res = await apiClient.get<SuccessionAnalysisResponse>(`${BASE_URL}/${familyId}/analysis/succession`);
  return res.data;
};

const getPolygamyStatus = async (familyId: string): Promise<PolygamyStatusResponse> => {
  const res = await apiClient.get<PolygamyStatusResponse>(`${BASE_URL}/${familyId}/analysis/polygamy`);
  return res.data;
};

// ============================================================================
// REACT QUERY HOOKS (MUTATIONS)
// ============================================================================

export const useCreateFamily = (options?: { onSuccess?: (data: { id: string }) => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFamily,
    onSuccess: (data) => {
      toast.success('Family Tree Created', { description: 'You can now add members.' });
      queryClient.invalidateQueries({ queryKey: familyKeys.lists() });
      options?.onSuccess?.(data);
    },
    onError: (err) => toast.error('Creation Failed', { description: extractErrorMessage(err) }),
  });
};

export const useAddMember = (familyId: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddFamilyMemberInput) => addMember({ familyId, data }),
    onSuccess: () => {
      toast.success('Member Added');
      // Invalidate everything for this family (Graph, Dashboard, Analysis)
      queryClient.invalidateQueries({ queryKey: familyKeys.detail(familyId) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Failed to add member', { description: extractErrorMessage(err) }),
  });
};

export const useEstablishHouse = (familyId: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EstablishPolygamousHouseInput) => establishHouse({ familyId, data }),
    onSuccess: () => {
      toast.success('Polygamous House Established', { description: 'S.40 calculations updated.' });
      // Specifically target Polygamy Analysis and Graph
      queryClient.invalidateQueries({ queryKey: familyKeys.polygamy(familyId) });
      queryClient.invalidateQueries({ queryKey: familyKeys.graph(familyId) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Failed to establish house', { description: extractErrorMessage(err) }),
  });
};

export const useRegisterMarriage = (familyId: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RegisterMarriageInput) => registerMarriage({ familyId, data }),
    onSuccess: () => {
      toast.success('Marriage Registered');
      queryClient.invalidateQueries({ queryKey: familyKeys.detail(familyId) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Marriage Failed', { description: extractErrorMessage(err) }),
  });
};

// ... (Pattern continues for other mutations like defineRelationship, recordCohabitation etc.)

// ============================================================================
// REACT QUERY HOOKS (QUERIES)
// ============================================================================

export const useFamilyDashboard = (familyId: string) => {
  return useQuery({
    queryKey: familyKeys.detail(familyId),
    queryFn: () => getFamilyDashboard(familyId),
    enabled: !!familyId,
    staleTime: 1000 * 60 * 2, // 2 mins
  });
};

export const useFamilyGraph = (familyId: string, depth?: number) => {
  return useQuery({
    queryKey: [...familyKeys.graph(familyId), depth],
    queryFn: () => getFamilyGraph(familyId, depth),
    enabled: !!familyId,
    refetchOnWindowFocus: false, // Graphs can be heavy, don't auto-refetch too often
  });
};

export const useFamilyMember = (familyId: string, memberId: string) => {
  return useQuery({
    queryKey: familyKeys.member(familyId, memberId),
    queryFn: () => getFamilyMember(familyId, memberId),
    enabled: !!familyId && !!memberId,
  });
};

export const useSuccessionReadiness = (familyId: string) => {
  return useQuery({
    queryKey: familyKeys.succession(familyId),
    queryFn: () => getSuccessionReadiness(familyId),
    enabled: !!familyId,
    // This data changes frequently as users complete tasks
    staleTime: 0, 
  });
};

export const usePolygamyStatus = (familyId: string) => {
  return useQuery({
    queryKey: familyKeys.polygamy(familyId),
    queryFn: () => getPolygamyStatus(familyId),
    enabled: !!familyId,
  });
};