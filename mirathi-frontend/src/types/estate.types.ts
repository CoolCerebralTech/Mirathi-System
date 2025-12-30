import { z } from 'zod';

// ============================================================================
// 1. SHARED VALUE OBJECTS & ENUMS
// ============================================================================

export const AssetType = {
  LAND: 'LAND',
  VEHICLE: 'VEHICLE',
  FINANCIAL: 'FINANCIAL',
  BUSINESS: 'BUSINESS',
  PERSONAL: 'PERSONAL',
  DIGITAL: 'DIGITAL',
  INSURANCE: 'INSURANCE',
} as const;
export type AssetType = (typeof AssetType)[keyof typeof AssetType];

export const AssetStatus = {
  ACTIVE: 'ACTIVE',
  SOLD: 'SOLD',
  DISTRIBUTED: 'DISTRIBUTED',
  DISPUTED: 'DISPUTED',
  LOST: 'LOST',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  VERIFIED: 'VERIFIED',
} as const;
export type AssetStatus = (typeof AssetStatus)[keyof typeof AssetStatus];

export const DebtType = {
  FUNERAL_EXPENSES: 'FUNERAL_EXPENSES',
  TESTAMENTARY_EXPENSES: 'TESTAMENTARY_EXPENSES',
  SECURED_LOAN: 'SECURED_LOAN',
  MORTGAGE: 'MORTGAGE',
  BUSINESS_LOAN: 'BUSINESS_LOAN',
  TAX_ARREARS: 'TAX_ARREARS',
  UNSECURED_LOAN: 'UNSECURED_LOAN',
  MEDICAL_BILL: 'MEDICAL_BILL',
} as const;
export type DebtType = (typeof DebtType)[keyof typeof DebtType];

export const DebtStatus = {
  PENDING: 'PENDING',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  DISPUTED: 'DISPUTED',
  WRITTEN_OFF: 'WRITTEN_OFF',
} as const;
export type DebtStatus = (typeof DebtStatus)[keyof typeof DebtStatus];

export const EstateStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  FROZEN: 'FROZEN',
  DISTRIBUTING: 'DISTRIBUTING',
  CLOSED: 'CLOSED',
} as const;
export type EstateStatus = (typeof EstateStatus)[keyof typeof EstateStatus];

export const ValuationSource = {
  USER_ESTIMATE: 'USER_ESTIMATE',
  MARKET_DATA: 'MARKET_DATA',
  REGISTERED_VALUER: 'REGISTERED_VALUER',
  GOVT_RATE_CARD: 'GOVT_RATE_CARD',
} as const;
export type ValuationSource = (typeof ValuationSource)[keyof typeof ValuationSource];

export const CoOwnershipType = {
  JOINT_TENANCY: 'JOINT_TENANCY',
  TENANCY_IN_COMMON: 'TENANCY_IN_COMMON',
  COMMUNITY_PROPERTY: 'COMMUNITY_PROPERTY',
} as const;
export type CoOwnershipType = (typeof CoOwnershipType)[keyof typeof CoOwnershipType];

export const LiquidationType = {
  PUBLIC_AUCTION: 'PUBLIC_AUCTION',
  PRIVATE_TREATY: 'PRIVATE_TREATY',
  SALE_ON_OPEN_MARKET: 'SALE_ON_OPEN_MARKET',
} as const;
export type LiquidationType = (typeof LiquidationType)[keyof typeof LiquidationType];

export const DependantRelationship = {
  CHILD: 'CHILD',
  SPOUSE: 'SPOUSE',
  PARENT: 'PARENT',
  GRANDCHILD: 'GRANDCHILD',
  OTHER: 'OTHER',
} as const;
export type DependantRelationship = (typeof DependantRelationship)[keyof typeof DependantRelationship];

export const DependantStatus = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  SETTLED: 'SETTLED',
} as const;
export type DependantStatus = (typeof DependantStatus)[keyof typeof DependantStatus];

export const GiftStatus = {
  RECORDED: 'RECORDED',
  CONTESTED: 'CONTESTED',
  VERIFIED: 'VERIFIED',
  EXCLUDED: 'EXCLUDED',
} as const;
export type GiftStatus = (typeof GiftStatus)[keyof typeof GiftStatus];

