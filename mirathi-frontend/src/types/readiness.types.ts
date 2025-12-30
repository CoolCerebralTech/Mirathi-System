// readiness.types.ts
import { z } from 'zod';

// ============================================================================
// 1. SHARED ENUMS (From Prisma Schema)
// ============================================================================

// Succession Context Enums
export const SuccessionRegime = {
  TESTATE: 'TESTATE',
  INTESTATE: 'INTESTATE',
  PARTIALLY_INTESTATE: 'PARTIALLY_INTESTATE',
  CUSTOMARY: 'CUSTOMARY',
} as const;
export type SuccessionRegime = (typeof SuccessionRegime)[keyof typeof SuccessionRegime];

export const SuccessionMarriageType = {
  MONOGAMOUS: 'MONOGAMOUS',
  POLYGAMOUS: 'POLYGAMOUS',
  COHABITATION: 'COHABITATION',
  SINGLE: 'SINGLE',
} as const;
export type SuccessionMarriageType = (typeof SuccessionMarriageType)[keyof typeof SuccessionMarriageType];

export const SuccessionReligion = {
  STATUTORY: 'STATUTORY',
  ISLAMIC: 'ISLAMIC',
  HINDU: 'HINDU',
  AFRICAN_CUSTOMARY: 'AFRICAN_CUSTOMARY',
  CHRISTIAN: 'CHRISTIAN',
} as const;
export type SuccessionReligion = (typeof SuccessionReligion)[keyof typeof SuccessionReligion];

// Risk Enums
export const RiskSeverity = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
} as const;
export type RiskSeverity = (typeof RiskSeverity)[keyof typeof RiskSeverity];

export const RiskCategory = {
  // Document Issues
  MISSING_DOCUMENT: 'MISSING_DOCUMENT',
  INVALID_DOCUMENT: 'INVALID_DOCUMENT',
  EXPIRED_DOCUMENT: 'EXPIRED_DOCUMENT',
  FORGED_DOCUMENT: 'FORGED_DOCUMENT',
  // Family Structure
  MINOR_WITHOUT_GUARDIAN: 'MINOR_WITHOUT_GUARDIAN',
  UNDEFINED_POLYGAMOUS_STRUCTURE: 'UNDEFINED_POLYGAMOUS_STRUCTURE',
  DISPUTED_RELATIONSHIP: 'DISPUTED_RELATIONSHIP',
  COHABITATION_CLAIM: 'COHABITATION_CLAIM',
  ILLEGITIMATE_CHILD_CLAIM: 'ILLEGITIMATE_CHILD_CLAIM',
  // Estate Issues
  ASSET_VERIFICATION_FAILED: 'ASSET_VERIFICATION_FAILED',
  INSOLVENT_ESTATE: 'INSOLVENT_ESTATE',
  MISSING_ASSET_VALUATION: 'MISSING_ASSET_VALUATION',
  ENCUMBERED_ASSET: 'ENCUMBERED_ASSET',
  FRAUDULENT_ASSET_TRANSFER: 'FRAUDULENT_ASSET_TRANSFER',
  // Will Issues
  INVALID_WILL_SIGNATURE: 'INVALID_WILL_SIGNATURE',
  MINOR_EXECUTOR: 'MINOR_EXECUTOR',
  BENEFICIARY_AS_WITNESS: 'BENEFICIARY_AS_WITNESS',
  CONTESTED_WILL: 'CONTESTED_WILL',
  UNDUE_INFLUENCE: 'UNDUE_INFLUENCE',
  // Jurisdiction
  WRONG_COURT: 'WRONG_COURT',
  NON_RESIDENT_APPLICANT: 'NON_RESIDENT_APPLICANT',
  FORUM_NON_CONVENIENS: 'FORUM_NON_CONVENIENS',
  // Tax & Compliance
  TAX_CLEARANCE_MISSING: 'TAX_CLEARANCE_MISSING',
  KRA_PIN_MISSING: 'KRA_PIN_MISSING',
  CAPITAL_GAINS_TAX_UNPAID: 'CAPITAL_GAINS_TAX_UNPAID',
  // Time-Based
  STATUTE_BARRED_DEBT: 'STATUTE_BARRED_DEBT',
  DELAYED_FILING: 'DELAYED_FILING',
  // Other
  FAMILY_DISPUTE: 'FAMILY_DISPUTE',
  CRIMINAL_INVESTIGATION: 'CRIMINAL_INVESTIGATION',
  BANKRUPTCY_PENDING: 'BANKRUPTCY_PENDING',
  // System
  DATA_INCONSISTENCY: 'DATA_INCONSISTENCY',
  EXTERNAL_API_FAILURE: 'EXTERNAL_API_FAILURE',
} as const;
export type RiskCategory = (typeof RiskCategory)[keyof typeof RiskCategory];

