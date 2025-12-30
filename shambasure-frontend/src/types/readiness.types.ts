import { z } from 'zod';

// ============================================================================
// 1. SHARED ENUMS
// ============================================================================

export const SuccessionRegime = {
  TESTATE: 'TESTATE',
  INTESTATE: 'INTESTATE',
  PARTIALLY_INTESTATE: 'PARTIALLY_INTESTATE',
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
  CHRISTIAN: 'CHRISTIAN',
  ISLAMIC: 'ISLAMIC', // Triggers Kadhis Court logic
  HINDU: 'HINDU',
  AFRICAN_CUSTOMARY: 'AFRICAN_CUSTOMARY',
  STATUTORY: 'STATUTORY', // Civil
} as const;
export type SuccessionReligion = (typeof SuccessionReligion)[keyof typeof SuccessionReligion];

export const RiskSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL', // Blocker
} as const;
export type RiskSeverity = (typeof RiskSeverity)[keyof typeof RiskSeverity];

export const RiskCategory = {
  MISSING_DOCUMENT: 'MISSING_DOCUMENT',
  CONSENT_REQUIRED: 'CONSENT_REQUIRED',
  ASSET_DISPUTE: 'ASSET_DISPUTE',
  MINOR_BENEFICIARY: 'MINOR_BENEFICIARY', // Needs Guardian
  TAX_COMPLIANCE: 'TAX_COMPLIANCE',
  STATUTORY_LIMITATION: 'STATUTORY_LIMITATION', // > 6 months since death
} as const;
export type RiskCategory = (typeof RiskCategory)[keyof typeof RiskCategory];

export const RiskStatus = {
  ACTIVE: 'ACTIVE',
  RESOLVED: 'RESOLVED',
  DISPUTED: 'DISPUTED',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
} as const;
export type RiskStatus = (typeof RiskStatus)[keyof typeof RiskStatus];

export const DocumentGapSeverity = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
} as const;
export type DocumentGapSeverity = (typeof DocumentGapSeverity)[keyof typeof DocumentGapSeverity];

export const DocumentGapType = {
  DEATH_CERTIFICATE: 'DEATH_CERTIFICATE',
  TITLE_DEED: 'TITLE_DEED',
  CHIEFS_LETTER: 'CHIEFS_LETTER',
  WILL_DOCUMENT: 'WILL_DOCUMENT',
  // ... others
} as const;
export type DocumentGapType = (typeof DocumentGapType)[keyof typeof DocumentGapType];

// ============================================================================
// 2. REQUEST SCHEMAS (Forms)
// ============================================================================

// --- Initialize ---
export const InitializeAssessmentRequestSchema = z.object({
  estateId: z.string().uuid(),
  familyId: z.string().uuid(),
});

// --- Context Update ---
export const UpdateContextRequestSchema = z.object({
  regime: z.nativeEnum(SuccessionRegime),
  marriageType: z.nativeEnum(SuccessionMarriageType),
  religion: z.nativeEnum(SuccessionReligion),
  isMinorInvolved: z.boolean(),
  hasDisputedAssets: z.boolean(),
  estimatedComplexityScore: z.number().min(1).max(10),
  totalBeneficiaries: z.number().min(1),
  estateValueKES: z.number().optional(),
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
  followUpDate: z.string().optional(), // ISO Date
});

export const AcknowledgeWarningRequestSchema = z.object({
  notes: z.string().max(255).optional(),
});

// --- Simulation ---
export const SimulateScoreRequestSchema = z.object({
  risksToResolve: z.array(z.string().uuid()).min(1),
});

// --- Completion ---
export const CompleteAssessmentRequestSchema = z.object({
  confirm: z.boolean(),
});

// ============================================================================
// 3. RESPONSE INTERFACES
// ============================================================================

// --- Dashboard ---
export interface RiskDetailResponse {
  id: string;
  title: string;
  description: string;
  severity: RiskSeverity;
  category: RiskCategory;
  status: RiskStatus;
  badgeColor: string;
  priorityLabel: string;
  icon: string;
  legalBasis: string;
  mitigationSteps: string[];
  daysActive: number;
  isBlocking: boolean;
  linkedEntityId?: string;
}

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

// --- Strategy ---
export interface Milestone {
  title: string;
  isCompleted: boolean;
  blockers: string[];
}

export interface StrategyRoadmapResponse {
  strategyContent: string; // Markdown
  milestones: Milestone[];
  filingFeeEstimate: number;
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

// --- Simulation ---
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
export type SimulateScoreInput = z.infer<typeof SimulateScoreRequestSchema>;