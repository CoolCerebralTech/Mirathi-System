// ============================================================================
// src/api/estate.api.ts
// Production-Ready API Client - Strictly Aligned with Backend Controllers
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient, extractErrorMessage } from '../../api/client';
import type {
  // Estate Types
  CreateEstateInput,
  EstateSummaryResponse,
  
  // Asset Types
  AddGenericAssetInput,
  AddLandAssetInput,
  AddVehicleAssetInput,
  UpdateAssetValueInput,
  VerifyAssetInput,
  AssetResponse,
  
  // Debt Types
  AddDebtInput,
  PayDebtInput,
  DebtResponse,
  
  // Will Types
  CreateWillInput,
  AddBeneficiaryInput,
  AddWitnessInput,
  WillPreviewResponse,
} from '../../types/estate.types';

// ============================================================================
// 1. CONFIGURATION
// ============================================================================

/**
 * Service Base Path
 * Gateway routes: /estate -> estate-service
 * 
 * Controllers:
 * - EstateController:  /estate/estate
 * - AssetsController:  /estate/estate/:estateId/assets
 * - DebtsController:   /estate/estate/:estateId/debts
 * - WillController:    /estate/will
 */
const SERVICE_BASE = '/estate';

/**
 * Standard NestJS Response Wrapper
 * All endpoints return: { message: string; data: T }
 */
interface ApiResponse<T> {
  message: string;
  data: T;
  count?: number; // Optional: for list endpoints
}

/**
 * React Query Cache Keys
 * Hierarchical structure for granular invalidation
 */
export const estateKeys = {
  all: ['estate'] as const,
  summary: (userId: string) => [...estateKeys.all, 'summary', userId] as const,
  assets: (estateId: string) => [...estateKeys.all, 'assets', estateId] as const,
  debts: (estateId: string) => [...estateKeys.all, 'debts', estateId] as const,
  will: {
    root: ['will'] as const,
    detail: (willId: string) => [...estateKeys.will.root, willId] as const,
    preview: (willId: string) => [...estateKeys.will.root, willId, 'preview'] as const,
  },
};

// ============================================================================
// 2. ESTATE API (EstateController)
// ============================================================================

/**
 * POST /estate/estate
 * Creates a new Estate record
 * 
 * Backend: EstateController.create()
 * Returns: Estate entity JSON
 */
const createEstate = async (data: CreateEstateInput): Promise<EstateSummaryResponse> => {
  const res = await apiClient.post<ApiResponse<EstateSummaryResponse>>(
    `${SERVICE_BASE}/estate`,
    data
  );
  return res.data.data;
};

/**
 * GET /estate/estate/:userId
 * Fetches Estate Summary with Legal Insights ("Digital Lawyer")
 * 
 * Backend: EstateController.getSummary()
 * Returns: EstateSummaryDto
 */
const getEstateSummary = async (userId: string): Promise<EstateSummaryResponse> => {
  const res = await apiClient.get<ApiResponse<EstateSummaryResponse>>(
    `${SERVICE_BASE}/estate/${userId}`
  );
  return res.data.data;
};

// ============================================================================
// 3. ASSETS API (AssetsController)
// ============================================================================

/**
 * POST /estate/estate/:estateId/assets/generic
 * Add a generic asset (any category except LAND/VEHICLE)
 * 
 * Backend: AssetsController.addGeneric()
 */
const addGenericAsset = async (
  estateId: string,
  data: AddGenericAssetInput
): Promise<AssetResponse> => {
  const res = await apiClient.post<ApiResponse<AssetResponse>>(
    `${SERVICE_BASE}/estate/${estateId}/assets/generic`,
    data
  );
  return res.data.data;
};

/**
 * POST /estate/estate/:estateId/assets/land
 * Add land asset with Title Deed details
 * 
 * Backend: AssetsController.addLand()
 * Note: Backend maps flattened DTO to nested service object
 */
const addLandAsset = async (
  estateId: string,
  data: AddLandAssetInput
): Promise<AssetResponse> => {
  const res = await apiClient.post<ApiResponse<AssetResponse>>(
    `${SERVICE_BASE}/estate/${estateId}/assets/land`,
    data
  );
  return res.data.data;
};

/**
 * POST /estate/estate/:estateId/assets/vehicle
 * Add vehicle asset with Registration details
 * 
 * Backend: AssetsController.addVehicle()
 */
