// probate.types.ts
import { z } from 'zod';

// ============================================================================
// 1. ENUMS (From Prisma Schema)
// ============================================================================

// Application Status
export const ApplicationStatus = {
  DRAFT: 'DRAFT',
  PENDING_FORMS: 'PENDING_FORMS',
  UNDER_REVIEW: 'UNDER_REVIEW',
  PENDING_SIGNATURES: 'PENDING_SIGNATURES',
  PENDING_CONSENTS: 'PENDING_CONSENTS',
  PENDING_FEE: 'PENDING_FEE',
  READY_TO_FILE: 'READY_TO_FILE',
  FILED: 'FILED',
  COURT_REVIEW: 'COURT_REVIEW',
  GAZETTE_PUBLISHED: 'GAZETTE_PUBLISHED',
  GRANTED: 'GRANTED',
  REJECTED: 'REJECTED',
  AMENDMENT_REQUIRED: 'AMENDMENT_REQUIRED',
  WITHDRAWN: 'WITHDRAWN',
  ABANDONED: 'ABANDONED',
} as const;
export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

// Probate Application Type
export const ProbateApplicationType = {
  GRANT_OF_PROBATE: 'GRANT_OF_PROBATE',
  LETTERS_OF_ADMINISTRATION: 'LETTERS_OF_ADMINISTRATION',
  LETTERS_OF_ADMIN_WILL_ANNEXED: 'LETTERS_OF_ADMIN_WILL_ANNEXED',
  SUMMARY_ADMINISTRATION: 'SUMMARY_ADMINISTRATION',
  LIMITED_GRANT_AD_LITEM: 'LIMITED_GRANT_AD_LITEM',
  LIMITED_GRANT_COLLECTION: 'LIMITED_GRANT_COLLECTION',
  ISLAMIC_GRANT: 'ISLAMIC_GRANT',
  CUSTOMARY_GRANT: 'CUSTOMARY_GRANT',
} as const;
export type ProbateApplicationType = (typeof ProbateApplicationType)[keyof typeof ProbateApplicationType];

// Court Jurisdiction
export const CourtJurisdiction = {
  HIGH_COURT: 'HIGH_COURT',
  MAGISTRATE_COURT: 'MAGISTRATE_COURT',
  KADHIS_COURT: 'KADHIS_COURT',
  CUSTOMARY_COURT: 'CUSTOMARY_COURT',
  FAMILY_DIVISION: 'FAMILY_DIVISION',
  COMMERCIAL_COURT: 'COMMERCIAL_COURT',
} as const;
export type CourtJurisdiction = (typeof CourtJurisdiction)[keyof typeof CourtJurisdiction];

// Filing Priority
export const FilingPriority = {
  URGENT: 'URGENT',
  HIGH: 'HIGH',
  NORMAL: 'NORMAL',
  LOW: 'LOW',
} as const;
export type FilingPriority = (typeof FilingPriority)[keyof typeof FilingPriority];

