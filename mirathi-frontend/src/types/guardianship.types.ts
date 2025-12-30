import { z } from 'zod';

// ============================================================================
// 1. SHARED ENUMS (Converted to CONST OBJECTS)
// ============================================================================

export const GuardianRole = {
  LEGAL_GUARDIAN: 'LEGAL_GUARDIAN',
  TESTAMENTARY_GUARDIAN: 'TESTAMENTARY_GUARDIAN',
  AD_LITEM: 'AD_LITEM',
  CUSTODIAN: 'CUSTODIAN',
} as const;
export type GuardianRole = (typeof GuardianRole)[keyof typeof GuardianRole];

export const GuardianAppointmentSource = {
  WILL: 'WILL',
  COURT_ORDER: 'COURT_ORDER',
  PARENTAL_AGREEMENT: 'PARENTAL_AGREEMENT',
  STATUTORY: 'STATUTORY',
} as const;
export type GuardianAppointmentSource =
  (typeof GuardianAppointmentSource)[keyof typeof GuardianAppointmentSource];

export const LegalGuardianshipType = {
  TESTAMENTARY: 'TESTAMENTARY',
  STATUTORY: 'STATUTORY',
  INTESTATE_SUCCESSION: 'INTESTATE_SUCCESSION',
  COURT_APPOINTED: 'COURT_APPOINTED',
  DE_FACTO: 'DE_FACTO',
} as const;
export type LegalGuardianshipType =
  (typeof LegalGuardianshipType)[keyof typeof LegalGuardianshipType];

export const RiskSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
export type RiskSeverity = (typeof RiskSeverity)[keyof typeof RiskSeverity];

export const GuardianshipStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  TERMINATED: 'TERMINATED',
  REVIEW_REQUIRED: 'REVIEW_REQUIRED',
} as const;
export type GuardianshipStatus = (typeof GuardianshipStatus)[keyof typeof GuardianshipStatus];

export const SubmissionMethod = {
  E_FILING: 'E_FILING',
  COURT_PORTAL: 'COURT_PORTAL',
  EMAIL: 'EMAIL',
  PHYSICAL: 'PHYSICAL',
  LAWYER: 'LAWYER',
} as const;
export type SubmissionMethod = (typeof SubmissionMethod)[keyof typeof SubmissionMethod];

export const ConflictType = {
  FINANCIAL: 'FINANCIAL',
  CUSTODIAL: 'CUSTODIAL',
  NEGLECT: 'NEGLECT',
  OTHER: 'OTHER',
} as const;
export type ConflictType = (typeof ConflictType)[keyof typeof ConflictType];

export const ReviewOutcome = {
  ACCEPT: 'ACCEPT',
  REQUEST_AMENDMENT: 'REQUEST_AMENDMENT',
} as const;
export type ReviewOutcome = (typeof ReviewOutcome)[keyof typeof ReviewOutcome];

export const CourtFeedbackType = {
  APPROVAL: 'APPROVAL',
  REVISION: 'REVISION',
  REJECTION: 'REJECTION',
  QUERY: 'QUERY',
} as const;
export type CourtFeedbackType = (typeof CourtFeedbackType)[keyof typeof CourtFeedbackType];

export const DataSource = {
  SCHOOL_RECORDS: 'SCHOOL_RECORDS',
  MEDICAL_HISTORY: 'MEDICAL_HISTORY',
  FINANCIAL_STATEMENTS: 'FINANCIAL_STATEMENTS',
  PREVIOUS_REPORTS: 'PREVIOUS_REPORTS',
  INTERVIEW_TRANSCRIPT: 'INTERVIEW_TRANSCRIPT',
} as const;
export type DataSource = (typeof DataSource)[keyof typeof DataSource];

// ============================================================================
// 2. REQUEST SCHEMAS (Zod - Input Validation)
// ============================================================================

// --- Lifecycle: Create Guardianship ---
const CourtOrderSchema = z.object({
  caseNumber: z.string().min(1, 'Case number is required'),
  courtStation: z.string().min(1, 'Court station is required'),
  orderDate: z.string(),
  judgeName: z.string().optional(),
});

