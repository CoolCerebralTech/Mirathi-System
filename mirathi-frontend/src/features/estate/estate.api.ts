// ============================================================================
// estate.api.ts - Estate Service API Layer
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient, extractErrorMessage } from '../../api/client';
import type {
  AddAssetCoOwnerInput,
  AddAssetInput,
  AddDebtInput,
  AddDependantEvidenceInput,
  ApproveLiquidationInput,
  AssetFilters,
  AssetInventoryResponse,
  CancelLiquidationInput,
  CloseEstateInput,
  ContestGiftInput,
  CreateEstateInput,
  DebtFilters,
  DebtWaterfallResponse,
  DependantFilters,
  DependantListResponse,
  DisputeDebtInput,
  DistributionPreviewResponse,
  EncumberAssetInput,
  EstateDashboardResponse,
  ExecuteWaterfallInput,
  FileDependantClaimInput,
  FreezeEstateInput,
  GiftFilters,
  GiftListResponse,
  InitiateLiquidationInput,
  PayDebtInput,
  ReceiveLiquidationProceedsInput,
  RecordGiftInput,
  RecordLiquidationSaleInput,
  RecordTaxAssessmentInput,
  RecordTaxPaymentInput,
  RejectClaimInput,
  ResolveDebtDisputeInput,
  ResolveGiftDisputeInput,
  SettleClaimInput,
  SolvencyRadarResponse,
  UnfreezeEstateInput,
  UpdateAssetValuationInput,
  UploadTaxClearanceInput,
  VerifyClaimInput,
  WriteOffDebtInput,
} from '../../types/estate.types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = '/estate/estates';

export const estateKeys = {
  all: ['estates'] as const,
  detail: (id: string) => [...estateKeys.all, id] as const,
  dashboard: (id: string) => [...estateKeys.detail(id), 'dashboard'] as const,
  radar: (id: string) => [...estateKeys.detail(id), 'radar'] as const,
  assets: (id: string) => [...estateKeys.detail(id), 'assets'] as const,
  asset: (estateId: string, assetId: string) => [...estateKeys.assets(estateId), assetId] as const,
  debts: (id: string) => [...estateKeys.detail(id), 'debts'] as const,
  dependants: (id: string) => [...estateKeys.detail(id), 'dependants'] as const,
  gifts: (id: string) => [...estateKeys.detail(id), 'gifts'] as const,
  distribution: (id: string) => [...estateKeys.detail(id), 'distribution'] as const,
  liquidations: (id: string) => [...estateKeys.detail(id), 'liquidations'] as const,
};

// ============================================================================
// 1. LIFECYCLE MANAGEMENT
// ============================================================================

const createEstate = async (data: CreateEstateInput) => {
  const res = await apiClient.post<{ id: string }>(BASE_URL, data);
  return res.data;
};

const freezeEstate = async ({ estateId, data }: { estateId: string; data: FreezeEstateInput }) => {
  const res = await apiClient.patch(`${BASE_URL}/${estateId}/freeze`, data);
  return res.data;
};

const unfreezeEstate = async ({ estateId, data }: { estateId: string; data: UnfreezeEstateInput }) => {
  const res = await apiClient.patch(`${BASE_URL}/${estateId}/unfreeze`, data);
  return res.data;
};

const closeEstate = async ({ estateId, data }: { estateId: string; data: CloseEstateInput }) => {
  const res = await apiClient.post(`${BASE_URL}/${estateId}/close`, data);
  return res.data;
};

// ============================================================================
// 2. ASSET INVENTORY
// ============================================================================

const addAsset = async ({ estateId, data }: { estateId: string; data: AddAssetInput }) => {
  const res = await apiClient.post<{ id: string }>(`${BASE_URL}/${estateId}/assets`, data);
  return res.data;
};

const updateAssetValuation = async ({
  estateId,
  assetId,
  data,
}: {
  estateId: string;
  assetId: string;
  data: UpdateAssetValuationInput;
}) => {
  const res = await apiClient.patch(`${BASE_URL}/${estateId}/assets/${assetId}/valuation`, data);
  return res.data;
};