// Form Status
export const FormStatus = {
  PENDING_GENERATION: 'PENDING_GENERATION',
  GENERATED: 'GENERATED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  SIGNATURE_PENDING: 'SIGNATURE_PENDING',
  SIGNED: 'SIGNED',
  FILED: 'FILED',
  COURT_ACCEPTED: 'COURT_ACCEPTED',
  COURT_REJECTED: 'COURT_REJECTED',
  AMENDED: 'AMENDED',
  SUPERSEDED: 'SUPERSEDED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type FormStatus = (typeof FormStatus)[keyof typeof FormStatus];

// Form Category
export const FormCategory = {
  PRIMARY_PETITION: 'PRIMARY_PETITION',
  SUPPORTING_AFFIDAVIT: 'SUPPORTING_AFFIDAVIT',
  CONSENT: 'CONSENT',
  GUARANTEE: 'GUARANTEE',
  NOTICE: 'NOTICE',
  SCHEDULE: 'SCHEDULE',
  COURT_ORDER: 'COURT_ORDER',
  CUSTOMARY: 'CUSTOMARY',
  ISLAMIC: 'ISLAMIC',
  DISTRIBUTION: 'DISTRIBUTION',
} as const;
export type FormCategory = (typeof FormCategory)[keyof typeof FormCategory];

// Kenyan Form Types
export const KenyanFormType = {
  // Primary
  PA1_PETITION: 'PA1_PETITION',
  PA5_PETITION_SUMMARY: 'PA5_PETITION_SUMMARY',
  PA80_PETITION_INTESTATE: 'PA80_PETITION_INTESTATE',
  PA81_PETITION_ADMINISTRATION: 'PA81_PETITION_ADMINISTRATION',
  ISLAMIC_PETITION: 'ISLAMIC_PETITION',
  // Supporting
  PA12_AFFIDAVIT_MEANS: 'PA12_AFFIDAVIT_MEANS',
  AFFIDAVIT_DUE_EXECUTION: 'AFFIDAVIT_DUE_EXECUTION',
  AFFIDAVIT_OF_SEARCH: 'AFFIDAVIT_OF_SEARCH',
  AFFIDAVIT_OF_IDENTIFICATION: 'AFFIDAVIT_OF_IDENTIFICATION',
  AFFIDAVIT_SUPPORTING_POLYGAMY: 'AFFIDAVIT_SUPPORTING_POLYGAMY',
  ISLAMIC_AFFIDAVIT: 'ISLAMIC_AFFIDAVIT',
  // Consents & Guarantees
  PA38_CONSENT: 'PA38_CONSENT',
  PA57_GUARANTEE: 'PA57_GUARANTEE',
  ISLAMIC_CONSENT: 'ISLAMIC_CONSENT',
  CONSENT_MINOR: 'CONSENT_MINOR',
  CONSENT_CREDITOR: 'CONSENT_CREDITOR',
  // Customary
  CHIEFS_LETTER_TEMPLATE: 'CHIEFS_LETTER_TEMPLATE',
  ELDERS_AFFIDAVIT: 'ELDERS_AFFIDAVIT',
  // Output Documents
  GRANT_OF_PROBATE: 'GRANT_OF_PROBATE',
  GRANT_LETTERS_ADMINISTRATION: 'GRANT_LETTERS_ADMINISTRATION',
  CONFIRMATION_GRANT: 'CONFIRMATION_GRANT',
} as const;
export type KenyanFormType = (typeof KenyanFormType)[keyof typeof KenyanFormType];

// Consent Status
export const ConsentStatus = {
  PENDING: 'PENDING',
  GRANTED: 'GRANTED',
  DECLINED: 'DECLINED',
  NOT_REQUIRED: 'NOT_REQUIRED',
  EXPIRED: 'EXPIRED',
  WITHDRAWN: 'WITHDRAWN',
} as const;
export type ConsentStatus = (typeof ConsentStatus)[keyof typeof ConsentStatus];

// Consent Method
export const ConsentMethod = {
  SMS_OTP: 'SMS_OTP',
  EMAIL_LINK: 'EMAIL_LINK',
  DIGITAL_SIGNATURE: 'DIGITAL_SIGNATURE',
  WET_SIGNATURE: 'WET_SIGNATURE',
  BIOMETRIC: 'BIOMETRIC',
  WITNESS_MARK: 'WITNESS_MARK',
  IN_PERSON: 'IN_PERSON',
} as const;
export type ConsentMethod = (typeof ConsentMethod)[keyof typeof ConsentMethod];

// Family Role
export const FamilyRole = {
  SURVIVING_SPOUSE: 'SURVIVING_SPOUSE',
  ADULT_CHILD: 'ADULT_CHILD',
  MINOR_CHILD: 'MINOR_CHILD',
  GUARDIAN_OF_MINOR: 'GUARDIAN_OF_MINOR',
  BENEFICIARY: 'BENEFICIARY',
  EXECUTOR: 'EXECUTOR',
  ADMINISTRATOR: 'ADMINISTRATOR',
  PARENT: 'PARENT',
  SIBLING: 'SIBLING',
  OTHER_RELATIVE: 'OTHER_RELATIVE',
} as const;
export type FamilyRole = (typeof FamilyRole)[keyof typeof FamilyRole];

// Signature Type
export const SignatureType = {
  DIGITAL_SIGNATURE: 'DIGITAL_SIGNATURE',
  WET_SIGNATURE: 'WET_SIGNATURE',
  E_SIGNATURE: 'E_SIGNATURE',
  BIOMETRIC_SIGNATURE: 'BIOMETRIC_SIGNATURE',
  WITNESS_MARK: 'WITNESS_MARK',
} as const;
export type SignatureType = (typeof SignatureType)[keyof typeof SignatureType];

// Succession Regime (from Succession Service)
export const SuccessionRegime = {
  TESTATE: 'TESTATE',
  INTESTATE: 'INTESTATE',
  PARTIALLY_INTESTATE: 'PARTIALLY_INTESTATE',
  CUSTOMARY: 'CUSTOMARY',
} as const;
export type SuccessionRegime = (typeof SuccessionRegime)[keyof typeof SuccessionRegime];

// Succession Marriage Type
export const SuccessionMarriageType = {
  MONOGAMOUS: 'MONOGAMOUS',
  POLYGAMOUS: 'POLYGAMOUS',
  COHABITATION: 'COHABITATION',
  SINGLE: 'SINGLE',
} as const;
export type SuccessionMarriageType = (typeof SuccessionMarriageType)[keyof typeof SuccessionMarriageType];

// Succession Religion
export const SuccessionReligion = {
  STATUTORY: 'STATUTORY',
  ISLAMIC: 'ISLAMIC',
  HINDU: 'HINDU',
  AFRICAN_CUSTOMARY: 'AFRICAN_CUSTOMARY',
  CHRISTIAN: 'CHRISTIAN',
} as const;
export type SuccessionReligion = (typeof SuccessionReligion)[keyof typeof SuccessionReligion];

// ============================================================================
// 2. REQUEST SCHEMAS (Matching DTOs)
// ============================================================================

// Applicant Contact (from DTOs)
const ApplicantContactRequestSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  physicalAddress: z.string().min(1, 'Physical address is required'),
});

