import { z } from 'zod';
import { Gender } from './family.types'; // Reusing shared Gender enum

// ============================================================================
// 1. SHARED ENUMS (Converted to CONST OBJECTS)
// ============================================================================

export const GuardianRole = {
  LEGAL_GUARDIAN: 'LEGAL_GUARDIAN',
  TESTAMENTARY_GUARDIAN: 'TESTAMENTARY_GUARDIAN',
  AD_LITEM: 'AD_LITEM', // For specific court case
  CUSTODIAN: 'CUSTODIAN', // Physical care only
} as const;
export type GuardianRole = (typeof GuardianRole)[keyof typeof GuardianRole];

export const GuardianAppointmentSource = {
  WILL: 'WILL',
  COURT_ORDER: 'COURT_ORDER',
  PARENTAL_AGREEMENT: 'PARENTAL_AGREEMENT',
  STATUTORY: 'STATUTORY',
} as const;
export type GuardianAppointmentSource = (typeof GuardianAppointmentSource)[keyof typeof GuardianAppointmentSource];

export const LegalGuardianshipType = {
  FULL: 'FULL',
  LIMITED: 'LIMITED',
  TEMPORARY: 'TEMPORARY',
} as const;
export type LegalGuardianshipType = (typeof LegalGuardianshipType)[keyof typeof LegalGuardianshipType];

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

// ============================================================================
// 2. REQUEST SCHEMAS (Zod - Input Validation)
// ============================================================================

// --- Lifecycle: Create Guardianship ---
const CourtOrderSchema = z.object({
  caseNumber: z.string().min(1, 'Case number is required'),
  courtStation: z.string().min(1, 'Court station is required'),
  orderDate: z.string().datetime(),
  judgeName: z.string().optional(),
});

export const CreateGuardianshipRequestSchema = z.object({
  wardId: z.string().uuid(),
  wardFirstName: z.string().min(2),
  wardLastName: z.string().min(2),
  wardDateOfBirth: z.string().datetime(),
  wardGender: z.nativeEnum(Gender),
  wardIsAlive: z.boolean().default(true),
  guardianshipType: z.nativeEnum(LegalGuardianshipType),
  jurisdiction: z.enum(['STATUTORY', 'ISLAMIC', 'CUSTOMARY', 'INTERNATIONAL']),
  requiresPropertyManagement: z.boolean(),
  courtOrder: CourtOrderSchema.optional(),
  legalNotes: z.string().max(500).optional(),
});

// --- Lifecycle: Activate ---
export const ActivateGuardianshipRequestSchema = z.object({
  activationDate: z.string().datetime().optional(),
  activationNotes: z.string().max(200).optional(),
});

// --- Lifecycle: Terminate ---
export const TerminateGuardianshipRequestSchema = z.object({
  reason: z.string().min(10, 'Reason must be detailed (min 10 chars)'),
  terminationDate: z.string().datetime(),
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
  role: z.nativeEnum(GuardianRole),
  isPrimary: z.boolean(),
  appointmentSource: z.nativeEnum(GuardianAppointmentSource),
  appointmentDate: z.string().datetime(),
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
  method: z.nativeEnum(SubmissionMethod),
  details: z.string().min(1),
  confirmationNumber: z.string().optional(),
});

// --- Risk: Record Conflict ---
export const RecordConflictRequestSchema = z.object({
  guardianId: z.string().uuid(),
  conflictType: z.nativeEnum(ConflictType),
  description: z.string().min(10),
  severity: z.nativeEnum(RiskSeverity),
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
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  nextComplianceDue: string; // ISO Date
  establishedDate: string; // ISO Date
}

export interface PaginatedGuardianshipResponse {
  items: GuardianshipListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GuardianshipDetailsResponse {
  id: string;
  caseNumber: string;
  status: GuardianshipStatus;
  ward: {
    id: string;
    name: string;
    age: number;
    dateOfBirth: string;
    gender: string;
    photoUrl?: string;
  };
  legal: {
    type: string;
    jurisdiction: string;
    courtStation?: string;
    judgeName?: string;
    orderDate?: string;
  };
  guardians: Array<{
    guardianId: string;
    name: string;
    role: string;
    isPrimary: boolean;
    status: string;
    contactPhone: string;
    relationshipToWard: string;
  }>;
  compliance: {
    score: number;
    nextReportDue: string;
    lastReportDate?: string;
    isBonded: boolean;
  };
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

export interface ComplianceTimelineResponse {
  guardianshipId: string;
  wardName: string;
  summary: {
    totalReports: number;
    onTimeRate: number;
    nextDueDate?: string;
    status: 'COMPLIANT' | 'NON_COMPLIANT' | 'AT_RISK';
  };
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
export type RecordConflictInput = z.infer<typeof RecordConflictRequestSchema>;