const addAssetCoOwner = async ({
  estateId,
  assetId,
  data,
}: {
  estateId: string;
  assetId: string;
  data: AddAssetCoOwnerInput;
}) => {
  const res = await apiClient.post(`${BASE_URL}/${estateId}/assets/${assetId}/co-owners`, data);
  return res.data;
};

const encumberAsset = async ({
  estateId,
  assetId,
  data,
}: {
  estateId: string;
  assetId: string;
  data: EncumberAssetInput;
}) => {
  const res = await apiClient.patch(`${BASE_URL}/${estateId}/assets/${assetId}/encumber`, data);
  return res.data;
};

const getAssets = async (estateId: string, filters?: AssetFilters): Promise<AssetInventoryResponse> => {
  const res = await apiClient.get<AssetInventoryResponse>(`${BASE_URL}/${estateId}/assets`, {
    params: filters,
  });
  return res.data;
};

const getAssetDetails = async (estateId: string, assetId: string) => {
  const res = await apiClient.get(`${BASE_URL}/${estateId}/assets/${assetId}`);
  return res.data;
};

// ============================================================================
// 3. DEBT MANAGEMENT (S.45 ENGINE)
// ============================================================================

const addDebt = async ({ estateId, data }: { estateId: string; data: AddDebtInput }) => {
  const res = await apiClient.post<{ id: string }>(`${BASE_URL}/${estateId}/debts`, data);
  return res.data;
};

const payDebt = async ({
  estateId,
  debtId,
  data,
}: {
  estateId: string;
  debtId: string;
  data: PayDebtInput;
}) => {
  const res = await apiClient.post(`${BASE_URL}/${estateId}/debts/${debtId}/pay`, data);
  return res.data;
};

const executeWaterfall = async ({
  estateId,
  data,
}: {
  estateId: string;
  data: ExecuteWaterfallInput;
}) => {
  const res = await apiClient.post(`${BASE_URL}/${estateId}/debts/waterfall`, data);
  return res.data;
};

const disputeDebt = async ({
  estateId,
  debtId,
  data,
}: {
  estateId: string;
  debtId: string;
  data: DisputeDebtInput;
}) => {
  const res = await apiClient.patch(`${BASE_URL}/${estateId}/debts/${debtId}/dispute`, data);
  return res.data;
};

const resolveDebtDispute = async ({
  estateId,
  debtId,
  data,
}: {
  estateId: string;
  debtId: string;
  data: ResolveDebtDisputeInput;
}) => {
  const res = await apiClient.patch(`${BASE_URL}/${estateId}/debts/${debtId}/resolve`, data);
  return res.data;
};

const writeOffDebt = async ({
  estateId,
  debtId,
  data,
}: {
  estateId: string;
  debtId: string;
  data: WriteOffDebtInput;
}) => {
  const res = await apiClient.patch(`${BASE_URL}/${estateId}/debts/${debtId}/write-off`, data);
  return res.data;
};

const getDebts = async (estateId: string, filters?: DebtFilters): Promise<DebtWaterfallResponse> => {
  const res = await apiClient.get<DebtWaterfallResponse>(`${BASE_URL}/${estateId}/debts`, {
    params: filters,
  });
  return res.data;
};

// ============================================================================
// 4. LIQUIDATION
// ============================================================================

const initiateLiquidation = async ({
  estateId,
  data,
}: {
  estateId: string;
  data: InitiateLiquidationInput;
}) => {
  const res = await apiClient.post(`${BASE_URL}/${estateId}/liquidation`, data);
  return res.data;
};


const approveLiquidation = async ({
  estateId,
  liquidationId,
  data,
}: {
  estateId: string;
  liquidationId: string;
  data: ApproveLiquidationInput;
}) => {
  const res = await apiClient.patch(
    `${BASE_URL}/${estateId}/liquidation/${liquidationId}/approve`,
    data,
  );
  return res.data;
};

