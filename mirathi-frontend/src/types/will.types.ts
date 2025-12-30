import { z } from 'zod';

// ============================================================================
// 1. SHARED ENUMS & VALUE OBJECTS
// ============================================================================

export const WillType = {
  STANDARD: 'STANDARD',
  ISLAMIC: 'ISLAMIC',
  CUSTOMARY: 'CUSTOMARY',
  ORAL: 'ORAL',
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
  TRUST: 'TRUST',
  ALTERNATE: 'ALTERNATE',
  CONTINGENT: 'CONTINGENT',
} as const;
export type BequestType = (typeof BequestType)[keyof typeof BequestType];

export const BequestPriority = {
  PRIMARY: 'PRIMARY',
  ALTERNATE: 'ALTERNATE',
  CONTINGENT: 'CONTINGENT',
} as const;
export type BequestPriority = (typeof BequestPriority)[keyof typeof BequestPriority];

export const CapacityStatus = {
  SELF_DECLARATION: 'SELF_DECLARATION',
  MEDICAL_CERTIFICATION: 'MEDICAL_CERTIFICATION',
  ASSESSED_COMPETENT: 'ASSESSED_COMPETENT',
  ASSESSED_INCOMPETENT: 'ASSESSED_INCOMPETENT',
  PENDING_ASSESSMENT: 'PENDING_ASSESSMENT',
  COURT_DETERMINATION: 'COURT_DETERMINATION',
} as const;
export type CapacityStatus = (typeof CapacityStatus)[keyof typeof CapacityStatus];

export const SignatureType = {
  DIGITAL_SIGNATURE: 'DIGITAL_SIGNATURE',
  WET_SIGNATURE: 'WET_SIGNATURE',
  E_SIGNATURE: 'E_SIGNATURE',
  BIOMETRIC_SIGNATURE: 'BIOMETRIC_SIGNATURE',
  WITNESS_MARK: 'WITNESS_MARK',
} as const;
export type SignatureType = (typeof SignatureType)[keyof typeof SignatureType];

export const WitnessType = {
  REGISTERED_USER: 'REGISTERED_USER',
  EXTERNAL_INDIVIDUAL: 'EXTERNAL_INDIVIDUAL',
  PROFESSIONAL_WITNESS: 'PROFESSIONAL_WITNESS',
  COURT_OFFICER: 'COURT_OFFICER',
  NOTARY_PUBLIC: 'NOTARY_PUBLIC',
} as const;
export type WitnessType = (typeof WitnessType)[keyof typeof WitnessType];

export const ExecutorPriorityType = {
  PRIMARY: 'PRIMARY',
  SUBSTITUTE: 'SUBSTITUTE',
  CO_EXECUTOR: 'CO_EXECUTOR',
} as const;
export type ExecutorPriorityType = (typeof ExecutorPriorityType)[keyof typeof ExecutorPriorityType];

export const RevocationMethod = {
  NEW_WILL: 'NEW_WILL',
  CODICIL: 'CODICIL',
  DESTRUCTION: 'DESTRUCTION',
  COURT_ORDER: 'COURT_ORDER',
  MARRIAGE: 'MARRIAGE',
  DIVORCE: 'DIVORCE',
  OTHER: 'OTHER',
} as const;
export type RevocationMethod = (typeof RevocationMethod)[keyof typeof RevocationMethod];

export const DisinheritanceReasonCategory = {
  ABANDONMENT: 'ABANDONMENT',
  ABUSE: 'ABUSE',
  ESTRANGEMENT: 'ESTRANGEMENT',
  PRIOR_PROVISION: 'PRIOR_PROVISION',
  TESTAMENTARY_FREEDOM: 'TESTAMENTARY_FREEDOM',
  OTHER: 'OTHER',
} as const;
export type DisinheritanceReasonCategory =
  (typeof DisinheritanceReasonCategory)[keyof typeof DisinheritanceReasonCategory];

