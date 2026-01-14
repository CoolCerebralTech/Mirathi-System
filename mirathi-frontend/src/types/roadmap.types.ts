// types/roadmap.types.ts
import { z } from 'zod';

// ============================================================================
// 1. ENUMS (Object Literal Pattern for Maximum Compatibility)
// ============================================================================

export const RoadmapPhase = {
  PRE_FILING: 'PRE_FILING',
  FILING: 'FILING',
  COURT_PROCESS: 'COURT_PROCESS',
  GRANT_ISSUANCE: 'GRANT_ISSUANCE',
  DISTRIBUTION: 'DISTRIBUTION',
} as const;
export type RoadmapPhase = (typeof RoadmapPhase)[keyof typeof RoadmapPhase];

export const TaskStatus = {
  LOCKED: 'LOCKED',
  AVAILABLE: 'AVAILABLE',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED',
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskCategory = {
  IDENTITY_VERIFICATION: 'IDENTITY_VERIFICATION',
  ASSET_DISCOVERY: 'ASSET_DISCOVERY',
  DEBT_SETTLEMENT: 'DEBT_SETTLEMENT',
  DOCUMENT_COLLECTION: 'DOCUMENT_COLLECTION',
  VALUATION: 'VALUATION',
  LEGAL_REQUIREMENT: 'LEGAL_REQUIREMENT',
  COURT_FILING: 'COURT_FILING',
  FAMILY_CONSENT: 'FAMILY_CONSENT',
  GUARDIANSHIP: 'GUARDIANSHIP',
  TAX_COMPLIANCE: 'TAX_COMPLIANCE',
} as const;
export type TaskCategory = (typeof TaskCategory)[keyof typeof TaskCategory];

// ============================================================================
// 2. DOMAIN INTERFACES
// ============================================================================

export interface RoadmapTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  category: TaskCategory;
  phase: RoadmapPhase;
  orderIndex: number;
  dependsOnTaskIds: string[];
  whatIsIt?: string;
  whyNeeded?: string;
  howToGet?: string;
  estimatedDays?: number;
  completedAt?: string;
  notes?: string;
}

export interface RoadmapPhaseOverview {
  phase: RoadmapPhase;
  totalTasks: number;
  completed: number;
  available: number;
  inProgress: number;
  locked: number;
  progressPercentage: number;
  estimatedDays: number;
  tasks: RoadmapTask[];
}

export interface ExecutorRoadmap {
  id: string;
  userId: string;
  estateId: string;
  currentPhase: RoadmapPhase;
  overallProgress: number;
  totalTasks: number;
  completedTasks: number;
  availableTasks: number;
  lockedTasks: number;
  estimatedDays?: number;
  startedAt: string;
  estimatedCompletion?: string;
  tasks: RoadmapTask[];
  currentPhaseTasks: RoadmapTask[];
  nextPhase?: RoadmapPhase;
}

export interface TaskCompletionResult {
  completedTask: RoadmapTask;
  unlockedTasks: RoadmapTask[];
  phaseChanged: boolean;
  newPhase?: RoadmapPhase;
}

export interface RecommendedTasksResponse {
  tasks: RoadmapTask[];
  priorityTaskCount: number;
}

// ============================================================================
// 3. ZOD SCHEMAS
// ============================================================================

export const StartTaskSchema = z.object({
  notes: z.string().optional(),
});

export const CompleteTaskSchema = z.object({
  notes: z.string().optional(),
});

export const SkipTaskSchema = z.object({
  reason: z.string().min(5, 'Reason is required to skip a task'),
});

// ============================================================================
// 4. INFERRED INPUT TYPES
// ============================================================================
export type StartTaskInput = z.infer<typeof StartTaskSchema>;
export type CompleteTaskInput = z.infer<typeof CompleteTaskSchema>;
export type SkipTaskInput = z.infer<typeof SkipTaskSchema>;