const recordLiquidationSale = async ({
  estateId,
  liquidationId,
  data,
}: {
  estateId: string;
  liquidationId: string;
  data: RecordLiquidationSaleInput;
}) => {
  const res = await apiClient.post(
    `${BASE_URL}/${estateId}/liquidation/${liquidationId}/sale`,
    data,
  );
  return res.data;
};

const receiveLiquidationProceeds = async ({
  estateId,
  liquidationId,
  data,
}: {
  estateId: string;
  liquidationId: string;
  data: ReceiveLiquidationProceedsInput;
}) => {
  const res = await apiClient.post(
    `${BASE_URL}/${estateId}/liquidation/${liquidationId}/proceeds`,
    data,
  );
  return res.data;
};

const cancelLiquidation = async ({
  estateId,
  liquidationId,
  data,
}: {
  estateId: string;
  liquidationId: string;
  data: CancelLiquidationInput;
}) => {
  const res = await apiClient.patch(
    `${BASE_URL}/${estateId}/liquidation/${liquidationId}/cancel`,
    data,
  );
  return res.data;
};

// ============================================================================
// 5. TAX COMPLIANCE
// ============================================================================

const recordTaxAssessment = async ({
  estateId,
  data,
}: {
  estateId: string;
  data: RecordTaxAssessmentInput;
}) => {
  const res = await apiClient.post(`${BASE_URL}/${estateId}/tax/assessment`, data);
  return res.data;
};

const recordTaxPayment = async ({
  estateId,
  data,
}: {
  estateId: string;
  data: RecordTaxPaymentInput;
}) => {
  const res = await apiClient.post(`${BASE_URL}/${estateId}/tax/payment`, data);
  return res.data;
};

const uploadTaxClearance = async ({
  estateId,
  data,
}: {
  estateId: string;
  data: UploadTaxClearanceInput;
}) => {
  const res = await apiClient.post(`${BASE_URL}/${estateId}/tax/clearance`, data);
  return res.data;
};


// ============================================================================
// 6. DEPENDANTS & GIFTS
// ============================================================================

const fileDependantClaim = async ({
  estateId,
  data,
}: {
  estateId: string;
  data: FileDependantClaimInput;
}) => {
  const res = await apiClient.post(`${BASE_URL}/${estateId}/dependants`, data);
  return res.data;
};

const addDependantEvidence = async ({
  estateId,
  dependantId,
  data,
}: {
  estateId: string;
  dependantId: string;
  data: AddDependantEvidenceInput;
}) => {
  const res = await apiClient.post(
    `${BASE_URL}/${estateId}/dependants/${dependantId}/evidence`,
    data,
  );
  return res.data;
};

const verifyDependantClaim = async ({
  estateId,
  dependantId,
  data,
}: {
  estateId: string;
  dependantId: string;
  data: VerifyClaimInput;
}) => {
  const res = await apiClient.patch(
    `${BASE_URL}/${estateId}/dependants/${dependantId}/verify`,
    data,
  );
  return res.data;
};

const rejectDependantClaim = async ({
  estateId,
  dependantId,
  data,
}: {
  estateId: string;
  dependantId: string;
  data: RejectClaimInput;
}) => {
  const res = await apiClient.patch(
    `${BASE_URL}/${estateId}/dependants/${dependantId}/reject`,
    data,
  );
  return res.data;
};

const settleDependantClaim = async ({
  estateId,
  dependantId,
  data,
}: {
  estateId: string;
  dependantId: string;
  data: SettleClaimInput;
}) => {
  const res = await apiClient.post(
    `${BASE_URL}/${estateId}/dependants/${dependantId}/settle`,
    data,
  );
  return res.data;
};

const getDependants = async (
  estateId: string,
  filters?: DependantFilters,
): Promise<DependantListResponse> => {
  const res = await apiClient.get<DependantListResponse>(`${BASE_URL}/${estateId}/dependants`, {
    params: filters,
  });
  return res.data;
};

