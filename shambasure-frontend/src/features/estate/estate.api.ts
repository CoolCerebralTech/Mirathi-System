// ============================================================================
// estate.api.ts - Estate Service API Layer
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractErrorMessage } from '../../api/client';
import { toast } from 'sonner';

import {
  type CreateEstateInput,
  type AddAssetInput,
  type AddDebtInput,
  type PayDebtInput,
  type InitiateLiquidationInput,
  type EstateDashboardResponse,
  type SolvencyRadarResponse,
  type AssetInventoryResponse,
  type DebtWaterfallResponse,
} from './estate.types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = '/estates';

export const estateKeys = {
  all: ['estates'] as const,
  detail: (id: string) => [...estateKeys.all, id] as const,
  dashboard: (id: string) => [...estateKeys.detail(id), 'dashboard'] as const,
  radar: (id: string) => [...estateKeys.detail(id), 'radar'] as const,
  assets: (id: string) => [...estateKeys.detail(id), 'assets'] as const,
  debts: (id: string) => [...estateKeys.detail(id), 'debts'] as const,
  // Add others as needed (gifts, dependants)
};

// ============================================================================
// API FUNCTIONS (COMMANDS - WRITE)
// ============================================================================

const createEstate = async (data: CreateEstateInput) => {
  const res = await apiClient.post<{ id: string }>(BASE_URL, data);
  return res.data;
};

const addAsset = async ({ estateId, data }: { estateId: string; data: AddAssetInput }) => {
  const res = await apiClient.post<{ id: string }>(`${BASE_URL}/${estateId}/assets`, data);
  return res.data;
};

const addDebt = async ({ estateId, data }: { estateId: string; data: AddDebtInput }) => {
  const res = await apiClient.post<{ id: string }>(`${BASE_URL}/${estateId}/debts`, data);
  return res.data;
};

const payDebt = async ({ estateId, debtId, data }: { estateId: string; debtId: string; data: PayDebtInput }) => {
  const res = await apiClient.post(`${BASE_URL}/${estateId}/debts/${debtId}/pay`, data);
  return res.data;
};

const executeWaterfall = async (estateId: string) => {
  // Assuming full automation for now, no payload needed unless overriding amounts
  const res = await apiClient.post(`${BASE_URL}/${estateId}/debts/waterfall`, { 
    // Defaulting to "Use Cash on Hand" logic in backend
    availableCash: { amount: 0, currency: 'KES' } 
  });
  return res.data;
};

const initiateLiquidation = async ({ estateId, data }: { estateId: string; data: InitiateLiquidationInput }) => {
  const res = await apiClient.post(`${BASE_URL}/${estateId}/liquidation`, data);
  return res.data;
};

// ============================================================================
// API FUNCTIONS (QUERIES - READ)
// ============================================================================

const getDashboard = async (estateId: string): Promise<EstateDashboardResponse> => {
  const res = await apiClient.get<EstateDashboardResponse>(`${BASE_URL}/${estateId}/dashboard`);
  return res.data;
};

const getSolvencyRadar = async (estateId: string): Promise<SolvencyRadarResponse> => {
  const res = await apiClient.get<SolvencyRadarResponse>(`${BASE_URL}/${estateId}/solvency-radar`);
  return res.data;
};

const getAssets = async (estateId: string, filters?: any): Promise<AssetInventoryResponse> => {
  const res = await apiClient.get<AssetInventoryResponse>(`${BASE_URL}/${estateId}/assets`, { params: filters });
  return res.data;
};

const getDebts = async (estateId: string): Promise<DebtWaterfallResponse> => {
  const res = await apiClient.get<DebtWaterfallResponse>(`${BASE_URL}/${estateId}/debts`);
  return res.data;
};

// ============================================================================
// REACT QUERY HOOKS (MUTATIONS)
// ============================================================================

export const useCreateEstate = (options?: { onSuccess?: (data: { id: string }) => void }) => {
  return useMutation({
    mutationFn: createEstate,
    onSuccess: (data) => {
      toast.success('Estate Ledger Created');
      options?.onSuccess?.(data);
    },
    onError: (err) => toast.error('Failed to create estate', { description: extractErrorMessage(err) }),
  });
};

export const useAddAsset = (estateId: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddAssetInput) => addAsset({ estateId, data }),
    onSuccess: () => {
      toast.success('Asset Added to Inventory');
      // Invalidate Assets list AND Financial Dashboard (Net Worth changes)
      queryClient.invalidateQueries({ queryKey: estateKeys.assets(estateId) });
      queryClient.invalidateQueries({ queryKey: estateKeys.dashboard(estateId) });
      queryClient.invalidateQueries({ queryKey: estateKeys.radar(estateId) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Failed to add asset', { description: extractErrorMessage(err) }),
  });
};

export const useAddDebt = (estateId: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddDebtInput) => addDebt({ estateId, data }),
    onSuccess: () => {
      toast.success('Liability Recorded');
      queryClient.invalidateQueries({ queryKey: estateKeys.debts(estateId) });
      queryClient.invalidateQueries({ queryKey: estateKeys.dashboard(estateId) });
      queryClient.invalidateQueries({ queryKey: estateKeys.radar(estateId) }); // Risk score might go up
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Failed to add debt', { description: extractErrorMessage(err) }),
  });
};

export const usePayDebt = (estateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ debtId, data }: { debtId: string; data: PayDebtInput }) => 
      payDebt({ estateId, debtId, data }),
    onSuccess: () => {
      toast.success('Payment Recorded');
      queryClient.invalidateQueries({ queryKey: estateKeys.debts(estateId) });
      queryClient.invalidateQueries({ queryKey: estateKeys.dashboard(estateId) });
    },
  });
};

// ============================================================================
// REACT QUERY HOOKS (QUERIES)
// ============================================================================

export const useEstateDashboard = (estateId: string) => {
  return useQuery({
    queryKey: estateKeys.dashboard(estateId),
    queryFn: () => getDashboard(estateId),
    enabled: !!estateId,
  });
};

export const useSolvencyRadar = (estateId: string) => {
  return useQuery({
    queryKey: estateKeys.radar(estateId),
    queryFn: () => getSolvencyRadar(estateId),
    enabled: !!estateId,
  });
};

export const useAssetInventory = (estateId: string, filters?: any) => {
  return useQuery({
    queryKey: [...estateKeys.assets(estateId), filters],
    queryFn: () => getAssets(estateId, filters),
    enabled: !!estateId,
  });
};

export const useDebtWaterfall = (estateId: string) => {
  return useQuery({
    queryKey: estateKeys.debts(estateId),
    queryFn: () => getDebts(estateId),
    enabled: !!estateId,
  });
};