export const CreateGuardianshipRequestSchema = z.object({
  wardId: z.string().uuid(),
  wardFirstName: z.string().min(2),
  wardLastName: z.string().min(2),
  wardDateOfBirth: z.string(),
  wardGender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  wardIsAlive: z.boolean().default(true),
  guardianshipType: z.enum([
    'TESTAMENTARY',
    'STATUTORY',
    'INTESTATE_SUCCESSION',
    'COURT_APPOINTED',
    'DE_FACTO',
  ]),
  jurisdiction: z.enum(['STATUTORY', 'ISLAMIC', 'CUSTOMARY', 'INTERNATIONAL']),
  requiresPropertyManagement: z.boolean(),
  courtOrder: CourtOrderSchema.optional(),
  legalNotes: z.string().max(500).optional(),
});

// --- Lifecycle: Activate ---
export const ActivateGuardianshipRequestSchema = z.object({
  activationDate: z.string().optional(),
  activationNotes: z.string().max(200).optional(),
});

// --- Lifecycle: Terminate ---
export const TerminateGuardianshipRequestSchema = z.object({
  reason: z.string().min(10, 'Reason must be detailed (min 10 chars)'),
  terminationDate: z.string(),
});

// --- Ops: Appoint Guardian ---
const ContactInfoSchema = z.object({
  primaryPhone: z.string().regex(/^(?:254|\+254|0)?(7\d{8})$/, 'Invalid Kenyan phone number'),
  email: z.string().email().optional(),
  physicalAddress: z.string().min(1),
  postalAddress: z.string().optional(),
});

const InitialPowersSchema = z.object({
  canManageProperty: z.boolean(),
  canMakeMedicalDecisions: z.boolean(),
  canChooseEducation: z.boolean(),
  canTravelInternationally: z.boolean(),
  spendingLimitPerTransaction: z.number().min(0).optional(),
});

export const AppointGuardianRequestSchema = z.object({
  guardianMemberId: z.string().uuid(),
  guardianName: z.string().min(1),
  relationshipToWard: z.string().min(1),
  role: z.enum(['LEGAL_GUARDIAN', 'TESTAMENTARY_GUARDIAN', 'AD_LITEM', 'CUSTODIAN']),
  isPrimary: z.boolean(),
  appointmentSource: z.enum(['WILL', 'COURT_ORDER', 'PARENTAL_AGREEMENT', 'STATUTORY']),
  appointmentDate: z.string(),
  contactInfo: ContactInfoSchema,
  initialPowers: InitialPowersSchema,
  courtOrderReference: z.string().optional(),
  notes: z.string().optional(),
});

// --- Ops: Post Bond (Section 72) ---
export const PostBondRequestSchema = z.object({
  amount: z.number().min(1),
  suretyCompany: z.string().min(1),
  bondReference: z.string().min(1),
  digitalVerificationUrl: z.string().url().optional(),
  courtOrderReference: z.string().optional(),
});

// --- Ops: Update Powers ---
const GuardianshipPowersSchema = z.object({
  canManageProperty: z.boolean(),
  canConsentMedical: z.boolean(),
  canDecideEducation: z.boolean(),
  canTravelWithWard: z.boolean(),
  canAccessRecords: z.boolean(),
  financialLimit: z.number().min(0).optional(),
  specialInstructions: z.string().optional(),
});

export const UpdatePowersRequestSchema = z.object({
  newPowers: GuardianshipPowersSchema,
  reason: z.string().min(10),
});

// --- Ops: Suspend ---
export const SuspendGuardianRequestSchema = z.object({
  reason: z.string().min(10),
});

// --- Compliance: Submit Report ---
export const SubmitComplianceRequestSchema = z.object({
  method: z.enum(['E_FILING', 'COURT_PORTAL', 'EMAIL', 'PHYSICAL', 'LAWYER']),
  details: z.string().min(1),
  confirmationNumber: z.string().optional(),
});

// --- Compliance: Review Report ---
export const ReviewComplianceRequestSchema = z.object({
  outcome: z.enum(['ACCEPT', 'REQUEST_AMENDMENT']),
  feedbackType: z.enum(['APPROVAL', 'REVISION', 'REJECTION', 'QUERY']).optional(),
  comments: z.string().optional(),
  actionRequired: z.string().optional(),
  newDeadline: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.outcome === 'REQUEST_AMENDMENT') {
    if (!data.feedbackType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Feedback type is required when requesting amendment',
        path: ['feedbackType'],
      });
    }
    if (!data.actionRequired) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Action required is required when requesting amendment',
        path: ['actionRequired'],
      });
    }
  }
});