const recordGift = async ({ estateId, data }: { estateId: string; data: RecordGiftInput }) => {
  const res = await apiClient.post(`${BASE_URL}/${estateId}/gifts`, data);
  return res.data;
};

const contestGift = async ({
  estateId,
  giftId,
  data,
}: {
  estateId: string;
  giftId: string;
  data: ContestGiftInput;
}) => {
  const res = await apiClient.patch(`${BASE_URL}/${estateId}/gifts/${giftId}/contest`, data);
  return res.data;
};

const resolveGiftDispute = async ({
  estateId,
  giftId,
  data,
}: {
  estateId: string;
  giftId: string;
  data: ResolveGiftDisputeInput;
}) => {
  const res = await apiClient.patch(`${BASE_URL}/${estateId}/gifts/${giftId}/resolve`, data);
  return res.data;
};

const getGifts = async (estateId: string, filters?: GiftFilters): Promise<GiftListResponse> => {
  const res = await apiClient.get<GiftListResponse>(`${BASE_URL}/${estateId}/gifts`, {
    params: filters,
  });
  return res.data;
};

// ============================================================================
// 7. DASHBOARD & REPORTING
// ============================================================================

const getDashboard = async (estateId: string): Promise<EstateDashboardResponse> => {
  const res = await apiClient.get<EstateDashboardResponse>(`${BASE_URL}/${estateId}/dashboard`);
  return res.data;
};

const getSolvencyRadar = async (estateId: string): Promise<SolvencyRadarResponse> => {
  const res = await apiClient.get<SolvencyRadarResponse>(`${BASE_URL}/${estateId}/solvency-radar`);
  return res.data;
};

const getDistributionReadiness = async (
  estateId: string,
): Promise<DistributionPreviewResponse> => {
  const res = await apiClient.get<DistributionPreviewResponse>(
    `${BASE_URL}/${estateId}/distribution/readiness`,
  );
  return res.data;
};

// ============================================================================
// REACT QUERY HOOKS - MUTATIONS
// ============================================================================

// --- 1. Lifecycle ---
export const useCreateEstate = (options?: { onSuccess?: (data: { id: string }) => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEstate,
    onSuccess: (data) => {
      toast.success('Estate Created', { description: 'Estate ledger initialized successfully' });
      queryClient.invalidateQueries({ queryKey: estateKeys.all });
      options?.onSuccess?.(data);
    },
    onError: (err) => toast.error('Failed to create estate', { description: extractErrorMessage(err) }),
  });
};

export const useFreezeEstate = (estateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FreezeEstateInput) => freezeEstate({ estateId, data }),
    onSuccess: () => {
      toast.warning('Estate Frozen', { description: 'All operations blocked pending resolution' });
      queryClient.invalidateQueries({ queryKey: estateKeys.detail(estateId) });
    },
    onError: (err) => toast.error('Failed to freeze estate', { description: extractErrorMessage(err) }),
  });
};

export const useUnfreezeEstate = (estateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UnfreezeEstateInput) => unfreezeEstate({ estateId, data }),
    onSuccess: () => {
      toast.success('Estate Unfrozen', { description: 'Operations resumed' });
      queryClient.invalidateQueries({ queryKey: estateKeys.detail(estateId) });
    },
    onError: (err) => toast.error('Failed to unfreeze estate', { description: extractErrorMessage(err) }),
  });
};

export const useCloseEstate = (estateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CloseEstateInput) => closeEstate({ estateId, data }),
    onSuccess: () => {
      toast.success('Estate Closed', { description: 'Administration finalized' });
      queryClient.invalidateQueries({ queryKey: estateKeys.detail(estateId) });
    },
    onError: (err) => toast.error('Failed to close estate', { description: extractErrorMessage(err) }),
  });
};