// --- Create Application ---
export const CreateApplicationRequestSchema = z.object({
  estateId: z.string().uuid(),
  readinessAssessmentId: z.string().uuid(),
  successionContext: z.record(z.string(), z.unknown()), // Fixed: z.record needs key and value types
  applicationType: z.nativeEnum(ProbateApplicationType),
  applicantFullName: z.string().min(1),
  applicantRelationship: z.string().min(1),
  applicantContact: ApplicantContactRequestSchema,
  targetCourtJurisdiction: z.string().min(1), // DTO uses string, not enum
  targetCourtName: z.string().min(1),
  courtStation: z.string().min(1),
  priority: z.nativeEnum(FilingPriority).optional().default(FilingPriority.NORMAL),
});

// --- Auto Generate ---
export const AutoGenerateRequestSchema = z.object({
  readinessAssessmentId: z.string().uuid(),
  estateId: z.string().uuid(),
});

// --- Withdraw Application ---
export const WithdrawApplicationRequestSchema = z.object({
  reason: z.string().min(1),
});

// --- Generate Forms ---
export const GenerateFormsRequestSchema = z.object({
  forceRegeneration: z.boolean().optional().default(false),
});

// --- Regenerate Forms ---
export const RegenerateFormsRequestSchema = z.object({
  reason: z.string().min(1),
});

// --- Review Form ---
export const ReviewFormRequestSchema = z.object({
  notes: z.string().optional(),
  approved: z.boolean(),
});

// --- Sign Form ---
export const SignFormRequestSchema = z.object({
  signatoryName: z.string().min(1),
  signatureType: z.nativeEnum(SignatureType),
  digitalSignatureId: z.string().optional(),
});

// --- Amend Form ---
export const AmendFormRequestSchema = z.object({
  newStorageUrl: z.string().min(1),
  checksum: z.string().min(1),
  changesDescription: z.string().min(1),
});

// --- Send Consent ---
export const SendConsentRequestSchema = z.object({
  method: z.enum(['SMS', 'EMAIL', 'BOTH']),
});

// --- Grant Consent ---
export const GrantConsentRequestSchema = z.object({
  method: z.nativeEnum(ConsentMethod),
  verificationToken: z.string().optional(),
});

// --- Decline Consent ---
export const DeclineConsentRequestSchema = z.object({
  reason: z.string().min(1),
  category: z.enum(['DISPUTE', 'NOT_INFORMED', 'DISAGREE_WITH_DISTRIBUTION', 'OTHER']),
});

// --- Pay Filing Fee ---
export const PayFilingFeeRequestSchema = z.object({
  amount: z.number().min(0),
  paymentMethod: z.string().min(1),
  paymentReference: z.string().min(1),
});

// --- Submit Filing ---
export const SubmitFilingRequestSchema = z.object({
  filingMethod: z.enum(['E_FILING', 'PHYSICAL', 'COURT_REGISTRY']),
  courtCaseNumber: z.string().optional(),
  courtReceiptNumber: z.string().optional(),
});

// --- Record Court Response ---
export const RecordCourtResponseRequestSchema = z.object({
  outcome: z.enum(['ACCEPTED', 'REJECTED', 'QUERIED']),
  rejectionReason: z.string().optional(),
  queries: z.array(z.string()).optional(),
  amendmentsRequired: z.array(z.string()).optional(),
  responseDate: z.string().datetime(),
});

// --- Record Grant ---
export const RecordGrantRequestSchema = z.object({
  grantNumber: z.string().min(1),
  issuedByRegistrar: z.string().min(1),
  grantType: z.string().min(1),
  issuedDate: z.string().datetime(),
});

// ============================================================================
// 3. RESPONSE INTERFACES (Matching DTOs)
// ============================================================================

// --- Application Summary ---
export interface ApplicationSummaryResponse {
  id: string;
  estateId: string;
  deceasedName: string;
  applicationType: string;
  status: ApplicationStatus;
  courtName: string;
  progressPercentage: number;
  lastUpdated: string;
  nextAction: string;
}

export interface ApplicationListResponse {
  items: ApplicationSummaryResponse[];
  total: number;
  page: number;
  pages: number;
}