export const DisinheritanceEvidenceType = {
  AFFIDAVIT: 'AFFIDAVIT',
  WILL_CLARIFICATION: 'WILL_CLARIFICATION',
  PRIOR_GIFT_DOCUMENTATION: 'PRIOR_GIFT_DOCUMENTATION',
  FAMILY_AGREEMENT: 'FAMILY_AGREEMENT',
  COURT_ORDER: 'COURT_ORDER',
  MEDICAL_REPORT: 'MEDICAL_REPORT',
  OTHER: 'OTHER',
} as const;
export type DisinheritanceEvidenceType =
  (typeof DisinheritanceEvidenceType)[keyof typeof DisinheritanceEvidenceType];

export const BequestConditionType = {
  AGE_REQUIREMENT: 'AGE_REQUIREMENT',
  SURVIVAL: 'SURVIVAL',
  EDUCATION: 'EDUCATION',
  MARRIAGE: 'MARRIAGE',
  NONE: 'NONE',
} as const;
export type BequestConditionType =
  (typeof BequestConditionType)[keyof typeof BequestConditionType];

export const CodicilAmendmentType = {
  ADDITION: 'ADDITION',
  MODIFICATION: 'MODIFICATION',
  REVOCATION: 'REVOCATION',
} as const;
export type CodicilAmendmentType =
  (typeof CodicilAmendmentType)[keyof typeof CodicilAmendmentType];

// ============================================================================
// 2. REQUEST SCHEMAS (Forms)
// ============================================================================

// --- Lifecycle: Create Draft ---
const InitialCapacitySchema = z.object({
  status: z.enum(['SELF_DECLARATION', 'MEDICAL_CERTIFICATION', 'ASSESSED_COMPETENT']),
  date: z.string().datetime(),
  assessedBy: z.string().optional(),
  notes: z.string().optional(),
  documentIds: z.array(z.string().uuid()).optional(),
});

export const CreateDraftWillRequestSchema = z.object({
  type: z.nativeEnum(WillType).optional().default(WillType.STANDARD),
  initialCapacityDeclaration: InitialCapacitySchema.optional(),
});

// --- Bequests: Add Beneficiary ---
const BeneficiaryDetailsSchema = z.object({
  type: z.enum(['USER', 'FAMILY_MEMBER', 'EXTERNAL']),
  userId: z.string().uuid().optional(),
  familyMemberId: z.string().uuid().optional(),
  externalName: z.string().min(1).optional(),
  externalNationalId: z.string().optional(),
  externalRelationship: z.string().optional(),
});

const BequestConditionSchema = z.object({
  type: z.nativeEnum(BequestConditionType),
  parameter: z.union([
    z.object({
      type: z.literal('AGE_REQUIREMENT'),
      minimumAge: z.number().min(0).max(150),
    }),
    z.object({
      type: z.literal('SURVIVAL'),
      mustSurviveDays: z.number().min(1),
    }),
    z.object({
      type: z.literal('EDUCATION'),
      requiredLevel: z.enum(['HIGH_SCHOOL', 'UNDERGRADUATE', 'POSTGRADUATE']),
    }),
    z.object({
      type: z.literal('MARRIAGE'),
      mustBeMarried: z.boolean(),
      mustNotBeMarried: z.boolean().optional(),
    }),
    z.object({
      type: z.literal('NONE'),
    }),
  ]),
});

export const AddBeneficiaryRequestSchema = z.object({
  beneficiary: BeneficiaryDetailsSchema,
  description: z.string().min(1).max(500, 'Description must be 500 characters or less'),
  bequestType: z.nativeEnum(BequestType),
  specificAssetId: z.string().uuid().optional(),
  percentage: z.number().min(0.01).max(100).optional(),
  fixedAmount: z.number().min(1).optional(),
  residuaryShare: z.number().optional(),
  priority: z.nativeEnum(BequestPriority).optional(),
  conditions: z.array(BequestConditionSchema).optional(),
});

// --- Executors: Appoint ---
const ExecutorIdentitySchema = z.object({
  type: z.enum(['USER', 'FAMILY_MEMBER', 'EXTERNAL']),
  userId: z.string().uuid().optional(),
  familyMemberId: z.string().uuid().optional(),
  fullName: z.string().optional(),
  externalNationalId: z.string().optional(),
  externalEmail: z.string().email().optional(),
  externalPhone: z.string().optional(),
});