// --- 2. Assets ---
export const useAddAsset = (estateId: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddAssetInput) => addAsset({ estateId, data }),
    onSuccess: () => {
      toast.success('Asset Added', { description: 'Inventory updated' });
      queryClient.invalidateQueries({ queryKey: estateKeys.assets(estateId) });
      queryClient.invalidateQueries({ queryKey: estateKeys.dashboard(estateId) });
      queryClient.invalidateQueries({ queryKey: estateKeys.radar(estateId) });
      options?.onSuccess?.();
    },
    onError: (err) => toast.error('Failed to add asset', { description: extractErrorMessage(err) }),
  });
};

export const useUpdateAssetValuation = (estateId: string, assetId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateAssetValuationInput) =>
      updateAssetValuation({ estateId, assetId, data }),
    onSuccess: () => {
      toast.success('Valuation Updated');
      queryClient.invalidateQueries({ queryKey: estateKeys.asset(estateId, assetId) });
      queryClient.invalidateQueries({ queryKey: estateKeys.assets(estateId) });
      queryClient.invalidateQueries({ queryKey: estateKeys.dashboard(estateId) });
    },
    onError: (err) => toast.error('Failed to update valuation', { description: extractErrorMessage(err) }),
  });
};

export const useAddAssetCoOwner = (estateId: string, assetId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddAssetCoOwnerInput) => addAssetCoOwner({ estateId, assetId, data }),
    onSuccess: () => {
      toast.success('Co-Owner Added');
      queryClient.invalidateQueries({ queryKey: estateKeys.asset(estateId, assetId) });
      queryClient.invalidateQueries({ queryKey: estateKeys.assets(estateId) });
    },
    onError: (err) => toast.error('Failed to add co-owner', { description: extractErrorMessage(err) }),
  });
};

export const useEncumberAsset = (estateId: string, assetId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EncumberAssetInput) => encumberAsset({ estateId, assetId, data }),
    onSuccess: () => {
      toast.info('Asset Encumbered', { description: 'Marked as collateral' });
      queryClient.invalidateQueries({ queryKey: estateKeys.asset(estateId, assetId) });
      queryClient.invalidateQueries({ queryKey: estateKeys.assets(estateId) });
    },
    onError: (err) => toast.error('Failed to encumber asset', { description: extractErrorMessage(err) }),
  });
};

// --- 3. Debts ---
export const useAddDebt = (estateId: string, options?: { onSuccess?: () => void }) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddDebtInput) => addDebt({ estateId, data }),
    onSuccess: () => {
      toast.success('Liability Recorded');
      queryClient.invalidateQueries({ queryKey: estateKeys.debts(estateId) });
      queryClient.invalidateQueries({ queryKey: estateKeys.dashboard(estateId) });
      queryClient.invalidateQueries({ queryKey: estateKeys.radar(estateId) });
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
    onError: (err) => toast.error('Failed to record payment', { description: extractErrorMessage(err) }),
  });
};

export const useExecuteWaterfall = (estateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ExecuteWaterfallInput) => executeWaterfall({ estateId, data }),
    onSuccess: () => {
      toast.success('S.45 Waterfall Executed', { description: 'Priority debts paid' });
      queryClient.invalidateQueries({ queryKey: estateKeys.debts(estateId) });
      queryClient.invalidateQueries({ queryKey: estateKeys.dashboard(estateId) });
    },
    onError: (err) => toast.error('Waterfall execution failed', { description: extractErrorMessage(err) }),
  });
};

export const useDisputeDebt = (estateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ debtId, data }: { debtId: string; data: DisputeDebtInput }) =>
      disputeDebt({ estateId, debtId, data }),
    onSuccess: () => {
      toast.warning('Debt Disputed', { description: 'Marked for review' });
      queryClient.invalidateQueries({ queryKey: estateKeys.debts(estateId) });
    },
    onError: (err) => toast.error('Failed to dispute debt', { description: extractErrorMessage(err) }),
  });
};

export const useResolveDebtDispute = (estateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ debtId, data }: { debtId: string; data: ResolveDebtDisputeInput }) =>
      resolveDebtDispute({ estateId, debtId, data }),
    onSuccess: () => {
      toast.success('Dispute Resolved');
      queryClient.invalidateQueries({ queryKey: estateKeys.debts(estateId) });
    },
    onError: (err) => toast.error('Failed to resolve dispute', { description: extractErrorMessage(err) }),
  });
};

