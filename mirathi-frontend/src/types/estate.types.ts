import { z } from 'zod';

// ============================================================================
// 1. ENUMS (Strictly matched with Backend Prisma Schema)
// ============================================================================

export const AssetCategory = {
  LAND: 'LAND',
  PROPERTY: 'PROPERTY',
  VEHICLE: 'VEHICLE',
  BANK_ACCOUNT: 'BANK_ACCOUNT',
  INVESTMENT: 'INVESTMENT',
  BUSINESS: 'BUSINESS',
  LIVESTOCK: 'LIVESTOCK',
  PERSONAL_EFFECTS: 'PERSONAL_EFFECTS',
  OTHER: 'OTHER',
} as const;
export type AssetCategory = (typeof AssetCategory)[keyof typeof AssetCategory];

export const AssetStatus = {
  ACTIVE: 'ACTIVE',
  VERIFIED: 'VERIFIED',
  ENCUMBERED: 'ENCUMBERED',
  DISPUTED: 'DISPUTED',
  LIQUIDATED: 'LIQUIDATED',
} as const;
export type AssetStatus = (typeof AssetStatus)[keyof typeof AssetStatus];

export const LandCategory = {
  RESIDENTIAL: 'RESIDENTIAL',
  AGRICULTURAL: 'AGRICULTURAL',
  COMMERCIAL: 'COMMERCIAL',
  INDUSTRIAL: 'INDUSTRIAL',
  VACANT: 'VACANT',
} as const;
export type LandCategory = (typeof LandCategory)[keyof typeof LandCategory];

export const VehicleCategory = {
  PERSONAL_CAR: 'PERSONAL_CAR',
  COMMERCIAL_VEHICLE: 'COMMERCIAL_VEHICLE',
  MOTORCYCLE: 'MOTORCYCLE',
  TRACTOR: 'TRACTOR',
} as const;
export type VehicleCategory = (typeof VehicleCategory)[keyof typeof VehicleCategory];

export const KenyanCounty = {
  BARINGO: 'BARINGO',
  BOMET: 'BOMET',
  BUNGOMA: 'BUNGOMA',
  BUSIA: 'BUSIA',
  ELGEYO_MARAKWET: 'ELGEYO_MARAKWET',
  EMBU: 'EMBU',
  GARISSA: 'GARISSA',
  HOMA_BAY: 'HOMA_BAY',
  ISIOLO: 'ISIOLO',
  KAJIADO: 'KAJIADO',
  KAKAMEGA: 'KAKAMEGA',
  KERICHO: 'KERICHO',
  KIAMBU: 'KIAMBU',
  KILIFI: 'KILIFI',
  KIRINYAGA: 'KIRINYAGA',
  KISII: 'KISII',
  KISUMU: 'KISUMU',
  KITUI: 'KITUI',
  KWALE: 'KWALE',
  LAIKIPIA: 'LAIKIPIA',
  LAMU: 'LAMU',
  MACHAKOS: 'MACHAKOS',
  MAKUENI: 'MAKUENI',
  MANDERA: 'MANDERA',
  MARSABIT: 'MARSABIT',
  MERU: 'MERU',
  MIGORI: 'MIGORI',
  MOMBASA: 'MOMBASA',
  MURANGA: 'MURANGA',
  NAIROBI: 'NAIROBI',
  NAKURU: 'NAKURU',
  NANDI: 'NANDI',
  NAROK: 'NAROK',
  NYAMIRA: 'NYAMIRA',
  NYANDARUA: 'NYANDARUA',
  NYERI: 'NYERI',
  SAMBURU: 'SAMBURU',
  SIAYA: 'SIAYA',
  TAITA_TAVETA: 'TAITA_TAVETA',
  TANA_RIVER: 'TANA_RIVER',
  THARAKA_NITHI: 'THARAKA_NITHI',
  TRANS_NZOIA: 'TRANS_NZOIA',
  TURKANA: 'TURKANA',
  UASIN_GISHU: 'UASIN_GISHU',
  VIHIGA: 'VIHIGA',
  WAJIR: 'WAJIR',
  WEST_POKOT: 'WEST_POKOT',
} as const;
export type KenyanCounty = (typeof KenyanCounty)[keyof typeof KenyanCounty];