const ExecutorCompensationSchema = z.object({
  isEntitled: z.boolean(),
  amount: z.number().optional(),
  basis: z.enum(['FIXED', 'PERCENTAGE', 'REASONABLE']).optional(),
});

export const AppointExecutorRequestSchema = z.object({
  executorIdentity: ExecutorIdentitySchema,
  priority: z.nativeEnum(ExecutorPriorityType),
  order: z.number().min(1).optional(),
  powers: z.array(z.string()).optional(),
  compensation: ExecutorCompensationSchema.optional(),
});

// --- Witnesses: Add ---
const WitnessIdentitySchema = z.object({
  type: z.nativeEnum(WitnessType),
  userId: z.string().uuid().optional(),
  externalFullName: z.string().optional(),
  externalNationalId: z.string().optional(),
  relationshipToTestator: z.string().optional(),
});

const ContactInfoSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

const EligibilitySchema = z.object({
  isOver18: z.boolean(),
  isMentallyCompetent: z.boolean(),
  isNotBeneficiary: z.boolean(),
});

export const AddWitnessRequestSchema = z.object({
  witnessIdentity: WitnessIdentitySchema,
  contactInfo: ContactInfoSchema.optional(),
  eligibilityConfirmation: EligibilitySchema,
});

// --- Execution: Ceremony ---
const WitnessDeclarationSchema = z.object({
  isNotBeneficiary: z.boolean(),
  isNotSpouseOfBeneficiary: z.boolean(),
  isOfSoundMind: z.boolean(),
  understandsDocument: z.boolean(),
  isActingVoluntarily: z.boolean(),
});

const WitnessExecutionSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  nationalId: z
    .string()
    .regex(/^[1-3]\d{7}$/, 'Invalid Kenyan National ID format (e.g., 12345678)'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  physicalAddress: z.string().optional(),
  declarations: WitnessDeclarationSchema,
});

export const ExecuteWillRequestSchema = z.object({
  executionDate: z.string().datetime('Invalid date format'),
  location: z.string().min(1, 'Location is required'),
  timezone: z.string().optional().default('Africa/Nairobi'),
  witnesses: z
    .array(WitnessExecutionSchema)
    .min(2, 'At least 2 witnesses are required for valid execution (S.11 LSA)'),
});

// --- Revocation ---
export const RevokeWillRequestSchema = z.object({
  method: z.nativeEnum(RevocationMethod),
  reason: z.string().max(500).optional(),
});

// --- Capacity Update ---
const CapacityDeclarationsSchema = z.object({
  isVoluntarilyMade: z.boolean(),
  isFreeFromUndueInfluence: z.boolean(),
});

export const UpdateCapacityRequestSchema = z.object({
  status: z.nativeEnum(CapacityStatus),
  date: z.string().datetime(),
  assessedBy: z.string().optional(),
  notes: z.string().optional(),
  documentIds: z.array(z.string().uuid()),
  declarations: CapacityDeclarationsSchema,
});

// --- Witness Signature ---
export const RecordWitnessSignatureRequestSchema = z.object({
  witnessId: z.string().uuid(),
  signatureType: z.nativeEnum(SignatureType),
  location: z.string().optional(),
  notes: z.string().optional(),
});

// --- Disinheritance ---
const DisinheritedPersonSchema = z.object({
  type: z.enum(['USER', 'FAMILY_MEMBER', 'EXTERNAL']),
  userId: z.string().uuid().optional(),
  familyMemberId: z.string().uuid().optional(),
  externalName: z.string().optional(),
  externalRelationship: z.string().optional(),
});

const EvidenceSchema = z.object({
  type: z.nativeEnum(DisinheritanceEvidenceType),
  description: z.string().min(1),
  documentId: z.string().uuid().optional(),
});

export const RecordDisinheritanceRequestSchema = z.object({
  disinheritedPerson: DisinheritedPersonSchema,
  reasonCategory: z.nativeEnum(DisinheritanceReasonCategory),
  reasonDescription: z.string().min(1, 'Reason description is required'),
  legalBasis: z.string().optional(),
  evidence: z.array(EvidenceSchema),
  isCompleteDisinheritance: z.boolean(),
  appliesToBequests: z.array(z.string().uuid()).optional(),
  riskMitigationSteps: z.array(z.string()).optional(),
});