export const useWriteOffDebt = (estateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ debtId, data }: { debtId: string; data: WriteOffDebtInput }) =>
      writeOffDebt({ estateId, debtId, data }),
    onSuccess: () => {
      toast.info('Debt Written Off');
      queryClient.invalidateQueries({ queryKey: estateKeys.debts(estateId) });
      queryClient.invalidateQueries({ queryKey: estateKeys.dashboard(estateId) });
    },
    onError: (err) => toast.error('Failed to write off debt', { description: extractErrorMessage(err) }),
  });
};

// --- 4. Liquidation ---
export const useInitiateLiquidation = (estateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InitiateLiquidationInput) => initiateLiquidation({ estateId, data }),
    onSuccess: () => {
      toast.info('Liquidation Initiated', { description: 'Asset marked for sale' });
      queryClient.invalidateQueries({ queryKey: estateKeys.liquidations(estateId) });
      queryClient.invalidateQueries({ queryKey: estateKeys.assets(estateId) });
    },
    onError: (err) => toast.error('Failed to initiate liquidation', { description: extractErrorMessage(err) }),
  });
};

export const useApproveLiquidation = (estateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ liquidationId, data }: { liquidationId: string; data: ApproveLiquidationInput }) =>
      approveLiquidation({ estateId, liquidationId, data }),
    onSuccess: () => {
      toast.success('Liquidation Approved');
      queryClient.invalidateQueries({ queryKey: estateKeys.liquidations(estateId) });
    },
    onError: (err) => toast.error('Approval failed', { description: extractErrorMessage(err) }),
  });
};

export const useRecordLiquidationSale = (estateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ liquidationId, data }: { liquidationId: string; data: RecordLiquidationSaleInput }) =>
      recordLiquidationSale({ estateId, liquidationId, data }),
    onSuccess: () => {
      toast.success('Sale Recorded');
      queryClient.invalidateQueries({ queryKey: estateKeys.liquidations(estateId) });
      queryClient.invalidateQueries({ queryKey: estateKeys.assets(estateId) });
    },
    onError: (err) => toast.error('Failed to record sale', { description: extractErrorMessage(err) }),
  });
};

export const useReceiveLiquidationProceeds = (estateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      liquidationId,
      data,
    }: {
      liquidationId: string;
      data: ReceiveLiquidationProceedsInput;
    }) => receiveLiquidationProceeds({ estateId, liquidationId, data }),
    onSuccess: () => {
      toast.success('Proceeds Received', { description: 'Cash updated' });
      queryClient.invalidateQueries({ queryKey: estateKeys.liquidations(estateId) });
      queryClient.invalidateQueries({ queryKey: estateKeys.dashboard(estateId) });
    },
    onError: (err) => toast.error('Failed to record proceeds', { description: extractErrorMessage(err) }),
  });
};

export const useCancelLiquidation = (estateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ liquidationId, data }: { liquidationId: string; data: CancelLiquidationInput }) =>
      cancelLiquidation({ estateId, liquidationId, data }),
    onSuccess: () => {
      toast.info('Liquidation Cancelled');
      queryClient.invalidateQueries({ queryKey: estateKeys.liquidations(estateId) });
    },
    onError: (err) => toast.error('Failed to cancel', { description: extractErrorMessage(err) }),
  });
};

// --- 5. Tax ---
export const useRecordTaxAssessment = (estateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RecordTaxAssessmentInput) => recordTaxAssessment({ estateId, data }),
    onSuccess: () => {
      toast.info('Tax Assessment Recorded');
      queryClient.invalidateQueries({ queryKey: estateKeys.dashboard(estateId) });
    },
    onError: (err) => toast.error('Failed to record assessment', { description: extractErrorMessage(err) }),
  });
};

