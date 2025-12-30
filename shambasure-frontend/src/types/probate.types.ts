import { z } from 'zod';

// ============================================================================
// 1. SHARED ENUMS (Converted to CONST OBJECTS)
// ============================================================================

export const ApplicationStatus = {
  DRAFT: 'DRAFT',
  PENDING_FORMS: 'PENDING_FORMS',
  PENDING_CONSENTS: 'PENDING_CONSENTS',
  READY_TO_FILE: 'READY_TO_FILE',
  FILED: 'FILED',
  COURT_QUERIED: 'COURT_QUERIED',
  GRANT_ISSUED: 'GRANT_ISSUED',
  WITHDRAWN: 'WITHDRAWN',
} as const;
export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

export const ProbateApplicationType = {
  GRANT_OF_PROBATE: 'GRANT_OF_PROBATE', // With Will
  LETTERS_OF_ADMINISTRATION: 'LETTERS_OF_ADMINISTRATION', // No Will (Intestate)
  SUMMARY_ADMINISTRATION: 'SUMMARY_ADMINISTRATION', // Small Estate
} as const;
export type ProbateApplicationType = (typeof ProbateApplicationType)[keyof typeof ProbateApplicationType];

export const FilingPriority = {
  NORMAL: 'NORMAL',
  URGENT: 'URGENT', // Cert of Urgency
} as const;
export type FilingPriority = (typeof FilingPriority)[keyof typeof FilingPriority];

export const ConsentStatus = {
  PENDING: 'PENDING',
  REQUESTED: 'REQUESTED',
  GRANTED: 'GRANTED',
  DECLINED: 'DECLINED',
  NOT_REQUIRED: 'NOT_REQUIRED',
} as const;
export type ConsentStatus = (typeof ConsentStatus)[keyof typeof ConsentStatus];

export const ConsentMethod = {
  SMS_OTP: 'SMS_OTP',
  EMAIL_LINK: 'EMAIL_LINK',
  PHYSICAL_AFFIDAVIT: 'PHYSICAL_AFFIDAVIT',
} as const;
export type ConsentMethod = (typeof ConsentMethod)[keyof typeof ConsentMethod];

export const FormStatus = {
  GENERATED: 'GENERATED',
  PENDING_SIGNATURE: 'PENDING_SIGNATURE',
  SIGNED: 'SIGNED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type FormStatus = (typeof FormStatus)[keyof typeof FormStatus];

export const SignatureType = {
  DIGITAL_SIGNATURE: 'DIGITAL_SIGNATURE',
  WET_SIGNATURE: 'WET_SIGNATURE',
} as const;
export type SignatureType = (typeof SignatureType)[keyof typeof SignatureType];

// ============================================================================
// 2. REQUEST SCHEMAS (Forms)
// ============================================================================

// --- Lifecycle: Create Application ---
const ApplicantContactSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
  physicalAddress: z.string().min(1, 'Physical address is required for service'),
});

export const CreateApplicationRequestSchema = z.object({
  estateId: z.string().uuid(),
  readinessAssessmentId: z.string().uuid(),
  successionContext: z.record(z.any()), // Flexible object for Regime/Religion
  applicationType: z.nativeEnum(ProbateApplicationType),
  applicantFullName: z.string().min(1),
  applicantRelationship: z.string().min(1),
  applicantContact: ApplicantContactSchema,
  targetCourtJurisdiction: z.string().min(1),
  targetCourtName: z.string().min(1),
  courtStation: z.string().min(1),
  priority: z.nativeEnum(FilingPriority).default('NORMAL'),
});

export const AutoGenerateRequestSchema = z.object({
  readinessAssessmentId: z.string().uuid(),
  estateId: z.string().uuid(),
});

// --- Forms: Strategy ---
export const GenerateFormsRequestSchema = z.object({
  forceRegeneration: z.boolean().optional(),
});