export const RiskStatus = {
  ACTIVE: 'ACTIVE',
  RESOLVED: 'RESOLVED',
  SUPERSEDED: 'SUPERSEDED',
  EXPIRED: 'EXPIRED',
  DISPUTED: 'DISPUTED',
} as const;
export type RiskStatus = (typeof RiskStatus)[keyof typeof RiskStatus];

// Readiness Status
export const ReadinessStatus = {
  IN_PROGRESS: 'IN_PROGRESS',
  READY_TO_FILE: 'READY_TO_FILE',
  BLOCKED: 'BLOCKED',
} as const;
export type ReadinessStatus = (typeof ReadinessStatus)[keyof typeof ReadinessStatus];

// Filing Confidence
export const FilingConfidence = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  VERY_LOW: 'VERY_LOW',
  BLOCKED: 'BLOCKED',
} as const;
export type FilingConfidence = (typeof FilingConfidence)[keyof typeof FilingConfidence];

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

// Risk Source (from Prisma)
export const RiskSource = {
  FAMILY_SERVICE: 'FAMILY_SERVICE',
  ESTATE_SERVICE: 'ESTATE_SERVICE',
  WILL_SERVICE: 'WILL_SERVICE',
  DOCUMENT_SERVICE: 'DOCUMENT_SERVICE',
  EXTERNAL_REGISTRY: 'EXTERNAL_REGISTRY',
} as const;
export type RiskSource = (typeof RiskSource)[keyof typeof RiskSource];

// Document Gap Type (from DTOs - adjust as needed)
export const DocumentGapType = {
  DEATH_CERTIFICATE: 'DEATH_CERTIFICATE',
  TITLE_DEED: 'TITLE_DEED',
  CHIEFS_LETTER: 'CHIEFS_LETTER',
  WILL_DOCUMENT: 'WILL_DOCUMENT',
  NATIONAL_ID: 'NATIONAL_ID',
  BIRTH_CERTIFICATE: 'BIRTH_CERTIFICATE',
  MARRIAGE_CERTIFICATE: 'MARRIAGE_CERTIFICATE',
  KRA_PIN_CERTIFICATE: 'KRA_PIN_CERTIFICATE',
  BANK_STATEMENT: 'BANK_STATEMENT',
  VEHICLE_LOG_BOOK: 'VEHICLE_LOG_BOOK',
  OTHER: 'OTHER',
} as const;
export type DocumentGapType = (typeof DocumentGapType)[keyof typeof DocumentGapType];

export const DocumentGapSeverity = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
} as const;
export type DocumentGapSeverity = (typeof DocumentGapSeverity)[keyof typeof DocumentGapSeverity];

// ============================================================================
// 2. REQUEST SCHEMAS (Matching DTOs)
// ============================================================================

// --- Initialize Assessment ---
export const InitializeAssessmentRequestSchema = z.object({
  estateId: z.string().uuid(),
  familyId: z.string().uuid(),
});

// --- Update Context ---
export const UpdateContextRequestSchema = z.object({
  regime: z.nativeEnum(SuccessionRegime),
  marriageType: z.nativeEnum(SuccessionMarriageType),
  religion: z.nativeEnum(SuccessionReligion),
  isMinorInvolved: z.boolean(),
  hasDisputedAssets: z.boolean(),
  estimatedComplexityScore: z.number().int().min(1).max(10),
  totalBeneficiaries: z.number().int().min(1),
  estateValueKES: z.number().min(0).optional(),
  isEstateInsolvent: z.boolean(),
  isBusinessAssetsInvolved: z.boolean(),
  isForeignAssetsInvolved: z.boolean(),
  isCharitableBequest: z.boolean(),
  hasDependantsWithDisabilities: z.boolean(),
});

// --- Risk Actions ---
export const ResolveRiskRequestSchema = z.object({
  resolutionNotes: z.string().min(10).max(1000),
});

export const DisputeRiskRequestSchema = z.object({
  reason: z.string().min(20),
});