export const useRecordTaxPayment = (estateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RecordTaxPaymentInput) => recordTaxPayment({ estateId, data }),
    onSuccess: () => {
      toast.success('Tax Payment Recorded');
      queryClient.invalidateQueries({ queryKey: estateKeys.dashboard(estateId) });
    },
    onError: (err) => toast.error('Failed to record payment', { description: extractErrorMessage(err) }),
  });
};

export const useUploadTaxClearance = (estateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UploadTaxClearanceInput) => uploadTaxClearance({ estateId, data }),
    onSuccess: () => {
      toast.success('Tax Clearance Uploaded', { description: 'Compliance updated' });
      queryClient.invalidateQueries({ queryKey: estateKeys.dashboard(estateId) });
    },
    onError: (err) => toast.error('Failed to upload clearance', { description: extractErrorMessage(err) }),
  });
};

// --- 6. Dependants ---
export const useFileDependantClaim = (estateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FileDependantClaimInput) => fileDependantClaim({ estateId, data }),
    onSuccess: () => {
      toast.success('S.29 Claim Filed');
      queryClient.invalidateQueries({ queryKey: estateKeys.dependants(estateId) });
    },
    onError: (err) => toast.error('Failed to file claim', { description: extractErrorMessage(err) }),
  });
};

export const useAddDependantEvidence = (estateId: string, dependantId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddDependantEvidenceInput) =>
      addDependantEvidence({ estateId, dependantId, data }),
    onSuccess: () => {
      toast.success('Evidence Added');
      queryClient.invalidateQueries({ queryKey: estateKeys.dependants(estateId) });
    },
    onError: (err) => toast.error('Failed to add evidence', { description: extractErrorMessage(err) }),
  });
};

export const useVerifyDependantClaim = (estateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dependantId, data }: { dependantId: string; data: VerifyClaimInput }) =>
      verifyDependantClaim({ estateId, dependantId, data }),
    onSuccess: () => {
      toast.success('Claim Verified');
      queryClient.invalidateQueries({ queryKey: estateKeys.dependants(estateId) });
    },
    onError: (err) => toast.error('Failed to verify claim', { description: extractErrorMessage(err) }),
  });
};

export const useRejectDependantClaim = (estateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dependantId, data }: { dependantId: string; data: RejectClaimInput }) =>
      rejectDependantClaim({ estateId, dependantId, data }),
    onSuccess: () => {
      toast.warning('Claim Rejected');
      queryClient.invalidateQueries({ queryKey: estateKeys.dependants(estateId) });
    },
    onError: (err) => toast.error('Failed to reject claim', { description: extractErrorMessage(err) }),
  });
};

export const useSettleDependantClaim = (estateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ dependantId, data }: { dependantId: string; data: SettleClaimInput }) =>
      settleDependantClaim({ estateId, dependantId, data }),
    onSuccess: () => {
      toast.success('Claim Settled', { description: 'Allocation recorded' });
      queryClient.invalidateQueries({ queryKey: estateKeys.dependants(estateId) });
      queryClient.invalidateQueries({ queryKey: estateKeys.dashboard(estateId) });
    },
    onError: (err) => toast.error('Failed to settle claim', { description: extractErrorMessage(err) }),
  });
};

// --- 7. Gifts ---
export const useRecordGift = (estateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RecordGiftInput) => recordGift({ estateId, data }),
    onSuccess: () => {
      toast.success('S.35 Gift Recorded', { description: 'Hotchpot updated' });
      queryClient.invalidateQueries({ queryKey: estateKeys.gifts(estateId) });
      queryClient.invalidateQueries({ queryKey: estateKeys.distribution(estateId) });
    },
    onError: (err) => toast.error('Failed to record gift', { description: extractErrorMessage(err) }),
  });
};

export const useContestGift = (estateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ giftId, data }: { giftId: string; data: ContestGiftInput }) =>
      contestGift({ estateId, giftId, data }),
    onSuccess: () => {
      toast.warning('Gift Contested');
      queryClient.invalidateQueries({ queryKey: estateKeys.gifts(estateId) });
    },
    onError: (err) => toast.error('Failed to contest gift', { description: extractErrorMessage(err) }),
  });
};