export const EvidenceType = {
  BIRTH_CERTIFICATE: 'BIRTH_CERTIFICATE',
  MARRIAGE_CERTIFICATE: 'MARRIAGE_CERTIFICATE',
  SCHOOL_FEES_RECEIPT: 'SCHOOL_FEES_RECEIPT',
  MEDICAL_REPORT: 'MEDICAL_REPORT',
  AFFIDAVIT: 'AFFIDAVIT',
  OTHER: 'OTHER',
} as const;
export type EvidenceType = (typeof EvidenceType)[keyof typeof EvidenceType];

// Money Helper
const MoneySchema = z.object({
  amount: z.number().min(0),
  currency: z.string().length(3).default('KES'),
});

// ============================================================================
// 2. REQUEST SCHEMAS (Forms)
// ============================================================================

// --- Lifecycle ---
export const CreateEstateRequestSchema = z.object({
  name: z.string().min(2, 'Estate name must be at least 2 characters'),
  deceasedId: z.string().uuid('Invalid deceased ID'),
  deceasedName: z.string().min(1, 'Deceased name is required'),
  dateOfDeath: z.string().datetime('Invalid date format'),
  kraPin: z.string().regex(/^[A-Z]\d{9}[A-Z]$/, 'Invalid KRA PIN format (e.g., A123456789Z)'),
  executorId: z.string().uuid('Invalid executor ID'),
  courtCaseNumber: z.string().optional(),
  initialCash: MoneySchema.optional(),
});

export const FreezeEstateRequestSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  courtOrderReference: z.string().optional(),
  frozenAt: z.string().datetime().optional(),
});

export const UnfreezeEstateRequestSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  resolutionReference: z.string().optional(),
  unfrozenAt: z.string().datetime().optional(),
});

export const CloseEstateRequestSchema = z.object({
  closureNotes: z.string().optional(),
  closedAt: z.string().datetime().optional(),
});

// --- Asset Details (Polymorphic) ---
const LandDetailsSchema = z.object({
  titleDeedNumber: z.string().min(1, 'Title deed number is required'),
  landReferenceNumber: z.string().min(1, 'Land reference number is required'),
  county: z.string().min(1, 'County is required'),
  subCounty: z.string().optional(),
  locationDescription: z.string().optional(),
  acreage: z.number().min(0.01, 'Acreage must be at least 0.01'),
  landUse: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'AGRICULTURAL']),
  registeredOwner: z.string().min(1, 'Registered owner is required'),
});

const VehicleDetailsSchema = z.object({
  registrationNumber: z.string().regex(/^[A-Z0-9\s]+$/, 'Invalid registration number'),
  chassisNumber: z.string().min(5, 'Chassis number must be at least 5 characters'),
  logbookNumber: z.string().optional(),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().int().min(1900, 'Year must be 1900 or later'),
  engineNumber: z.string().optional(),
  color: z.string().optional(),
});

const FinancialDetailsSchema = z.object({
  institutionName: z.string().min(1, 'Institution name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  accountType: z.string().min(1, 'Account type is required'),
  branchName: z.string().optional(),
  accountHolderName: z.string().min(1, 'Account holder name is required'),
  isJointAccount: z.boolean(),
  jointAccountHolders: z.array(z.string()).optional(),
  currency: z.string().regex(/^[A-Z]{3}$/, 'Currency must be a 3-letter ISO code'),
});

const BusinessDetailsSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  businessType: z.enum(['SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'LIMITED_COMPANY', 'LLP']),
  shareholdingPercentage: z.number().min(0).max(100, 'Percentage must be between 0 and 100'),
  numberOfShares: z.number().int().positive().optional(),
  registeredAddress: z.string().optional(),
});

// --- Assets ---
export const AddAssetRequestSchema = z.object({
  name: z.string().min(1, 'Asset name is required'),
  type: z.nativeEnum(AssetType),
  currentValue: MoneySchema,
  description: z.string().optional(),
  location: z.string().optional(),
  purchaseDate: z.string().datetime().optional(),
  landDetails: LandDetailsSchema.optional(),
  vehicleDetails: VehicleDetailsSchema.optional(),
  financialDetails: FinancialDetailsSchema.optional(),
  businessDetails: BusinessDetailsSchema.optional(),
});

export const UpdateAssetValuationRequestSchema = z.object({
  newValue: MoneySchema,
  source: z.nativeEnum(ValuationSource),
  reason: z.string().min(1, 'Reason is required'),
});

export const AddAssetCoOwnerRequestSchema = z.object({
  familyMemberId: z.string().uuid('Invalid family member ID'),
  sharePercentage: z.number().min(0.01).max(100, 'Share percentage must be between 0.01 and 100'),
  ownershipType: z.nativeEnum(CoOwnershipType),
  evidenceUrl: z.string().url('Invalid URL').optional(),
});

export const EncumberAssetRequestSchema = z.object({
  debtId: z.string().uuid('Invalid debt ID'),
  encumbranceDetails: z.string().min(1, 'Encumbrance details are required'),
});

// --- Debts ---
export const AddDebtRequestSchema = z.object({
  creditorName: z.string().min(1, 'Creditor name is required'),
  description: z.string().min(1, 'Description is required'),
  initialAmount: MoneySchema,
  type: z.nativeEnum(DebtType),
  securedAssetId: z.string().uuid().optional(),
  referenceNumber: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

export const PayDebtRequestSchema = z.object({
  amount: MoneySchema,
  paymentMethod: z.string().min(1, 'Payment method is required'),
  reference: z.string().optional(),
});

export const ExecuteWaterfallRequestSchema = z.object({
  availableCash: MoneySchema,
});

export const DisputeDebtRequestSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  evidenceDocumentId: z.string().optional(),
});

export const ResolveDebtDisputeRequestSchema = z.object({
  resolution: z.string().min(1, 'Resolution is required'),
  negotiatedAmount: MoneySchema.optional(),
});

export const WriteOffDebtRequestSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
  amountToWriteOff: MoneySchema.optional(),
});