// --- Application Alert ---
export interface ApplicationAlertResponse {
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  title: string;
  message: string;
  actionLink?: string;
}

// --- Probate Dashboard ---
export interface ProbateDashboardResponse {
  id: string;
  referenceNumber: string;
  status: ApplicationStatus;
  statusLabel: string;
  priority: FilingPriority;
  progressPercentage: number;
  currentStep: number;
  totalSteps: number;
  targetCourt: string;
  courtStation: string;
  estimatedGrantDate?: string;
  nextAction: string;
  alerts: ApplicationAlertResponse[];
  formsReadyCount: number;
  formsTotalCount: number;
  consentsReceivedCount: number;
  consentsTotalCount: number;
  filingFeePaid: boolean;
  totalFilingCost: number;
  createdAt: string;
  lastModifiedAt: string;
}

// --- Signature Status ---
export interface SignatureStatusResponse {
  signatoryName: string;
  role: string;
  hasSigned: boolean;
  signedAt?: string;
  signatureType?: SignatureType;
}

// --- Form Item ---
export interface FormItemResponse {
  id: string;
  code: string;
  name: string;
  status: FormStatus;
  category: string;
  version: number;
  generatedAt: string;
  downloadUrl: string;
  previewUrl?: string;
  canSign: boolean;
  canRegenerate: boolean;
  signaturesRequired: number;
  signaturesObtained: number;
  signatories: SignatureStatusResponse[];
  rejectionReason?: string;
}

// --- Form Bundle ---
export interface FormBundleResponse {
  applicationId: string;
  primaryPetitions: FormItemResponse[];
  affidavits: FormItemResponse[];
  consentsAndGuarantees: FormItemResponse[];
  others: FormItemResponse[];
  allApproved: boolean;
  allSigned: boolean;
}

// --- Consent Item ---
export interface ConsentItemResponse {
  id: string;
  familyMemberId: string;
  fullName: string;
  role: FamilyRole;
  relationship: string;
  status: ConsentStatus;
  isRequired: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
  requestSentAt?: string;
  respondedAt?: string;
  expiresAt?: string;
  method?: ConsentMethod;
  declineReason?: string;
  canSendRequest: boolean;
  canMarkNotRequired: boolean;
}

// --- Consent Matrix ---
export interface ConsentMatrixResponse {
  applicationId: string;
  totalRequired: number;
  received: number;
  pending: number;
  declined: number;
  isComplete: boolean;
  items: ConsentItemResponse[];
}

// --- Fee Item ---
export interface FeeItemResponse {
  description: string;
  amount: number;
  currency: string;
  isOptional: boolean;
}

// --- Filing Fee Breakdown ---
export interface FilingFeeBreakdownResponse {
  items: FeeItemResponse[];
  subtotal: number;
  serviceFee: number;
  total: number;
  isPaid: boolean;
  paidAt?: string;
  receiptNumber?: string;
}

// --- Compliance Violation ---
export interface ComplianceViolationResponse {
  section: string;
  requirement: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// --- Filing Readiness ---
export interface FilingReadinessResponse {
  applicationId: string;
  isReady: boolean;
  fees: FilingFeeBreakdownResponse;
  complianceStatus: 'PASS' | 'WARNING' | 'FAIL';
  violations: ComplianceViolationResponse[];
  warnings: string[];
  courtName: string;
  registryLocation: string;
  estimatedFilingDate: string;
  estimatedGrantDate: string;
}

// ============================================================================
// 4. INFERRED INPUT TYPES
// ============================================================================
export type CreateApplicationInput = z.infer<typeof CreateApplicationRequestSchema>;
export type AutoGenerateInput = z.infer<typeof AutoGenerateRequestSchema>;
export type WithdrawApplicationInput = z.infer<typeof WithdrawApplicationRequestSchema>;
export type GenerateFormsInput = z.infer<typeof GenerateFormsRequestSchema>;
export type RegenerateFormsInput = z.infer<typeof RegenerateFormsRequestSchema>;
export type ReviewFormInput = z.infer<typeof ReviewFormRequestSchema>;
export type SignFormInput = z.infer<typeof SignFormRequestSchema>;
export type AmendFormInput = z.infer<typeof AmendFormRequestSchema>;
export type SendConsentInput = z.infer<typeof SendConsentRequestSchema>;
export type GrantConsentInput = z.infer<typeof GrantConsentRequestSchema>;
export type DeclineConsentInput = z.infer<typeof DeclineConsentRequestSchema>;
export type PayFilingFeeInput = z.infer<typeof PayFilingFeeRequestSchema>;
export type SubmitFilingInput = z.infer<typeof SubmitFilingRequestSchema>;
export type RecordCourtResponseInput = z.infer<typeof RecordCourtResponseRequestSchema>;
export type RecordGrantInput = z.infer<typeof RecordGrantRequestSchema>;