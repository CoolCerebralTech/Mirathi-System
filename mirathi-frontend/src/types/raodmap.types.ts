import { z } from 'zod';

// ============================================================================
// 1. SHARED ENUMS
// ============================================================================

export const RoadmapPhase = {
  PRE_FILING: 'PRE_FILING',
  FILING_AND_NOTICE: 'FILING_AND_NOTICE',
  GRANT_PROCESSING: 'GRANT_PROCESSING',
  ASSET_COLLECTION: 'ASSET_COLLECTION',
  DISTRIBUTION: 'DISTRIBUTION',
  CLOSING: 'CLOSING',
} as const;
export type RoadmapPhase = (typeof RoadmapPhase)[keyof typeof RoadmapPhase];

export const TaskStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED',
  BLOCKED: 'BLOCKED',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const TaskCategory = {
  DOCUMENT_COLLECTION: 'DOCUMENT_COLLECTION',
  COURT_FILING: 'COURT_FILING',
  PAYMENT: 'PAYMENT',
  ASSET_MANAGEMENT: 'ASSET_MANAGEMENT',
  COMMUNICATION: 'COMMUNICATION',
} as const;
export type TaskCategory = (typeof TaskCategory)[keyof typeof TaskCategory];

export const ProofType = {
  DOCUMENT_UPLOAD: 'DOCUMENT_UPLOAD',
  COURT_RECEIPT: 'COURT_RECEIPT',
  BANK_SLIP: 'BANK_SLIP',
  SIMPLE_CONFIRMATION: 'SIMPLE_CONFIRMATION',
  DIGITAL_SIGNATURE: 'DIGITAL_SIGNATURE',
} as const;
export type ProofType = (typeof ProofType)[keyof typeof ProofType];

// ============================================================================
// 2. REQUEST SCHEMAS (Forms)
// ============================================================================

// --- Lifecycle ---
export const GenerateRoadmapRequestSchema = z.object({
  estateId: z.string().uuid(),
  readinessAssessmentId: z.string().uuid(),
  executorId: z.string().uuid(),
  executorName: z.string().min(1),
  estateValueKES: z.number().min(0),
});

// --- Task Execution ---
export const SubmitTaskProofRequestSchema = z.object({
  proofType: z.nativeEnum(ProofType),
  documentId: z.string().optional(), // Required if DOCUMENT_UPLOAD
  transactionReference: z.string().optional(), // Required if PAYMENT
  notes: z.string().optional(),
  additionalMetadata: z.record(z.any()).optional(),
}).superRefine((data, ctx) => {
  if (data.proofType === 'DOCUMENT_UPLOAD' && !data.documentId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Document is required", path: ["documentId"] });
  }
  if ((data.proofType === 'COURT_RECEIPT' || data.proofType === 'BANK_SLIP') && !data.transactionReference) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Reference number is required", path: ["transactionReference"] });
  }
});

export const SkipTaskRequestSchema = z.object({
  reason: z.string().min(5, "Reason is required to skip a task"),
});

export const LinkRiskRequestSchema = z.object({
  riskId: z.string().uuid(),
  blockingTaskIds: z.array(z.string().uuid()),
  reason: z.string(),
});

// --- Filters ---
export interface TaskFilterParams {
  phase?: RoadmapPhase;
  status?: TaskStatus[];
  priority?: TaskPriority;
  category?: TaskCategory;
  isOverdue?: boolean;
  page?: number;
  limit?: number;
}

// ============================================================================
// 3. RESPONSE INTERFACES
// ============================================================================

// --- Dashboard ---
export interface PhaseProgress {
  phase: RoadmapPhase;
  name: string;
  percentComplete: number;
  status: 'LOCKED' | 'ACTIVE' | 'COMPLETED';
  totalTasks: number;
  completedTasks: number;
}

export interface RoadmapDashboardResponse {
  id: string;
  estateId: string;
  executorName: string;
  status: string;
  overallProgress: number;
  currentPhase: RoadmapPhase;
  daysActive: number;
  healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  statusColor: string;
  phases: PhaseProgress[];
  nextAction?: {
    taskId: string;
    title: string;
    description: string;
    priority: TaskPriority;
    dueDate?: string;
  };
  alerts: Array<{ type: string; message: string; severity: string; linkTo?: string }>;
}

// --- Analytics ---
export interface RoadmapAnalyticsResponse {
  totalDurationDays: number;
  daysRemaining: number;
  isOnTrack: boolean;
  estimatedCostKES: number;
  efficiencyScore: number;
  riskExposure: number;
  predictedBottlenecks: string[];
  recommendedAccelerations: string[];
}

// --- Tasks ---
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
  urgencyScore: number;
  isLocked: boolean;
}

export interface TaskDetailResponse extends TaskSummaryResponse {
  description: string;
  detailedInstructions: string[];
  quickTips: string[];
  commonMistakes: string[];
  externalLinks: Array<{ title: string; url: string }>;
  legalReferences: Array<{ act: string; section: string; description: string }>;
  requiresProof: boolean;
  proofTypes: ProofType[];
  dependencies: Array<{ id: string; isMet: boolean }>;
  completedAt?: string;
  completedBy?: string;
  historyLog: Array<{ action: string; date: string; user: string }>;
}

// ============================================================================
// 4. INFERRED TYPES
// ============================================================================
export type GenerateRoadmapInput = z.infer<typeof GenerateRoadmapRequestSchema>;
export type SubmitProofInput = z.infer<typeof SubmitTaskProofRequestSchema>;
export type SkipTaskInput = z.infer<typeof SkipTaskRequestSchema>;