// --- Compliance: Auto-Generate Section ---
export const AutoGenerateSectionRequestSchema = z.object({
  sectionId: z.string().min(1),
  dataSource: z.enum([
    'SCHOOL_RECORDS',
    'MEDICAL_HISTORY',
    'FINANCIAL_STATEMENTS',
    'PREVIOUS_REPORTS',
    'INTERVIEW_TRANSCRIPT',
  ]),
});

// --- Risk: Record Conflict ---
export const RecordConflictRequestSchema = z.object({
  guardianId: z.string().uuid(),
  conflictType: z.enum(['FINANCIAL', 'CUSTODIAL', 'NEGLECT', 'OTHER']),
  description: z.string().min(10),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
});

// --- Risk: Resolve Conflict ---
export const ResolveConflictRequestSchema = z.object({
  guardianId: z.string().uuid(),
  conflictIndex: z.number().int().min(0),
  resolution: z.string().min(10),
  mitigationPlan: z.string().optional(),
});

// ============================================================================
// 3. RESPONSE INTERFACES (API Outputs)
// ============================================================================

export interface GuardianshipListItem {
  id: string;
  caseNumber: string;
  wardName: string;
  wardAge: number;
  primaryGuardianName: string;
  status: GuardianshipStatus;
  riskLevel: RiskSeverity;
  nextComplianceDue: string;
  establishedDate: string;
}

export interface PaginatedGuardianshipResponse {
  items: GuardianshipListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface WardSummary {
  id: string;
  name: string;
  age: number;
  dateOfBirth: string;
  gender: string;
  photoUrl?: string;
}

export interface LegalContext {
  type: string;
  jurisdiction: string;
  courtStation?: string;
  judgeName?: string;
  orderDate?: string;
}

export interface GuardianSummary {
  guardianId: string;
  name: string;
  role: string;
  isPrimary: boolean;
  status: string;
  contactPhone: string;
  relationshipToWard: string;
}

export interface ComplianceStatus {
  score: number;
  nextReportDue: string;
  lastReportDate?: string;
  isBonded: boolean;
}

export interface GuardianshipDetailsResponse {
  id: string;
  caseNumber: string;
  status: GuardianshipStatus;
  ward: WardSummary;
  legal: LegalContext;
  guardians: GuardianSummary[];
  compliance: ComplianceStatus;
}

export interface TimelineEventItem {
  id: string;
  date: string;
  type: string;
  title: string;
  description: string;
  statusColor: 'green' | 'amber' | 'red' | 'blue' | 'gray';
  icon: string;
  actor?: string;
  referenceId?: string;
  documentUrl?: string;
}

export interface TimelineSummary {
  totalReports: number;
  onTimeRate: number;
  nextDueDate?: string;
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'AT_RISK';
}

export interface ComplianceTimelineResponse {
  guardianshipId: string;
  wardName: string;
  summary: TimelineSummary;
  events: TimelineEventItem[];
}

export interface RiskFactor {
  code: string;
  description: string;
  severity: RiskSeverity;
  detectedAt: string;
}

export interface Recommendation {
  priority: number;
  title: string;
  action: string;
  legalReference: string;
}

export interface RiskAssessmentResponse {
  guardianshipId: string;
  generatedAt: string;
  overallRiskLevel: RiskSeverity;
  riskScore: number;
  activeAlerts: RiskFactor[];
  automatedRecommendations: Recommendation[];
}

// ============================================================================
// 4. INFERRED INPUT TYPES
// ============================================================================
export type CreateGuardianshipInput = z.infer<typeof CreateGuardianshipRequestSchema>;
export type ActivateGuardianshipInput = z.infer<typeof ActivateGuardianshipRequestSchema>;
export type TerminateGuardianshipInput = z.infer<typeof TerminateGuardianshipRequestSchema>;
export type AppointGuardianInput = z.infer<typeof AppointGuardianRequestSchema>;
export type UpdatePowersInput = z.infer<typeof UpdatePowersRequestSchema>;
export type PostBondInput = z.infer<typeof PostBondRequestSchema>;
export type SuspendGuardianInput = z.infer<typeof SuspendGuardianRequestSchema>;
export type SubmitComplianceInput = z.infer<typeof SubmitComplianceRequestSchema>;
export type ReviewComplianceInput = z.infer<typeof ReviewComplianceRequestSchema>;
export type AutoGenerateSectionInput = z.infer<typeof AutoGenerateSectionRequestSchema>;
export type RecordConflictInput = z.infer<typeof RecordConflictRequestSchema>;
export type ResolveConflictInput = z.infer<typeof ResolveConflictRequestSchema>;