const addVehicleAsset = async (
  estateId: string,
  data: AddVehicleAssetInput
): Promise<AssetResponse> => {
  const res = await apiClient.post<ApiResponse<AssetResponse>>(
    `${SERVICE_BASE}/estate/${estateId}/assets/vehicle`,
    data
  );
  return res.data.data;
};

/**
 * GET /estate/estate/:estateId/assets
 * List all assets for an estate
 * 
 * Backend: AssetsController.list()
 * Returns: Array of AssetResponseDto
 */
const listAssets = async (estateId: string): Promise<AssetResponse[]> => {
  const res = await apiClient.get<ApiResponse<AssetResponse[]>>(
    `${SERVICE_BASE}/estate/${estateId}/assets`
  );
  return res.data.data;
};

/**
 * PUT /estate/estate/:estateId/assets/:assetId/value
 * Update asset estimated value
 * 
 * Backend: AssetsController.updateValue()
 */
const updateAssetValue = async (
  assetId: string,
  data: UpdateAssetValueInput
): Promise<void> => {
  await apiClient.put<ApiResponse<void>>(
    `${SERVICE_BASE}/estate/assets/${assetId}/value`,
    data
  );
};

/**
 * POST /estate/estate/:estateId/assets/:assetId/verify
 * Verify asset with proof document
 * 
 * Backend: AssetsController.verify()
 */
const verifyAsset = async (assetId: string, data: VerifyAssetInput): Promise<void> => {
  await apiClient.post<ApiResponse<void>>(
    `${SERVICE_BASE}/estate/assets/${assetId}/verify`,
    data
  );
};

// ============================================================================
// 4. DEBTS API (DebtsController)
// ============================================================================

/**
 * POST /estate/estate/:estateId/debts
 * Add debt with auto-priority calculation (Section 45 LSA)
 * 
 * Backend: DebtsController.add()
 * Priority is calculated by backend based on category
 */
const addDebt = async (estateId: string, data: AddDebtInput): Promise<DebtResponse> => {
  const res = await apiClient.post<ApiResponse<DebtResponse>>(
    `${SERVICE_BASE}/estate/${estateId}/debts`,
    data
  );
  return res.data.data;
};

/**
 * GET /estate/estate/:estateId/debts
 * List debts ordered by Priority (CRITICAL > HIGH > MEDIUM > LOW)
 * 
 * Backend: DebtsController.list()
 */
const listDebts = async (estateId: string): Promise<DebtResponse[]> => {
  const res = await apiClient.get<ApiResponse<DebtResponse[]>>(
    `${SERVICE_BASE}/estate/${estateId}/debts`
  );
  return res.data.data;
};

/**
 * POST /estate/estate/:estateId/debts/:debtId/pay
 * Record debt payment
 * 
 * Backend: DebtsController.pay()
 */
const payDebt = async (debtId: string, data: PayDebtInput): Promise<void> => {
  await apiClient.post<ApiResponse<void>>(
    `${SERVICE_BASE}/estate/debts/${debtId}/pay`,
    data
  );
};

// ============================================================================
// 5. WILL API (WillController)
// ============================================================================

/**
 * Will Creation Response (Backend specific)
 * Backend returns Will.toJSON(), not full WillResponse
 */
interface WillCreationResponse {
  id: string;
  userId: string;
  testatorName: string;
  status: string;
  versionNumber: number;
  createdAt: string;
}

/**
 * POST /estate/will
 * Create a new Will draft
 * 
 * Backend: WillController.create()
 */
const createWill = async (data: CreateWillInput): Promise<WillCreationResponse> => {
  const res = await apiClient.post<ApiResponse<WillCreationResponse>>(
    `${SERVICE_BASE}/will`,
    data
  );
  return res.data.data;
};

/**
 * POST /estate/will/:willId/beneficiaries
 * Add beneficiary to will
 * 
 * Backend: WillController.addBeneficiary()
 * Note: Backend expects description (required in service)
 */
const addBeneficiary = async (willId: string, data: AddBeneficiaryInput): Promise<void> => {
  await apiClient.post<ApiResponse<void>>(
    `${SERVICE_BASE}/will/${willId}/beneficiaries`,
    data
  );
};

/**
 * POST /estate/will/:willId/witnesses
 * Add witness to will
 * 
 * Backend: WillController.addWitness()
 * Note: Only fullName and email are used by backend service
 */
const addWitness = async (willId: string, data: AddWitnessInput): Promise<void> => {
  await apiClient.post<ApiResponse<void>>(
    `${SERVICE_BASE}/will/${willId}/witnesses`,
    data
  );
};