export const DebtCategory = {
  MORTGAGE: 'MORTGAGE',
  BANK_LOAN: 'BANK_LOAN',
  SACCO_LOAN: 'SACCO_LOAN',
  PERSONAL_LOAN: 'PERSONAL_LOAN',
  MOBILE_LOAN: 'MOBILE_LOAN',
  FUNERAL_EXPENSES: 'FUNERAL_EXPENSES',
  MEDICAL_BILLS: 'MEDICAL_BILLS',
  TAXES_OWED: 'TAXES_OWED',
  OTHER: 'OTHER',
} as const;
export type DebtCategory = (typeof DebtCategory)[keyof typeof DebtCategory];

export const DebtPriority = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
} as const;
export type DebtPriority = (typeof DebtPriority)[keyof typeof DebtPriority];

export const DebtStatus = {
  OUTSTANDING: 'OUTSTANDING',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID_IN_FULL: 'PAID_IN_FULL',
  DISPUTED: 'DISPUTED',
  WRITTEN_OFF: 'WRITTEN_OFF',
} as const;
export type DebtStatus = (typeof DebtStatus)[keyof typeof DebtStatus];

export const WillStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  SUPERSEDED: 'SUPERSEDED',
  REVOKED: 'REVOKED',
  EXECUTED: 'EXECUTED',
} as const;
export type WillStatus = (typeof WillStatus)[keyof typeof WillStatus];

export const BeneficiaryType = {
  SPOUSE: 'SPOUSE',
  CHILD: 'CHILD',
  PARENT: 'PARENT',
  SIBLING: 'SIBLING',
  FRIEND: 'FRIEND',
  CHARITY: 'CHARITY',
  OTHER: 'OTHER',
} as const;
export type BeneficiaryType = (typeof BeneficiaryType)[keyof typeof BeneficiaryType];

export const BequestType = {
  SPECIFIC_ASSET: 'SPECIFIC_ASSET',
  PERCENTAGE: 'PERCENTAGE',
  CASH_AMOUNT: 'CASH_AMOUNT',
  RESIDUAL: 'RESIDUAL',
} as const;
export type BequestType = (typeof BequestType)[keyof typeof BequestType];

export const WitnessStatus = {
  PENDING: 'PENDING',
  SIGNED: 'SIGNED',
  DECLINED: 'DECLINED',
} as const;
export type WitnessStatus = (typeof WitnessStatus)[keyof typeof WitnessStatus];

export const KenyanFormType = {
  PA1_PROBATE: 'PA1_PROBATE',
  PA80_INTESTATE: 'PA80_INTESTATE',
  PA5_SUMMARY: 'PA5_SUMMARY',
  PA12_AFFIDAVIT_MEANS: 'PA12_AFFIDAVIT_MEANS',
  PA38_FAMILY_CONSENT: 'PA38_FAMILY_CONSENT',
  CHIEFS_LETTER: 'CHIEFS_LETTER',
  ISLAMIC_PETITION: 'ISLAMIC_PETITION',
} as const;
export type KenyanFormType = (typeof KenyanFormType)[keyof typeof KenyanFormType];

export const CourtJurisdiction = {
  HIGH_COURT: 'HIGH_COURT',
  MAGISTRATE_COURT: 'MAGISTRATE_COURT',
  KADHIS_COURT: 'KADHIS_COURT',
  CUSTOMARY_COURT: 'CUSTOMARY_COURT',
} as const;
export type CourtJurisdiction = (typeof CourtJurisdiction)[keyof typeof CourtJurisdiction];

// ============================================================================
// 2. FORM SCHEMAS (Zod - Input Validation matching Backend DTOs)
// ============================================================================

// --- COMMON REGEX (Matching Backend) ---
const KRA_PIN_REGEX = /^[A-Z]\d{9}[A-Z]$/;
const KE_REGISTRATION_REGEX = /^K[A-Z]{2}\s?\d{3}[A-Z]$/;
const KE_ID_REGEX = /^\d{6,20}$/;

// --- ESTATE SCHEMAS ---
export const CreateEstateSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  userName: z.string().min(1, 'Name is required').max(200),
  kraPin: z
    .string()
    .regex(KRA_PIN_REGEX, 'Invalid KRA PIN format (e.g., A000000000Z)')
    .optional()
    .or(z.literal('')),
});

// --- BASE ASSET SCHEMA (Matching BaseAssetDto) ---
const BaseAssetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
  estimatedValue: z.number().min(0, 'Value cannot be negative'),
  purchaseDate: z.date().optional(),
  location: z.string().optional(),
  isEncumbered: z.boolean().optional().default(false),
  encumbranceDetails: z.string().optional(),
});