export const SignFormRequestSchema = z.object({
  signatoryName: z.string().min(1),
  signatureType: z.nativeEnum(SignatureType),
  digitalSignatureId: z.string().optional(),
});

// --- Consents: Management ---
export const SendConsentRequestSchema = z.object({
  method: z.enum(['SMS', 'EMAIL', 'BOTH']),
});

export const GrantConsentRequestSchema = z.object({
  method: z.nativeEnum(ConsentMethod),
  verificationToken: z.string().optional(),
});

export const DeclineConsentRequestSchema = z.object({
  reason: z.string().min(1),
  category: z.enum(['DISPUTE', 'NOT_INFORMED', 'DISAGREE_WITH_DISTRIBUTION', 'OTHER']),
});

// --- Filing: Execution ---
export const PayFilingFeeRequestSchema = z.object({
  amount: z.number().min(0),
  paymentMethod: z.string().min(1),
  paymentReference: z.string().min(1),
});

export const SubmitFilingRequestSchema = z.object({
  filingMethod: z.enum(['E_FILING', 'PHYSICAL', 'COURT_REGISTRY']),
  courtCaseNumber: z.string().optional(),
  courtReceiptNumber: z.string().optional(),
});

// ============================================================================
// 3. RESPONSE INTERFACES
// ============================================================================

// --- Dashboard ---
export interface ApplicationAlert {
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  title: string;
  message: string;
  actionLink?: string;
}

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
  alerts: ApplicationAlert[];
  formsReadyCount: number;
  formsTotalCount: number;
  consentsReceivedCount: number;
  consentsTotalCount: number;
  filingFeePaid: boolean;
  totalFilingCost: number;
  createdAt: string;
  lastModifiedAt: string;
}

// --- Forms ---
export interface SignatureStatus {
  signatoryName: string;
  role: string;
  hasSigned: boolean;
  signedAt?: string;
  signatureType?: SignatureType;
}

export interface FormItemResponse {
  id: string;
  code: string; // e.g. "P&A 80"
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
  signatories: SignatureStatus[];
  rejectionReason?: string;
}

export interface FormBundleResponse {
  applicationId: string;
  primaryPetitions: FormItemResponse[];
  affidavits: FormItemResponse[];
  consentsAndGuarantees: FormItemResponse[];
  others: FormItemResponse[];
  allApproved: boolean;
  allSigned: boolean;
}

// --- Consents ---
export interface ConsentItemResponse {
  id: string;
  familyMemberId: string;
  fullName: string;
  role: string; // FamilyRole
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

export interface ConsentMatrixResponse {
  applicationId: string;
  totalRequired: number;
  received: number;
  pending: number;
  declined: number;
  isComplete: boolean;
  items: ConsentItemResponse[];
}

// --- Filing Readiness ---
export interface FeeItem {
  description: string;
  amount: number;
  currency: string;
  isOptional: boolean;
}

export interface FilingFeeBreakdown {
  items: FeeItem[];
  subtotal: number;
  serviceFee: number;
  total: number;
  isPaid: boolean;
  paidAt?: string;
  receiptNumber?: string;
}

export interface FilingReadinessResponse {
  applicationId: string;
  isReady: boolean;
  fees: FilingFeeBreakdown;
  complianceStatus: 'PASS' | 'WARNING' | 'FAIL';
  violations: Array<{ section: string; requirement: string; description: string; severity: string }>;
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
export type GenerateFormsInput = z.infer<typeof GenerateFormsRequestSchema>;
export type SignFormInput = z.infer<typeof SignFormRequestSchema>;
export type SendConsentInput = z.infer<typeof SendConsentRequestSchema>;
export type GrantConsentInput = z.infer<typeof GrantConsentRequestSchema>;
export type DeclineConsentInput = z.infer<typeof DeclineConsentRequestSchema>;
export type PayFilingFeeInput = z.infer<typeof PayFilingFeeRequestSchema>;
export type SubmitFilingInput = z.infer<typeof SubmitFilingRequestSchema>;