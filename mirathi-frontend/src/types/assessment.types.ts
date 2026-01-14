// types/assessment.types.ts
import { z } from 'zod';

// ============================================================================
// 1. ENUMS (Object Literal Pattern)
// ============================================================================

export const ReadinessStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  READY: 'READY',
  COMPLETE: 'COMPLETE',
} as const;
export type ReadinessStatus = (typeof ReadinessStatus)[keyof typeof ReadinessStatus];

export const RiskSeverity = {
  INFO: 'INFO',
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
export type RiskSeverity = (typeof RiskSeverity)[keyof typeof RiskSeverity];

export const RiskCategory = {
  MISSING_DOCUMENT: 'MISSING_DOCUMENT',
  INVALID_DOCUMENT: 'INVALID_DOCUMENT',
  MINOR_WITHOUT_GUARDIAN: 'MINOR_WITHOUT_GUARDIAN',
  MISSING_VALUATION: 'MISSING_VALUATION',
  JURISDICTION_ISSUE: 'JURISDICTION_ISSUE',
  TAX_CLEARANCE: 'TAX_CLEARANCE',
  FAMILY_DISPUTE: 'FAMILY_DISPUTE',
  WITNESS_ISSUE: 'WITNESS_ISSUE',
  EXECUTOR_ISSUE: 'EXECUTOR_ISSUE',
  OTHER: 'OTHER',
} as const;
export type RiskCategory = (typeof RiskCategory)[keyof typeof RiskCategory];

// ============================================================================
// 2. DOMAIN INTERFACES
// ============================================================================

export interface RiskFlag {
  id: string;
  severity: RiskSeverity;
  category: RiskCategory;
  title: string;
  description: string;
  legalBasis?: string;
  isResolved: boolean;
  resolutionSteps: string[];
  isBlocking: boolean;
}

export interface ReadinessScore {
  overall: number;
  document: number;
  legal: number;
  family: number;
  financial: number;
  status: ReadinessStatus;
  canGenerateForms: boolean;
}

export interface SuccessionAssessment {
  id: string;
  userId: string;
  estateId: string;
  regime: string;
  targetCourt: string;
  isComplexCase: boolean;
  score: ReadinessScore;
  risks: RiskFlag[];
  nextStep?: string;
  estimatedDays?: number;
  criticalRisksCount: number;
  totalRisksCount: number;
}

export interface QuickAssessment {
  score: number;
  status: ReadinessStatus;
  nextStep: string;
  criticalRisks: number;
  estimatedDays: number;
}

export interface AssetSummary {
  grossValue: number;
  netValue: number;
  totalDebts: number;
  isInsolvent: boolean;
  estimatedCourtFees: number;
  assetRisks: string[];
  hasLand: boolean;
  hasShares: boolean;
  hasEncumberedAssets: boolean;
}

export interface LegalRequirement {
  name: string;
  description: string;
  legalBasis: string;
  category: RiskCategory;
  severity: RiskSeverity;
  isMandatoryForFiling: boolean;
  isRegistryBlocker: boolean;
}

// ============================================================================
// 3. ZOD SCHEMAS
// ============================================================================

export const SuccessionAssessmentRequestSchema = z.object({
  estateId: z.string().uuid(),
});

export const ResolveRiskRequestSchema = z.object({
  resolutionNotes: z.string().min(1, 'Resolution notes are required'),
});

export type ResolveRiskInput = z.infer<typeof ResolveRiskRequestSchema>;