// --- 1. GENERIC ASSET SCHEMA (Matching AddAssetDto) ---
export const AddGenericAssetSchema = BaseAssetSchema.extend({
  category: z.nativeEnum(AssetCategory),
});

// --- 2. LAND ASSET SCHEMA (Matching AddLandAssetDto) ---
export const AddLandAssetSchema = BaseAssetSchema.extend({
  category: z.literal(AssetCategory.LAND),
  titleDeedNumber: z.string().min(1, 'Title Deed Number is required'),
  parcelNumber: z.string().optional(),
  county: z.nativeEnum(KenyanCounty),
  subCounty: z.string().optional(),
  landCategory: z.nativeEnum(LandCategory),
  sizeInAcres: z.number().min(0).optional(),
});

// --- 3. VEHICLE ASSET SCHEMA (Matching AddVehicleAssetDto) ---
export const AddVehicleAssetSchema = BaseAssetSchema.extend({
  category: z.literal(AssetCategory.VEHICLE),
  registrationNumber: z
    .string()
    .regex(KE_REGISTRATION_REGEX, 'Invalid KE registration number (e.g., KCA 123A)'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
  vehicleCategory: z.nativeEnum(VehicleCategory),
});

export const UpdateAssetValueSchema = z.object({
  estimatedValue: z.number().min(0, 'Value cannot be negative'),
});

export const VerifyAssetSchema = z.object({
  proofDocumentUrl: z.string().min(1, 'Document URL is required'),
});

// --- DEBT SCHEMAS (Matching AddDebtDto) ---
export const AddDebtSchema = z.object({
  creditorName: z.string().min(1, 'Creditor name is required').max(200),
  creditorContact: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  category: z.nativeEnum(DebtCategory),
  originalAmount: z.number().min(0, 'Amount cannot be negative'),
  outstandingBalance: z.number().min(0).optional(),
  dueDate: z.date().optional(),
  isSecured: z.boolean().optional().default(false),
  securityDetails: z.string().optional(),
});

export const PayDebtSchema = z.object({
  amount: z.number().min(0.01, 'Payment amount must be positive'),
});

// --- WILL SCHEMAS (Matching CreateWillDto) ---
export const CreateWillSchema = z.object({
  userId: z.string().uuid('Invalid user ID format'),
  testatorName: z.string().min(1, 'Testator name is required'),
});

// --- BENEFICIARY SCHEMA (Matching AddBeneficiaryDto) ---
export const AddBeneficiarySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.nativeEnum(BeneficiaryType),
  bequestType: z.nativeEnum(BequestType).default(BequestType.RESIDUAL),
  percentage: z.number().min(0).max(100).optional(),
  cashAmount: z.number().min(0).optional(),
  description: z.string().optional(),
}).refine(
  (data) => {
    if (data.bequestType === BequestType.PERCENTAGE) {
      return data.percentage !== undefined && data.percentage > 0;
    }
    if (data.bequestType === BequestType.CASH_AMOUNT) {
      return data.cashAmount !== undefined && data.cashAmount > 0;
    }
    return true;
  },
  {
    message: 'Value required for selected bequest type',
    path: ['bequestType'],
  }
);

// --- WITNESS SCHEMA (Matching AddWitnessDto) ---
export const AddWitnessSchema = z.object({
  fullName: z.string().min(1, 'Full Name is required'),
  nationalId: z
    .string()
    .regex(KE_ID_REGEX, 'Invalid National ID')
    .min(6)
    .max(20)
    .optional(),
  email: z.string().email('Invalid email').optional(),
});

// ============================================================================
// 3. INPUT TYPES (Inferred from Zod Schemas)
// ============================================================================

export type CreateEstateInput = z.infer<typeof CreateEstateSchema>;
export type AddGenericAssetInput = z.infer<typeof AddGenericAssetSchema>;
export type AddLandAssetInput = z.infer<typeof AddLandAssetSchema>;
export type AddVehicleAssetInput = z.infer<typeof AddVehicleAssetSchema>;
export type UpdateAssetValueInput = z.infer<typeof UpdateAssetValueSchema>;
export type VerifyAssetInput = z.infer<typeof VerifyAssetSchema>;
export type AddDebtInput = z.infer<typeof AddDebtSchema>;
export type PayDebtInput = z.infer<typeof PayDebtSchema>;
export type CreateWillInput = z.infer<typeof CreateWillSchema>;
export type AddBeneficiaryInput = z.infer<typeof AddBeneficiarySchema>;
export type AddWitnessInput = z.infer<typeof AddWitnessSchema>;