/**
 * GET /estate/will/:willId/preview
 * Generate HTML preview of will
 * 
 * Backend: WillController.preview()
 * Returns: WillPreviewDto with metadata and htmlPreview
 */
const getWillPreview = async (willId: string): Promise<WillPreviewResponse> => {
  const res = await apiClient.get<ApiResponse<WillPreviewResponse>>(
    `${SERVICE_BASE}/will/${willId}/preview`
  );
  return res.data.data;
};

// ============================================================================
// 6. REACT QUERY HOOKS - MUTATIONS
// ============================================================================

// --- ESTATE MUTATIONS ---

/**
 * Create Estate Mutation
 * Invalidates all estate queries on success
 */
export const useCreateEstate = (options?: { 
  onSuccess?: (data: EstateSummaryResponse) => void;
}) => {
  const queryClient = useQueryClient();
  
  return useMutation<EstateSummaryResponse, Error, CreateEstateInput>({
    mutationFn: createEstate,
    onSuccess: (data) => {
      toast.success('Estate Created Successfully');
      queryClient.invalidateQueries({ queryKey: estateKeys.all });
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      toast.error('Failed to create estate', {
        description: extractErrorMessage(err),
      });
    },
  });
};

// --- ASSET MUTATIONS ---

/**
 * Discriminated Union for Type-Safe Asset Addition
 * Ensures correct data type for each asset category
 */
type AddAssetVariables =
  | { type: 'GENERIC'; estateId: string; data: AddGenericAssetInput }
  | { type: 'LAND'; estateId: string; data: AddLandAssetInput }
  | { type: 'VEHICLE'; estateId: string; data: AddVehicleAssetInput };

/**
 * Add Asset Mutation (Polymorphic)
 * Handles GENERIC, LAND, and VEHICLE assets
 * Invalidates both asset list and estate summary (net worth changes)
 */
export const useAddAsset = (options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();

  return useMutation<AssetResponse, Error, AddAssetVariables>({
    mutationFn: async (payload) => {
      switch (payload.type) {
        case 'LAND':
          return addLandAsset(payload.estateId, payload.data);
        case 'VEHICLE':
          return addVehicleAsset(payload.estateId, payload.data);
        case 'GENERIC':
        default:
          return addGenericAsset(payload.estateId, payload.data);
      }
    },
    onSuccess: (_, variables) => {
      toast.success('Asset Added to Inventory');
      queryClient.invalidateQueries({ queryKey: estateKeys.assets(variables.estateId) });
      queryClient.invalidateQueries({ queryKey: estateKeys.all }); // Net Worth changes
      options?.onSuccess?.();
    },
    onError: (err) => {
      toast.error('Failed to add asset', {
        description: extractErrorMessage(err),
      });
    },
  });
};

/**
 * Update Asset Value Mutation
 * Invalidates all estate queries (net worth changes)
 */
export const useUpdateAssetValue = (options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, { assetId: string; data: UpdateAssetValueInput }>({
    mutationFn: ({ assetId, data }) => updateAssetValue(assetId, data),
    onSuccess: () => {
      toast.success('Asset Value Updated');
      queryClient.invalidateQueries({ queryKey: estateKeys.all });
      options?.onSuccess?.();
    },
    onError: (err) => {
      toast.error('Failed to update value', {
        description: extractErrorMessage(err),
      });
    },
  });
};

/**
 * Verify Asset Mutation
 * Changes asset status to VERIFIED
 */
export const useVerifyAsset = (options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, { assetId: string; data: VerifyAssetInput }>({
    mutationFn: ({ assetId, data }) => verifyAsset(assetId, data),
    onSuccess: () => {
      toast.success('Asset Verified');
      queryClient.invalidateQueries({ queryKey: estateKeys.all });
      options?.onSuccess?.();
    },
    onError: (err) => {
      toast.error('Verification failed', {
        description: extractErrorMessage(err),
      });
    },
  });
};

// --- DEBT MUTATIONS ---

/**
 * Add Debt Mutation
 * Backend auto-calculates priority based on category
 * Invalidates debts list and estate summary (net worth changes)
 */
