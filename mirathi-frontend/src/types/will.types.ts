import { z } from 'zod';

// ============================================================================
// 1. SHARED ENUMS & VALUE OBJECTS
// ============================================================================

export const WillType = {
  STANDARD: 'STANDARD',
  ISLAMIC: 'ISLAMIC',
  CUSTOMARY: 'CUSTOMARY',
  ORAL: 'ORAL', // Nuncupative
} as const;
export type WillType = (typeof WillType)[keyof typeof WillType];

export const WillStatus = {
  DRAFT: 'DRAFT',
  PENDING_EXECUTION: 'PENDING_EXECUTION',
  ACTIVE: 'ACTIVE',
  REVOKED: 'REVOKED',
  EXECUTED: 'EXECUTED',
} as const;
export type WillStatus = (typeof WillStatus)[keyof typeof WillStatus];

export const BequestType = {
  SPECIFIC_ASSET: 'SPECIFIC_ASSET',
  RESIDUARY: 'RESIDUARY',
  PERCENTAGE: 'PERCENTAGE',
  FIXED_AMOUNT: 'FIXED_AMOUNT',
  LIFE_INTEREST: 'LIFE_INTEREST',
} as const;
export type BequestType = (typeof BequestType)[keyof typeof BequestType];

export const CapacityStatus = {
  SELF_DECLARATION: 'SELF_DECLARATION',
  MEDICAL_CERTIFICATION: 'MEDICAL_CERTIFICATION',
  ASSESSED_COMPETENT: 'ASSESSED_COMPETENT',
} as const;
export type CapacityStatus = (typeof CapacityStatus)[keyof typeof CapacityStatus];

export const SignatureType = {
  DIGITAL_SIGNATURE: 'DIGITAL_SIGNATURE',
  WET_SIGNATURE: 'WET_SIGNATURE',
  E_SIGNATURE: 'E_SIGNATURE',
} as const;
export type SignatureType = (typeof SignatureType)[keyof typeof SignatureType];

// ============================================================================
// 2. REQUEST SCHEMAS (Forms)
// ============================================================================

// --- Lifecycle: Create Draft ---
export const CreateDraftWillRequestSchema = z.object({
  type: z.nativeEnum(WillType).default('STANDARD'),
  initialCapacityDeclaration: z.object({
    status: z.nativeEnum(CapacityStatus),
    date: z.string().datetime(),
    assessedBy: z.string().optional(),
    notes: z.string().optional(),
    documentIds: z.array(z.string().uuid()).optional(),
  }).optional(),
});

// --- Bequests: Add Beneficiary ---
const BeneficiaryDetailsSchema = z.object({
  type: z.enum(['USER', 'FAMILY_MEMBER', 'EXTERNAL']),
  userId: z.string().uuid().optional(),
  familyMemberId: z.string().uuid().optional(),
  externalName: z.string().optional(),
});

export const AddBeneficiaryRequestSchema = z.object({
  beneficiary: BeneficiaryDetailsSchema,
  description: z.string().min(1).max(500),
  bequestType: z.nativeEnum(BequestType),
  // Conditional fields
  specificAssetId: z.string().uuid().optional(),
  percentage: z.number().min(0.01).max(100).optional(),
  fixedAmount: z.number().min(1).optional(),
  residuaryShare: z.number().optional(),
  priority: z.enum(['PRIMARY', 'ALTERNATE']).optional(),
});

// --- Executors: Appoint ---
const ExecutorIdentitySchema = z.object({
  type: z.enum(['USER', 'FAMILY_MEMBER', 'EXTERNAL']),
  userId: z.string().uuid().optional(),
  familyMemberId: z.string().uuid().optional(),
  fullName: z.string().optional(),
  externalEmail: z.string().email().optional(),
  externalPhone: z.string().optional(),
});

export const AppointExecutorRequestSchema = z.object({
  executorIdentity: ExecutorIdentitySchema,
  priority: z.enum(['PRIMARY', 'SUBSTITUTE', 'CO_EXECUTOR']),
  order: z.number().optional(),
  powers: z.array(z.string()).optional(),
  compensation: z.object({
    isEntitled: z.boolean(),
    amount: z.number().optional(),
    basis: z.enum(['FIXED', 'PERCENTAGE', 'REASONABLE']).optional(),
  }).optional(),
});

// --- Witnesses: Add ---
export const AddWitnessRequestSchema = z.object({
  witnessIdentity: z.object({
    type: z.string(), // "REGISTERED_USER" etc
    userId: z.string().uuid().optional(),
    externalFullName: z.string().optional(),
    externalNationalId: z.string().optional(),
  }),
  contactInfo: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }).optional(),
  eligibilityConfirmation: z.object({
    isOver18: z.boolean(),
    isMentallyCompetent: z.boolean(),
    isNotBeneficiary: z.boolean(),
  }),
});

// --- Execution: Ceremony ---
const WitnessExecutionSchema = z.object({
  fullName: z.string().min(1),
  nationalId: z.string().regex(/^[1-3]\d{7}$/, 'Invalid ID'),
  declarations: z.object({
    isNotBeneficiary: z.boolean(),
    isNotSpouseOfBeneficiary: z.boolean(),
    isOfSoundMind: z.boolean(),
    understandsDocument: z.boolean(),
    isActingVoluntarily: z.boolean(),
  }),
});

export const ExecuteWillRequestSchema = z.object({
  executionDate: z.string().datetime(),
  location: z.string().min(1),
  timezone: z.string().optional(),
  witnesses: z.array(WitnessExecutionSchema).min(2, 'Two witnesses required'),
});

// ============================================================================
// 3. RESPONSE INTERFACES
// ============================================================================

export interface WillSummaryResponse {
  id: string;
  testatorId: string;
  status: WillStatus;
  type: WillType;
  createdAt: string;
  isValid: boolean;
  validationErrorsCount: number;
}

export interface WillDetailResponse extends WillSummaryResponse {
  versionNumber: number;
  isRevoked: boolean;
  executors: Array<{
    id: string;
    name: string;
    type: string;
    priority: string;
    status: string;
  }>;
  bequests: Array<{
    id: string;
    beneficiaryName: string;
    type: BequestType;
    description: string;
    valueSummary: string;
  }>;
  witnesses: Array<{
    id: string;
    name: string;
    status: string;
  }>;
  capacityDeclaration?: {
    status: string;
    date: string;
    isLegallySufficient: boolean;
  };
  validationErrors: string[];
}

export interface ComplianceReportResponse {
  willId: string;
  overallStatus: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT';
  riskScore: number;
  violations: Array<{ code: string; message: string; severity: string }>;
  recommendations: string[];
}

// ============================================================================
// 4. INFERRED INPUT TYPES
// ============================================================================
export type CreateDraftWillInput = z.infer<typeof CreateDraftWillRequestSchema>;
export type AddBeneficiaryInput = z.infer<typeof AddBeneficiaryRequestSchema>;
export type AppointExecutorInput = z.infer<typeof AppointExecutorRequestSchema>;
export type AddWitnessInput = z.infer<typeof AddWitnessRequestSchema>;
export type ExecuteWillInput = z.infer<typeof ExecuteWillRequestSchema>;