// ============================================================================
// 4. API RESPONSE INTERFACES (Matching Backend Response DTOs)
// ============================================================================

// --- LEGAL INSIGHTS (Matching LegalInsightsDto) ---
export interface LegalInsights {
  recommendedForm: KenyanFormType;
  explanation: string;
  estimatedCourtFees: string;
  jurisdiction: CourtJurisdiction;
}

// --- ESTATE SUMMARY (Matching EstateSummaryDto) ---
export interface EstateSummaryResponse {
  id: string;
  userName: string;
  kraPin?: string;
  netWorth: number;
  currency: string;
  isInsolvent: boolean;
  assetCount: number;
  debtCount: number;
  legalInsights: LegalInsights;
  createdAt: string;
}

// --- LAND DETAILS (Matching Backend LandDetails Model) ---
export interface LandDetails {
  titleDeedNumber: string;
  parcelNumber?: string;
  county: KenyanCounty;
  subCounty?: string;
  landCategory: LandCategory;
  sizeInAcres?: number;
}

// --- VEHICLE DETAILS (Matching Backend VehicleDetails Model) ---
export interface VehicleDetails {
  registrationNumber: string;
  make: string;
  model: string;
  year?: number;
  vehicleCategory: VehicleCategory;
}

// --- ASSET RESPONSE (Matching AssetResponseDto) ---
export interface AssetResponse {
  id: string;
  name: string;
  category: AssetCategory;
  estimatedValue: number;
  status: AssetStatus;
  isVerified: boolean;
  isEncumbered: boolean;
  encumbranceDetails?: string;
  proofDocumentUrl?: string;
  details?: LandDetails | VehicleDetails; // Polymorphic details
  createdAt: string;
}

// --- DEBT RESPONSE (Matching DebtResponseDto) ---
export interface DebtResponse {
  id: string;
  creditorName: string;
  category: DebtCategory;
  priority: DebtPriority;
  originalAmount: number;
  outstandingBalance: number;
  status: DebtStatus;
  isSecured: boolean;
  createdAt: string;
}

// --- WILL COMPLETENESS (Backend Calculated) ---
export interface WillCompleteness {
  isComplete: boolean;
  completenessScore: number;
  hasExecutor: boolean;
  hasBeneficiaries: boolean;
  hasWitnesses: boolean;
  witnessCount: number;
  warnings: string[];
  requiredActions: string[];
}

// --- WILL METADATA (Part of WillPreviewDto) ---
export interface WillMetadata {
  willId: string;
  status: WillStatus;
  completenessScore: number;
  validationWarnings: string[];
}

// --- WILL PREVIEW (Matching WillPreviewDto) ---
export interface WillPreviewResponse {
  metadata: WillMetadata;
  htmlPreview: string;
}

// --- BENEFICIARY RESPONSE (Backend Bequest Model) ---
export interface BeneficiaryResponse {
  id: string;
  beneficiaryName: string;
  beneficiaryType: BeneficiaryType;
  relationship?: string;
  bequestType: BequestType;
  percentage?: number;
  cashAmount?: number;
  description: string;
  hasConditions: boolean;
  conditions?: string;
  assetId?: string;
  createdAt: string;
}

// --- WITNESS RESPONSE (Backend Witness Model) ---
export interface WitnessResponse {
  id: string;
  fullName: string;
  nationalId?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  status: WitnessStatus;
  signedAt?: string;
  isOver18: boolean;
  isNotBeneficiary: boolean;
  isMentallyCapable: boolean;
  createdAt: string;
}

// --- WILL FULL RESPONSE (Extended with Relations) ---
export interface WillResponse {
  id: string;
  userId: string;
  testatorName: string;
  status: WillStatus;
  versionNumber: number;
  executorName?: string;
  executorPhone?: string;
  executorEmail?: string;
  executorRelationship?: string;
  funeralWishes?: string;
  burialLocation?: string;
  specialInstructions?: string;
  hasExecutor: boolean;
  hasBeneficiaries: boolean;
  hasWitnesses: boolean;
  isComplete: boolean;
  completenessScore: number;
  validationWarnings: string[];
  bequests?: BeneficiaryResponse[];
  witnesses?: WitnessResponse[];
  createdAt: string;
  updatedAt: string;
  executedAt?: string;
}