export const UpdateMitigationRequestSchema = z.object({
  actionTaken: z.string().min(1),
  followUpDate: z.string().datetime().optional(),
});

export const AcknowledgeWarningRequestSchema = z.object({
  notes: z.string().max(255).optional(),
});

// --- Override Strategy ---
export const OverrideStrategyRequestSchema = z.object({
  newStrategy: z.string().min(50),
  reasonForOverride: z.string().min(1),
});

// --- Force Recalculation ---
export const ForceRecalculationRequestSchema = z.object({
  triggerReason: z.string().optional(),
});

// --- Simulation ---
export const SimulateScoreRequestSchema = z.object({
  risksToResolve: z.array(z.string().uuid()).min(1),
});

// --- Complete Assessment ---
export const CompleteAssessmentRequestSchema = z.object({
  confirm: z.boolean(),
});

// ============================================================================
// 3. RESPONSE INTERFACES (Matching DTOs)
// ============================================================================

// --- Document Gap ---
export interface DocumentGapResponse {
  type: DocumentGapType;
  severity: DocumentGapSeverity;
  description: string;
  legalBasis: string;
  obtainingInstructions: string;
  estimatedTimeDays: number;
  alternativeOptions?: string;
  isWaivable: boolean;
  urgencyMessage: string;
}

// --- Risk Detail ---
export interface RiskDetailResponse {
  id: string;
  title: string;
  description: string;
  severity: RiskSeverity;
  category: RiskCategory;
  status: RiskStatus;
  badgeColor: 'red' | 'orange' | 'yellow' | 'green' | 'gray';
  priorityLabel: string;
  icon: string;
  legalBasis: string;
  mitigationSteps: string[];
  daysActive: number;
  isBlocking: boolean;
  linkedEntityId?: string;
}

// --- Checklist ---
export interface ChecklistItem {
  documentName: string;
  description: string;
  isMandatory: boolean;
  isProvided: boolean;
  howToObtain?: string;
  severity: string;
}

export interface ChecklistCategories {
  identity: ChecklistItem[];
  financial: ChecklistItem[];
  courtForms: ChecklistItem[];
  supporting: ChecklistItem[];
}

export interface FilingChecklistResponse {
  readyToPrint: boolean;
  mandatoryMissingCount: number;
  totalProgress: number;
  categories: ChecklistCategories;
}

// --- Readiness Dashboard ---
export interface ReadinessDashboardResponse {
  assessmentId: string;
  estateId: string;
  lastUpdated: string;
  score: number;
  statusLabel: string;
  statusColor: 'green' | 'yellow' | 'orange' | 'red';
  confidenceLevel: string;
  summaryMessage: string;
  nextBestAction: string;
  totalRisks: number;
  criticalRisks: number;
  topRisks: RiskDetailResponse[];
  caseContext: {
    courtJurisdiction: string;
    applicationType: string;
    estimatedTimeline: string;
    isComplex: boolean;
  };
}

// --- Strategy Roadmap ---
export interface Milestone {
  title: string;
  isCompleted: boolean;
  blockers: string[];
}

export interface StrategyRoadmapResponse {
  strategyContent: string;
  milestones: Milestone[];
  filingFeeEstimate: number;
}

// --- Simulation Result ---
export interface SimulationResultResponse {
  currentScore: number;
  projectedScore: number;
  scoreImprovement: number;
  newStatusLabel: string;
  willBeReadyToFile: boolean;
  remainingBlockersCount: number;
}

// ============================================================================
// 4. INFERRED INPUT TYPES
// ============================================================================
export type InitializeAssessmentInput = z.infer<typeof InitializeAssessmentRequestSchema>;
export type UpdateContextInput = z.infer<typeof UpdateContextRequestSchema>;
export type ResolveRiskInput = z.infer<typeof ResolveRiskRequestSchema>;
export type DisputeRiskInput = z.infer<typeof DisputeRiskRequestSchema>;
export type UpdateMitigationInput = z.infer<typeof UpdateMitigationRequestSchema>;
export type AcknowledgeWarningInput = z.infer<typeof AcknowledgeWarningRequestSchema>;
export type OverrideStrategyInput = z.infer<typeof OverrideStrategyRequestSchema>;
export type ForceRecalculationInput = z.infer<typeof ForceRecalculationRequestSchema>;
export type SimulateScoreInput = z.infer<typeof SimulateScoreRequestSchema>;
export type CompleteAssessmentInput = z.infer<typeof CompleteAssessmentRequestSchema>;