// --- Codicil ---
const ExecutionDetailsSchema = z.object({
  date: z.string().datetime(),
  location: z.string().min(1),
  timezone: z.string().optional(),
  witnessesPresent: z.number().min(2),
});

export const AddCodicilRequestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  date: z.string().datetime(),
  amendmentType: z.nativeEnum(CodicilAmendmentType),
  affectedClauses: z.array(z.string()).optional(),
  legalBasis: z.string().optional(),
  executionDetails: ExecutionDetailsSchema,
  witnessIds: z.array(z.string().uuid()).min(2, 'At least 2 witnesses required'),
});

// --- Search Filters ---
export const WillSearchFilterSchema = z.object({
  testatorId: z.string().uuid().optional(),
  testatorName: z.string().optional(),
  probateCaseNumber: z.string().optional(),
  status: z.nativeEnum(WillStatus).optional(),
  type: z.nativeEnum(WillType).optional(),
  isRevoked: z.boolean().optional(),
  isValid: z.boolean().optional(),
  createdFrom: z.string().datetime().optional(),
  createdTo: z.string().datetime().optional(),
  page: z.number().min(1).optional().default(1),
  pageSize: z.number().min(1).max(100).optional().default(20),
});

// ============================================================================
// 3. RESPONSE INTERFACES
// ============================================================================

// --- Summary ---
export interface WillSummaryResponse {
  id: string;
  testatorId: string;
  status: WillStatus;
  type: WillType;
  createdAt: string;
  isRevoked: boolean;
  hasCodicils: boolean;
  hasDisinheritance: boolean;
  executionDate?: string;
  isValid: boolean;
  validationErrorsCount: number;
}

// --- Detail ---
export interface RevocationDetails {
  method: string;
  reason?: string;
  date: string;
}

export interface CapacityDeclarationSummary {
  status: string;
  date: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  isLegallySufficient: boolean;
}

export interface ExecutorSummary {
  id: string;
  name: string;
  type: string;
  priority: string;
  isQualified: boolean;
  status: string;
}

