// roadmap.types.ts
import { z } from 'zod';

// ============================================================================
// 1. SHARED ENUMS (From Prisma Schema)
// ============================================================================

// Roadmap Phase
export const RoadmapPhase = {
  PRE_FILING: 'PRE_FILING',
  FILING: 'FILING',
  CONFIRMATION: 'CONFIRMATION',
  DISTRIBUTION: 'DISTRIBUTION',
  CLOSURE: 'CLOSURE',
} as const;
export type RoadmapPhase = (typeof RoadmapPhase)[keyof typeof RoadmapPhase];

// Roadmap Status
export const RoadmapStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  BLOCKED: 'BLOCKED',
  COMPLETED: 'COMPLETED',
  ABANDONED: 'ABANDONED',
  ESCALATED: 'ESCALATED',
} as const;
export type RoadmapStatus = (typeof RoadmapStatus)[keyof typeof RoadmapStatus];

// Task Status
export const TaskStatus = {
  LOCKED: 'LOCKED',
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED',
  WAIVED: 'WAIVED',
  BLOCKED: 'BLOCKED',
  FAILED: 'FAILED',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

// Task Priority
export const TaskPriority = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
} as const;
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

// Task Trigger
export const TaskTrigger = {
  MANUAL: 'MANUAL',
  AUTOMATIC: 'AUTOMATIC',
  EVENT_DRIVEN: 'EVENT_DRIVEN',
  SCHEDULED: 'SCHEDULED',
  READINESS_BASED: 'READINESS_BASED',
} as const;
export type TaskTrigger = (typeof TaskTrigger)[keyof typeof TaskTrigger];

// Proof Type
export const ProofType = {
  DOCUMENT_UPLOAD: 'DOCUMENT_UPLOAD',
  DIGITAL_SIGNATURE: 'DIGITAL_SIGNATURE',
  SMS_VERIFICATION: 'SMS_VERIFICATION',
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
  COURT_RECEIPT: 'COURT_RECEIPT',
  BANK_SLIP: 'BANK_SLIP',
  WITNESS_SIGNATURE: 'WITNESS_SIGNATURE',
  AFFIDAVIT: 'AFFIDAVIT',
} as const;
export type ProofType = (typeof ProofType)[keyof typeof ProofType];

// Task Category (selected common categories - full list from Prisma)
export const TaskCategory = {
  IDENTITY_VERIFICATION: 'IDENTITY_VERIFICATION',
  FAMILY_STRUCTURE: 'FAMILY_STRUCTURE',
  GUARDIANSHIP: 'GUARDIANSHIP',
  ASSET_DISCOVERY: 'ASSET_DISCOVERY',
  DEBT_SETTLEMENT: 'DEBT_SETTLEMENT',
  DOCUMENT_COLLECTION: 'DOCUMENT_COLLECTION',
  DOCUMENT_VALIDATION: 'DOCUMENT_VALIDATION',
  FORM_GENERATION: 'FORM_GENERATION',
  FORM_REVIEW: 'FORM_REVIEW',
  SIGNATURE_COLLECTION: 'SIGNATURE_COLLECTION',
  COURT_SELECTION: 'COURT_SELECTION',
  FEE_PAYMENT: 'FEE_PAYMENT',
  LODGEMENT: 'LODGEMENT',
  GAZETTE_PUBLICATION: 'GAZETTE_PUBLICATION',
  COURT_ATTENDANCE: 'COURT_ATTENDANCE',
  GRANT_ISSUANCE: 'GRANT_ISSUANCE',
  ASSET_TRANSFER: 'ASSET_TRANSFER',
  DEBT_PAYMENT: 'DEBT_PAYMENT',
  TAX_CLEARANCE: 'TAX_CLEARANCE',
  FINAL_ACCOUNTS: 'FINAL_ACCOUNTS',
  ESTATE_CLOSURE: 'ESTATE_CLOSURE',
} as const;
export type TaskCategory = (typeof TaskCategory)[keyof typeof TaskCategory];