export const useAddDebt = (
  estateId: string,
  options?: { onSuccess?: () => void }
) => {
  const queryClient = useQueryClient();
  
  return useMutation<DebtResponse, Error, AddDebtInput>({
    mutationFn: (data) => addDebt(estateId, data),
    onSuccess: () => {
      toast.success('Liability Recorded');
      queryClient.invalidateQueries({ queryKey: estateKeys.debts(estateId) });
      queryClient.invalidateQueries({ queryKey: estateKeys.all }); // Net Worth changes
      options?.onSuccess?.();
    },
    onError: (err) => {
      toast.error('Failed to record debt', {
        description: extractErrorMessage(err),
      });
    },
  });
};

/**
 * Pay Debt Mutation
 * Updates outstanding balance and status
 */
export const usePayDebt = (options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, { debtId: string; data: PayDebtInput }>({
    mutationFn: ({ debtId, data }) => payDebt(debtId, data),
    onSuccess: () => {
      toast.success('Payment Recorded');
      queryClient.invalidateQueries({ queryKey: estateKeys.all });
      options?.onSuccess?.();
    },
    onError: (err) => {
      toast.error('Payment failed', {
        description: extractErrorMessage(err),
      });
    },
  });
};

// --- WILL MUTATIONS ---

/**
 * Create Will Mutation
 * Creates a new DRAFT will
 */
export const useCreateWill = (options?: { 
  onSuccess?: (data: WillCreationResponse) => void;
}) => {
  return useMutation<WillCreationResponse, Error, CreateWillInput>({
    mutationFn: createWill,
    onSuccess: (data) => {
      toast.success('Will Draft Created');
      options?.onSuccess?.(data);
    },
    onError: (err) => {
      toast.error('Failed to create will', {
        description: extractErrorMessage(err),
      });
    },
  });
};

/**
 * Add Beneficiary Mutation
 * Invalidates will preview (completeness changes)
 */
export const useAddBeneficiary = (
  willId: string,
  options?: { onSuccess?: () => void }
) => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, AddBeneficiaryInput>({
    mutationFn: (data) => addBeneficiary(willId, data),
    onSuccess: () => {
      toast.success('Beneficiary Added');
      queryClient.invalidateQueries({ queryKey: estateKeys.will.preview(willId) });
      options?.onSuccess?.();
    },
    onError: (err) => {
      toast.error('Failed to add beneficiary', {
        description: extractErrorMessage(err),
      });
    },
  });
};

/**
 * Add Witness Mutation
 * Invalidates will preview (completeness changes)
 * Note: Backend only uses fullName and email from DTO
 */
export const useAddWitness = (
  willId: string,
  options?: { onSuccess?: () => void }
) => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, AddWitnessInput>({
    mutationFn: (data) => addWitness(willId, data),
    onSuccess: () => {
      toast.success('Witness Nominated');
      queryClient.invalidateQueries({ queryKey: estateKeys.will.preview(willId) });
      options?.onSuccess?.();
    },
    onError: (err) => {
      toast.error('Failed to add witness', {
        description: extractErrorMessage(err),
      });
    },
  });
};

// ============================================================================
// 7. REACT QUERY HOOKS - QUERIES
// ============================================================================

/**
 * Estate Summary Query
 * Fetches estate with net worth calculation and legal insights
 */
export const useEstateSummary = (
  userId: string,
  options?: { enabled?: boolean }
) => {
  return useQuery<EstateSummaryResponse, Error>({
    queryKey: estateKeys.summary(userId),
    queryFn: () => getEstateSummary(userId),
    enabled: options?.enabled !== false && !!userId,
  });
};

/**
 * Asset List Query
 * Fetches all assets for an estate
 */
export const useAssetList = (
  estateId: string,
  options?: { enabled?: boolean }
) => {
  return useQuery<AssetResponse[], Error>({
    queryKey: estateKeys.assets(estateId),
    queryFn: () => listAssets(estateId),
    enabled: options?.enabled !== false && !!estateId,
  });
};

/**
 * Debt List Query
 * Fetches all debts ordered by priority
 */
export const useDebtList = (
  estateId: string,
  options?: { enabled?: boolean }
) => {
  return useQuery<DebtResponse[], Error>({
    queryKey: estateKeys.debts(estateId),
    queryFn: () => listDebts(estateId),
    enabled: options?.enabled !== false && !!estateId,
  });
};

/**
 * Will Preview Query
 * Generates HTML preview with metadata
 */
export const useWillPreview = (
  willId: string,
  options?: { enabled?: boolean }
) => {
  return useQuery<WillPreviewResponse, Error>({
    queryKey: estateKeys.will.preview(willId),
    queryFn: () => getWillPreview(willId),
    enabled: options?.enabled !== false && !!willId,
  });
};