export interface BequestSummary {
  id: string;
  beneficiaryName: string;
  type: string;
  description: string;
  valueSummary: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface WitnessSummary {
  id: string;
  name: string;
  status: string;
  type: string;
  signedAt?: string;
}

export interface CodicilSummary {
  id: string;
  title: string;
  date: string;
  type: string;
  isExecuted: boolean;
}

export interface DisinheritanceSummary {
  id: string;
  personName: string;
  reasonCategory: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  isActive: boolean;
}

export interface WillDetailResponse {
  id: string;
  testatorId: string;
  versionNumber: number;
  status: WillStatus;
  type: WillType;
  createdAt: string;
  updatedAt: string;
  executionDate?: string;
  executionLocation?: string;
  isRevoked: boolean;
  revocationDetails?: RevocationDetails;
  funeralWishes?: string;
  burialLocation?: string;
  residuaryClause?: string;
  capacityDeclaration?: CapacityDeclarationSummary;
  executors: ExecutorSummary[];
  bequests: BequestSummary[];
  witnesses: WitnessSummary[];
  codicils: CodicilSummary[];
  disinheritanceRecords: DisinheritanceSummary[];
  isValid: boolean;
  validationErrors: string[];
}

// --- Compliance ---
export interface ComplianceIssue {
  code: string;
  message: string;
  severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface LegalSectionResult {
  status: 'PASS' | 'WARN' | 'FAIL';
  issues: ComplianceIssue[];
}

export interface SectionAnalysis {
  s5_capacity: LegalSectionResult;
  s11_execution: LegalSectionResult;
  s26_dependants: LegalSectionResult;
  s83_executors: LegalSectionResult;
}

export interface ComplianceReportResponse {
  willId: string;
  generatedAt: string;
  overallStatus: 'COMPLIANT' | 'AT_RISK' | 'NON_COMPLIANT';
  riskScore: number;
  sectionAnalysis: SectionAnalysis;
  violations: ComplianceIssue[];
  warnings: ComplianceIssue[];
  recommendations: string[];
}

// --- Executor Assignment ---
export interface ExecutorAssignmentResponse {
  willId: string;
  testatorId: string;
  willStatus: WillStatus;
  myRole: 'PRIMARY' | 'SUBSTITUTE' | 'CO_EXECUTOR';
  myOrder?: number;
  appointmentDate: string;
  consentStatus: 'PENDING' | 'CONSENTED' | 'DECLINED' | 'UNKNOWN';
  isQualified: boolean;
  disqualificationRisk?: string;
  compensationSummary: string;
  actionRequired: boolean;
  actionLabel?: string;
}

// --- Pagination ---
export interface PaginatedWillResponse {
  items: WillSummaryResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ============================================================================
// 4. INFERRED INPUT TYPES
// ============================================================================
export type CreateDraftWillInput = z.infer<typeof CreateDraftWillRequestSchema>;
export type AddBeneficiaryInput = z.infer<typeof AddBeneficiaryRequestSchema>;
export type AppointExecutorInput = z.infer<typeof AppointExecutorRequestSchema>;
export type AddWitnessInput = z.infer<typeof AddWitnessRequestSchema>;
export type ExecuteWillInput = z.infer<typeof ExecuteWillRequestSchema>;
export type RevokeWillInput = z.infer<typeof RevokeWillRequestSchema>;
export type UpdateCapacityInput = z.infer<typeof UpdateCapacityRequestSchema>;
export type RecordWitnessSignatureInput = z.infer<typeof RecordWitnessSignatureRequestSchema>;
export type RecordDisinheritanceInput = z.infer<typeof RecordDisinheritanceRequestSchema>;
export type AddCodicilInput = z.infer<typeof AddCodicilRequestSchema>;
export type WillSearchFilterInput = z.infer<typeof WillSearchFilterSchema>;

// ============================================================================
// 5. UTILITY TYPES
// ============================================================================

export interface BeneficiaryDetails {
  type: 'USER' | 'FAMILY_MEMBER' | 'EXTERNAL';
  userId?: string;
  familyMemberId?: string;
  externalName?: string;
  externalNationalId?: string;
  externalRelationship?: string;
}

export interface ExecutorIdentity {
  type: 'USER' | 'FAMILY_MEMBER' | 'EXTERNAL';
  userId?: string;
  familyMemberId?: string;
  fullName?: string;
  externalNationalId?: string;
  externalEmail?: string;
  externalPhone?: string;
}

export interface WitnessIdentity {
  type: WitnessType;
  userId?: string;
  externalFullName?: string;
  externalNationalId?: string;
  relationshipToTestator?: string;
}

export interface ExecutorCompensation {
  isEntitled: boolean;
  amount?: number;
  basis?: 'FIXED' | 'PERCENTAGE' | 'REASONABLE';
}

// Bequest Condition Parameter Types
export type AgeRequirementParameter = {
  minimumAge: number;
  type: 'AGE_REQUIREMENT';
};

export type SurvivalParameter = {
  mustSurviveDays: number;
  type: 'SURVIVAL';
};

export type EducationParameter = {
  requiredLevel: 'HIGH_SCHOOL' | 'UNDERGRADUATE' | 'POSTGRADUATE';
  type: 'EDUCATION';
};

export type MarriageParameter = {
  mustBeMarried: boolean;
  mustNotBeMarried?: boolean;
  type: 'MARRIAGE';
};

export type BequestConditionParameter =
  | AgeRequirementParameter
  | SurvivalParameter
  | EducationParameter
  | MarriageParameter
  | { type: 'NONE' };

export interface BequestCondition {
  type: BequestConditionType;
  parameter: BequestConditionParameter;
}

export interface DisinheritedPerson {
  type: 'USER' | 'FAMILY_MEMBER' | 'EXTERNAL';
  userId?: string;
  familyMemberId?: string;
  externalName?: string;
  externalRelationship?: string;
}

export interface Evidence {
  type: DisinheritanceEvidenceType;
  description: string;
  documentId?: string;
}