// --- Liquidation ---
export const InitiateLiquidationRequestSchema = z.object({
  assetId: z.string().uuid('Invalid asset ID'),
  liquidationType: z.nativeEnum(LiquidationType),
  targetAmount: MoneySchema,
  reason: z.string().min(1, 'Reason is required'),
});

export const ApproveLiquidationRequestSchema = z.object({
  courtOrderReference: z.string().min(1, 'Court order reference is required'),
});

export const RecordLiquidationSaleRequestSchema = z.object({
  actualAmount: MoneySchema,
  saleDate: z.string().datetime(),
  buyerName: z.string().optional(),
  buyerIdNumber: z.string().optional(),
});

export const ReceiveLiquidationProceedsRequestSchema = z.object({
  netProceeds: MoneySchema,
  receivedDate: z.string().datetime(),
  bankReference: z.string().optional(),
});

export const CancelLiquidationRequestSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

// --- Tax ---
export const RecordTaxAssessmentRequestSchema = z.object({
  assessmentReference: z.string().min(1, 'Assessment reference is required'),
  assessmentDate: z.string().datetime(),
  incomeTax: MoneySchema.optional(),
  capitalGainsTax: MoneySchema.optional(),
  stampDuty: MoneySchema.optional(),
});

export const RecordTaxPaymentRequestSchema = z.object({
  amount: MoneySchema,
  paymentType: z.string().min(1, 'Payment type is required'),
  paymentReference: z.string().min(1, 'Payment reference is required'),
  paymentDate: z.string().datetime(),
});

export const UploadTaxClearanceRequestSchema = z.object({
  certificateNumber: z.string().min(1, 'Certificate number is required'),
  clearanceDate: z.string().datetime(),
  documentUrl: z.string().url('Invalid URL').optional(),
});

export const ApplyForTaxExemptionRequestSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
  supportingDocumentUrl: z.string().url('Invalid URL').optional(),
});

// --- Dependants ---
export const FileDependantClaimRequestSchema = z.object({
  dependantId: z.string().min(1, 'Dependant ID is required'),
  dependantName: z.string().min(1, 'Dependant name is required'),
  relationship: z.nativeEnum(DependantRelationship),
  dateOfBirth: z.string().datetime().optional(),
  isIncapacitated: z.boolean(),
  hasDisability: z.boolean(),
  monthlyMaintenanceNeeds: MoneySchema,
  custodialParentId: z.string().optional(),
});

export const AddDependantEvidenceRequestSchema = z.object({
  type: z.nativeEnum(EvidenceType),
  documentUrl: z.string().url('Invalid URL'),
  description: z.string().min(1, 'Description is required'),
});

export const VerifyClaimRequestSchema = z.object({
  verificationNotes: z.string().min(1, 'Verification notes are required'),
});

export const RejectClaimRequestSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
});

export const SettleClaimRequestSchema = z.object({
  allocation: MoneySchema,
  settlementMethod: z.string().optional(),
});