export const useResolveGiftDispute = (estateId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ giftId, data }: { giftId: string; data: ResolveGiftDisputeInput }) =>
      resolveGiftDispute({ estateId, giftId, data }),
    onSuccess: () => {
      toast.success('Gift Dispute Resolved');
      queryClient.invalidateQueries({ queryKey: estateKeys.gifts(estateId) });
      queryClient.invalidateQueries({ queryKey: estateKeys.distribution(estateId) });
    },
    onError: (err) => toast.error('Failed to resolve dispute', { description: extractErrorMessage(err) }),
  });
};

// ============================================================================
// REACT QUERY HOOKS - QUERIES
// ============================================================================

// --- Dashboard & Analytics ---
export const useEstateDashboard = (estateId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: estateKeys.dashboard(estateId),
    queryFn: () => getDashboard(estateId),
    enabled: options?.enabled !== false && !!estateId,
    staleTime: 30000, // 30 seconds - financial data changes frequently
  });
};

export const useSolvencyRadar = (estateId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: estateKeys.radar(estateId),
    queryFn: () => getSolvencyRadar(estateId),
    enabled: options?.enabled !== false && !!estateId,
    staleTime: 30000,
  });
};

export const useDistributionReadiness = (estateId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: estateKeys.distribution(estateId),
    queryFn: () => getDistributionReadiness(estateId),
    enabled: options?.enabled !== false && !!estateId,
    staleTime: 60000, // 1 minute
  });
};

// --- Assets ---
export const useAssetInventory = (
  estateId: string,
  filters?: AssetFilters,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: [...estateKeys.assets(estateId), filters],
    queryFn: () => getAssets(estateId, filters),
    enabled: options?.enabled !== false && !!estateId,
    staleTime: 60000,
  });
};

export const useAssetDetails = (
  estateId: string,
  assetId: string,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: estateKeys.asset(estateId, assetId),
    queryFn: () => getAssetDetails(estateId, assetId),
    enabled: options?.enabled !== false && !!estateId && !!assetId,
  });
};

// --- Debts ---
export const useDebtWaterfall = (
  estateId: string,
  filters?: DebtFilters,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: [...estateKeys.debts(estateId), filters],
    queryFn: () => getDebts(estateId, filters),
    enabled: options?.enabled !== false && !!estateId,
    staleTime: 30000,
  });
};

// --- Dependants ---
export const useDependantList = (
  estateId: string,
  filters?: DependantFilters,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: [...estateKeys.dependants(estateId), filters],
    queryFn: () => getDependants(estateId, filters),
    enabled: options?.enabled !== false && !!estateId,
  });
};

// --- Gifts ---
export const useGiftList = (
  estateId: string,
  filters?: GiftFilters,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: [...estateKeys.gifts(estateId), filters],
    queryFn: () => getGifts(estateId, filters),
    enabled: options?.enabled !== false && !!estateId,
  });
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Prefetch estate dashboard data for faster navigation
 */
export const usePrefetchEstateDashboard = () => {
  const queryClient = useQueryClient();

  return (estateId: string) => {
    queryClient.prefetchQuery({
      queryKey: estateKeys.dashboard(estateId),
      queryFn: () => getDashboard(estateId),
      staleTime: 30000,
    });
  };
};

/**
 * Invalidate all estate-related queries (useful after major state changes)
 */
export const useInvalidateEstate = () => {
  const queryClient = useQueryClient();

  return (estateId: string) => {
    queryClient.invalidateQueries({ queryKey: estateKeys.detail(estateId) });
  };
};

/**
 * Get cached estate dashboard without refetching
 */
export const useEstateDashboardCache = (estateId: string) => {
  const queryClient = useQueryClient();
  return queryClient.getQueryData<EstateDashboardResponse>(estateKeys.dashboard(estateId));
};