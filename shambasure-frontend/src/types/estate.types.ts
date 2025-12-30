import { z } from 'zod';

// ============================================================================
// 1. SHARED VALUE OBJECTS & ENUMS
// ============================================================================

export const AssetType = {
  LAND: 'LAND',
  VEHICLE: 'VEHICLE',
  FINANCIAL: 'FINANCIAL', // Bank accounts, M-Pesa
  BUSINESS: 'BUSINESS', // Shares, Sole Proprietorship
  PERSONAL: 'PERSONAL', // Jewelry, Art
  DIGITAL: 'DIGITAL', // Crypto, NFTs
  INSURANCE: 'INSURANCE',
} as const;
export type AssetType = (typeof AssetType)[keyof typeof AssetType];

export const AssetStatus = {
  active: 'ACTIVE',
  sold: 'SOLD',
  distributed: 'DISTRIBUTED',
  disputed: 'DISPUTED',
  lost: 'LOST',
} as const;
export type AssetStatus = (typeof AssetStatus)[keyof typeof AssetStatus];

export const DebtType = {
  FUNERAL_EXPENSES: 'FUNERAL_EXPENSES', // Priority 1 (S.45)
  TESTAMENTARY_EXPENSES: 'TESTAMENTARY_EXPENSES', // Priority 2
  SECURED_LOAN: 'SECURED_LOAN', // Priority 3
  MORTGAGE: 'MORTGAGE',
  TAX_ARREARS: 'TAX_ARREARS', // Priority 4
  UNSECURED_LOAN: 'UNSECURED_LOAN', // Priority 5
  MEDICAL_BILL: 'MEDICAL_BILL',
} as const;
export type DebtType = (typeof DebtType)[keyof typeof DebtType];

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

// Money Helper
const MoneySchema = z.object({
  amount: z.number().min(0),
  currency: z.string().length(3).default('KES'),
});

// ============================================================================
// 2. REQUEST SCHEMAS (Forms)
// ============================================================================

// --- Lifecycle: Create Estate ---
export const CreateEstateRequestSchema = z.object({
  name: z.string().min(2),
  deceasedId: z.string().uuid(),
  deceasedName: z.string().min(1),
  dateOfDeath: z.string().datetime(),
  kraPin: z.string().regex(/^[A-Z]\d{9}[A-Z]$/, 'Invalid KRA PIN format'),
  executorId: z.string().uuid(),
  courtCaseNumber: z.string().optional(),
  initialCash: MoneySchema.optional(),
});

// --- Asset: Details Polymorphism ---
const LandDetailsSchema = z.object({
  titleDeedNumber: z.string().min(1),
  landReferenceNumber: z.string().min(1),
  county: z.string().min(1),
  subCounty: z.string().optional(),
  locationDescription: z.string().optional(),
  acreage: z.number().min(0.01),
  landUse: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'AGRICULTURAL']),
  registeredOwner: z.string().min(1),
});

const VehicleDetailsSchema = z.object({
  registrationNumber: z.string().regex(/^[A-Z0-9\s]+$/, 'Invalid Plate'),
  chassisNumber: z.string().min(5),
  logbookNumber: z.string().optional(),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900),
  engineNumber: z.string().optional(),
  color: z.string().optional(),
});

const FinancialDetailsSchema = z.object({
  institutionName: z.string().min(1),
  accountNumber: z.string().min(1),
  accountType: z.string().min(1),
  branchName: z.string().optional(),
  accountHolderName: z.string().min(1),
  isJointAccount: z.boolean(),
  jointAccountHolders: z.array(z.string()).optional(),
  currency: z.string().length(3),
});

// --- Asset: Add Asset ---
export const AddAssetRequestSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(AssetType),
  currentValue: MoneySchema,
  description: z.string().optional(),
  location: z.string().optional(),
  purchaseDate: z.string().optional(),
  
  // Polymorphic Fields (Optional but validated conditionally in UI)
  landDetails: LandDetailsSchema.optional(),
  vehicleDetails: VehicleDetailsSchema.optional(),
  financialDetails: FinancialDetailsSchema.optional(),
});

// --- Debt: Add Debt ---
export const AddDebtRequestSchema = z.object({
  creditorName: z.string().min(1),
  description: z.string().min(1),
  initialAmount: MoneySchema,
  type: z.nativeEnum(DebtType),
  securedAssetId: z.string().uuid().optional(), // Required if type is SECURED/MORTGAGE
  referenceNumber: z.string().optional(),
  dueDate: z.string().optional(),
});

// --- Debt: Operations ---
export const PayDebtRequestSchema = z.object({
  amount: MoneySchema,
  paymentMethod: z.string().min(1),
  reference: z.string().optional(),
});

// --- Liquidation ---
export const InitiateLiquidationRequestSchema = z.object({
  assetId: z.string().uuid(),
  liquidationType: z.enum(['PUBLIC_AUCTION', 'PRIVATE_TREATY', 'SALE_ON_OPEN_MARKET']),
  targetAmount: MoneySchema,
  reason: z.string().min(1),
});

// ============================================================================
// 3. RESPONSE INTERFACES (Dashboard & Data)
// ============================================================================

export interface Money {
  amount: number;
  currency: string;
  formatted: string; // "KES 1,500,000"
}

// --- Dashboard ---
export interface EstateDashboardResponse {
  id: string;
  name: string;
  deceasedName: string;
  dateOfDeath: string;
  daysSinceDeath: number;
  status: EstateStatus;
  isFrozen: boolean;
  
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
export interface SolvencyRadarResponse {
  estateId: string;
  healthScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  netPosition: Money;
  liquidityAnalysis: {
    liquidCash: Money;
    immediateObligations: Money;
    cashShortfall: Money;
    liquidityRatio: number;
    isLiquid: boolean;
  };
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
  estateSharePercentage: number;
  identifier: string; // "Title No" or "Plate No"
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
  priorityTier: number; // 1-5 (S.45)
  tierName: string;
  status: 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'DISPUTED' | 'WRITTEN_OFF';
  isSecured: boolean;
  dueDate?: string;
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

// ============================================================================
// 4. INFERRED INPUT TYPES
// ============================================================================
export type CreateEstateInput = z.infer<typeof CreateEstateRequestSchema>;
export type AddAssetInput = z.infer<typeof AddAssetRequestSchema>;
export type AddDebtInput = z.infer<typeof AddDebtRequestSchema>;
export type PayDebtInput = z.infer<typeof PayDebtRequestSchema>;
export type InitiateLiquidationInput = z.infer<typeof InitiateLiquidationRequestSchema>;