// --- Gifts ---
export const RecordGiftRequestSchema = z.object({
  recipientId: z.string().min(1, 'Recipient ID is required'),
  description: z.string().min(1, 'Description is required'),
  assetType: z.nativeEnum(AssetType),
  valueAtTimeOfGift: MoneySchema,
  dateGiven: z.string().datetime(),
  isFormalGift: z.boolean(),
  deedReference: z.string().optional(),
});

export const ContestGiftRequestSchema = z.object({
  reason: z.string().min(1, 'Reason is required'),
});

export const ResolveGiftDisputeRequestSchema = z.object({
  outcome: z.nativeEnum(GiftStatus),
  resolutionDetails: z.string().min(1, 'Resolution details are required'),
  courtOrderReference: z.string().optional(),
});

// ============================================================================
// 3. RESPONSE INTERFACES
// ============================================================================

export interface Money {
  amount: number;
  currency: string;
  formatted: string;
}

// --- Dashboard ---
export interface EstateDashboardResponse {
  id: string;
  name: string;
  deceasedName: string;
  dateOfDeath: Date;
  daysSinceDeath: number;
  status: EstateStatus;
  isFrozen: boolean;
  freezeReason?: string;

  // Financials
  netWorth: Money;
  grossAssets: Money;
  totalLiabilities: Money;
  cashOnHand: Money;
  cashReserved: Money;
  availableCash: Money;

  // Analysis
  solvencyRatio: number;
  isSolvent: boolean;
  taxStatus: string;
  administrationProgress: number;
}

// --- Solvency Radar ---
export interface LiquidityAnalysis {
  liquidCash: Money;
  immediateObligations: Money;
  cashShortfall: Money;
  liquidityRatio: number;
  isLiquid: boolean;
}

export interface AssetComposition {
  liquidPercentage: number;
  realEstatePercentage: number;
  businessPercentage: number;
}

export interface SolvencyRadarResponse {
  estateId: string;
  generatedAt: Date;
  healthScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  netPosition: Money;
  liquidityAnalysis: LiquidityAnalysis;
  assetComposition: AssetComposition;
  alerts: string[];
  recommendations: string[];
}

// --- Assets ---
export interface AssetItemResponse {
  id: string;
  name: string;
  type: AssetType;
  description?: string;
  currentValue: Money;
  status: AssetStatus;
  isEncumbered: boolean;
  encumbranceDetails?: string;
  isCoOwned: boolean;
  estateSharePercentage: number;
  identifier: string;
  location?: string;
}

export interface AssetInventoryResponse {
  items: AssetItemResponse[];
  totalValue: Money;
  totalCount: number;
  liquidAssetsValue: Money;
}

// --- Debts ---
export interface DebtItemResponse {
  id: string;
  creditorName: string;
  description: string;
  originalAmount: Money;
  outstandingAmount: Money;
  priorityTier: number;
  tierName: string;
  status: DebtStatus;
  isSecured: boolean;
  dueDate?: Date;
}

export interface DebtWaterfallResponse {
  tier1_FuneralExpenses: DebtItemResponse[];
  tier2_Testamentary: DebtItemResponse[];
  tier3_SecuredDebts: DebtItemResponse[];
  tier4_TaxesAndWages: DebtItemResponse[];
  tier5_Unsecured: DebtItemResponse[];
  totalLiabilities: Money;
  totalPaid: Money;
  highestPriorityOutstanding: number;
  canPayNextTier: boolean;
}

// --- Dependants ---
export interface DependantItemResponse {
  id: string;
  name: string;
  relationship: DependantRelationship;
  status: DependantStatus;
  isMinor: boolean;
  age?: number;
  isIncapacitated: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  monthlyMaintenanceNeeds: Money;
  proposedAllocation?: Money;
  evidenceCount: number;
  hasSufficientEvidence: boolean;
}

export interface DependantListResponse {
  items: DependantItemResponse[];
  totalMonthlyNeeds: Money;
  highRiskCount: number;
}

// --- Gifts ---
export interface GiftItemResponse {
  id: string;
  recipientId: string;
  description: string;
  assetType: AssetType;
  valueAtTimeOfGift: Money;
  hotchpotValue: Money;
  status: GiftStatus;
  isContested: boolean;
  isSubjectToHotchpot: boolean;
  dateGiven: Date;
}

export interface GiftListResponse {
  items: GiftItemResponse[];
  totalHotchpotAddBack: Money;
}