// Escalation Reason Category
export const EscalationReasonCategory = {
  LEGAL_CLARIFICATION: 'LEGAL_CLARIFICATION',
  COURT_DELAY: 'COURT_DELAY',
  FAMILY_DISPUTE: 'FAMILY_DISPUTE',
  DOCUMENT_UNOBTAINABLE: 'DOCUMENT_UNOBTAINABLE',
} as const;
export type EscalationReasonCategory = (typeof EscalationReasonCategory)[keyof typeof EscalationReasonCategory];

// Optimization Focus
export const OptimizationFocus = {
  SPEED: 'SPEED',
  COST: 'COST',
  LEGAL_SAFETY: 'LEGAL_SAFETY',
} as const;
export type OptimizationFocus = (typeof OptimizationFocus)[keyof typeof OptimizationFocus];

// Sort Order
export const SortOrder = {
  ASC: 'ASC',
  DESC: 'DESC',
} as const;
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];

// Sort By Options
export const SortBy = {
  DUE_DATE: 'dueDate',
  PRIORITY: 'priority',
  STATUS: 'status',
  ORDER_INDEX: 'orderIndex',
} as const;
export type SortBy = (typeof SortBy)[keyof typeof SortBy];

// ============================================================================
// 2. REQUEST SCHEMAS (Matching DTOs)
// ============================================================================

// --- Lifecycle ---
export const GenerateRoadmapRequestSchema = z.object({
  estateId: z.string().uuid(),
  readinessAssessmentId: z.string().uuid(),
  executorId: z.string().uuid(),
  executorName: z.string().min(1),
  estateValueKES: z.number().min(0),
});

export const RegenerateRoadmapRequestSchema = z.object({
  reason: z.string().min(1),
  updatedEstateValueKES: z.number().min(0).optional(),
});

export const OptimizeRoadmapRequestSchema = z.object({
  optimizationFocus: z.nativeEnum(OptimizationFocus).optional(),
});

// --- Phase Management ---
export const TransitionPhaseRequestSchema = z.object({
  currentPhase: z.nativeEnum(RoadmapPhase),
});

// --- Risk Integration ---
export const LinkRiskRequestSchema = z.object({
  riskId: z.string().uuid(),
  blockingTaskIds: z.array(z.string().uuid()).min(1),
  reason: z.string().min(1),
});

// --- Task Execution ---
export const SubmitTaskProofRequestSchema = z.object({
  proofType: z.nativeEnum(ProofType),
  documentId: z.string().uuid().optional(),
  transactionReference: z.string().optional(),
  additionalMetadata: z.record(z.string(), z.unknown()).optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    if (data.proofType === ProofType.DOCUMENT_UPLOAD && !data.documentId) {
      return false;
    }
    if (
      (data.proofType === ProofType.COURT_RECEIPT || data.proofType === ProofType.BANK_SLIP) &&
      !data.transactionReference
    ) {
      return false;
    }
    return true;
  },
  {
    message: 'Missing required fields for proof type',
    path: ['proofType'],
  },
);

export const SkipTaskRequestSchema = z.object({
  reason: z.string().min(1),
});

export const WaiveTaskRequestSchema = z.object({
  reason: z.string().min(1),
  courtOrderReference: z.string().optional(),
});

export const EscalateTaskRequestSchema = z.object({
  reasonCategory: z.nativeEnum(EscalationReasonCategory),
  userNotes: z.string().min(1),
});

// --- Task Filter ---
export const TaskFilterRequestSchema = z.object({
  phase: z.nativeEnum(RoadmapPhase).optional(),
  status: z.union([z.nativeEnum(TaskStatus), z.array(z.nativeEnum(TaskStatus))]).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  category: z.nativeEnum(TaskCategory).optional(),
  isOverdue: z.boolean().optional(),
  dueWithinDays: z.number().int().min(1).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.nativeEnum(SortBy).default(SortBy.ORDER_INDEX),
  sortOrder: z.nativeEnum(SortOrder).default(SortOrder.ASC),
});

// ============================================================================
// 3. RESPONSE INTERFACES (Matching DTOs)
// ============================================================================