// --- Distribution ---
export interface BeneficiaryShare {
  beneficiaryId: string;
  beneficiaryName: string;
  relationship: string;
  grossSharePercentage: number;
  grossShareValue: Money;
  lessGiftInterVivos: Money;
  netDistributableValue: Money;
}

export interface ReadinessCheck {
  isReady: boolean;
  blockers: string[];
}

export interface DistributionPreviewResponse {
  estateNetValue: Money;
  totalDistributablePool: Money;
  shares: BeneficiaryShare[];
  readinessCheck: ReadinessCheck;
}

// ============================================================================
// 4. INFERRED INPUT TYPES
// ============================================================================
export type CreateEstateInput = z.infer<typeof CreateEstateRequestSchema>;
export type FreezeEstateInput = z.infer<typeof FreezeEstateRequestSchema>;
export type UnfreezeEstateInput = z.infer<typeof UnfreezeEstateRequestSchema>;
export type CloseEstateInput = z.infer<typeof CloseEstateRequestSchema>;

export type AddAssetInput = z.infer<typeof AddAssetRequestSchema>;
export type UpdateAssetValuationInput = z.infer<typeof UpdateAssetValuationRequestSchema>;
export type AddAssetCoOwnerInput = z.infer<typeof AddAssetCoOwnerRequestSchema>;
export type EncumberAssetInput = z.infer<typeof EncumberAssetRequestSchema>;

export type AddDebtInput = z.infer<typeof AddDebtRequestSchema>;
export type PayDebtInput = z.infer<typeof PayDebtRequestSchema>;
export type ExecuteWaterfallInput = z.infer<typeof ExecuteWaterfallRequestSchema>;
export type DisputeDebtInput = z.infer<typeof DisputeDebtRequestSchema>;
export type ResolveDebtDisputeInput = z.infer<typeof ResolveDebtDisputeRequestSchema>;
export type WriteOffDebtInput = z.infer<typeof WriteOffDebtRequestSchema>;

export type InitiateLiquidationInput = z.infer<typeof InitiateLiquidationRequestSchema>;
export type ApproveLiquidationInput = z.infer<typeof ApproveLiquidationRequestSchema>;
export type RecordLiquidationSaleInput = z.infer<typeof RecordLiquidationSaleRequestSchema>;
export type ReceiveLiquidationProceedsInput = z.infer<typeof ReceiveLiquidationProceedsRequestSchema>;
export type CancelLiquidationInput = z.infer<typeof CancelLiquidationRequestSchema>;

export type RecordTaxAssessmentInput = z.infer<typeof RecordTaxAssessmentRequestSchema>;
export type RecordTaxPaymentInput = z.infer<typeof RecordTaxPaymentRequestSchema>;
export type UploadTaxClearanceInput = z.infer<typeof UploadTaxClearanceRequestSchema>;
export type ApplyForTaxExemptionInput = z.infer<typeof ApplyForTaxExemptionRequestSchema>;

export type FileDependantClaimInput = z.infer<typeof FileDependantClaimRequestSchema>;
export type AddDependantEvidenceInput = z.infer<typeof AddDependantEvidenceRequestSchema>;
export type VerifyClaimInput = z.infer<typeof VerifyClaimRequestSchema>;
export type RejectClaimInput = z.infer<typeof RejectClaimRequestSchema>;
export type SettleClaimInput = z.infer<typeof SettleClaimRequestSchema>;

export type RecordGiftInput = z.infer<typeof RecordGiftRequestSchema>;
export type ContestGiftInput = z.infer<typeof ContestGiftRequestSchema>;
export type ResolveGiftDisputeInput = z.infer<typeof ResolveGiftDisputeRequestSchema>;

// ============================================================================
// 5. QUERY FILTER TYPES
// ============================================================================
export interface AssetFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  type?: AssetType;
  status?: AssetStatus;
  isEncumbered?: boolean;
}

export interface DebtFilters {
  page?: number;
  limit?: number;
  sortOrder?: 'ASC' | 'DESC';
  status?: DebtStatus;
  priorityTier?: number;
}

export interface DependantFilters {
  page?: number;
  limit?: number;
  sortOrder?: 'ASC' | 'DESC';
  status?: DependantStatus;
  relationship?: DependantRelationship;
}

export interface GiftFilters {
  page?: number;
  limit?: number;
  sortOrder?: 'ASC' | 'DESC';
  status?: GiftStatus;
  isContested?: boolean;
}