// --- Phase Progress ---
export interface PhaseProgressResponse {
  phase: RoadmapPhase;
  name: string;
  percentComplete: number;
  status: 'LOCKED' | 'ACTIVE' | 'COMPLETED';
  totalTasks: number;
  completedTasks: number;
}

// --- Next Action ---
export interface NextActionResponse {
  taskId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate?: string;
}

// --- Dashboard Alert ---
export interface DashboardAlertResponse {
  type: 'RISK' | 'OVERDUE' | 'BLOCKED';
  message: string;
  severity: 'HIGH' | 'CRITICAL';
  linkTo?: string;
}

// --- Roadmap Dashboard ---
export interface RoadmapDashboardResponse {
  id: string;
  estateId: string;
  executorName: string;
  status: RoadmapStatus;
  overallProgress: number;
  currentPhase: RoadmapPhase;
  daysActive: number;
  healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  statusColor: string;
  phases: PhaseProgressResponse[];
  nextAction?: NextActionResponse;
  alerts: DashboardAlertResponse[];
}

// --- Roadmap Analytics ---
export interface RoadmapAnalyticsResponse {
  estimatedCompletionDate?: string;
  totalDurationDays: number;
  daysRemaining: number;
  isOnTrack: boolean;
  estimatedCostKES: number;
  costBreakdown: string;
  efficiencyScore: number;
  complexityScore: number;
  riskExposure: number;
  predictedBottlenecks: string[];
  recommendedAccelerations: string[];
  percentileRanking?: number;
}

// --- External Link ---
export interface ExternalLinkResponse {
  title: string;
  url: string;
  type: string;
}

// --- Legal Reference ---
export interface LegalReferenceResponse {
  act: string;
  section: string;
  description: string;
}

// --- Dependency Status ---
export interface DependencyStatusResponse {
  id: string;
  isMet: boolean;
}

// --- History Entry ---
export interface HistoryEntryResponse {
  action: string;
  date: string;
  user: string;
  details?: string;
}

// --- Task Summary ---
export interface TaskSummaryResponse {
  id: string;
  shortCode: string;
  title: string;
  category: TaskCategory;
  phase: number;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  isOverdue: boolean;
  daysRemaining?: number;
  statusIcon: string;
  urgencyScore: number;
  isLocked: boolean;
}

// --- Task Detail ---
export interface TaskDetailResponse extends TaskSummaryResponse {
  description: string;
  detailedInstructions: string[];
  quickTips: string[];
  commonMistakes: string[];
  externalLinks: ExternalLinkResponse[];
  legalReferences: LegalReferenceResponse[];
  requiresProof: boolean;
  proofTypes: ProofType[];
  proofDocumentType?: string;
  dependencies: DependencyStatusResponse[];
  completedAt?: string;
  completedBy?: string;
  completionNotes?: string;
  historyLog: HistoryEntryResponse[];
}

// --- Pagination Meta ---
export interface PaginationMetaResponse {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
}

// --- Task List ---
export interface TaskListResponse {
  items: TaskSummaryResponse[];
  meta: PaginationMetaResponse;
}

// ============================================================================
// 4. INFERRED TYPES
// ============================================================================
export type GenerateRoadmapInput = z.infer<typeof GenerateRoadmapRequestSchema>;
export type RegenerateRoadmapInput = z.infer<typeof RegenerateRoadmapRequestSchema>;
export type OptimizeRoadmapInput = z.infer<typeof OptimizeRoadmapRequestSchema>;
export type TransitionPhaseInput = z.infer<typeof TransitionPhaseRequestSchema>;
export type LinkRiskInput = z.infer<typeof LinkRiskRequestSchema>;
export type SubmitTaskProofInput = z.infer<typeof SubmitTaskProofRequestSchema>;
export type SkipTaskInput = z.infer<typeof SkipTaskRequestSchema>;
export type WaiveTaskInput = z.infer<typeof WaiveTaskRequestSchema>;
export type EscalateTaskInput = z.infer<typeof EscalateTaskRequestSchema>;
export type TaskFilterInput = z.infer<typeof TaskFilterRequestSchema>;