// src/succession-automation/src/domain/events/roadmap.events.ts
import { RoadmapPhase, RoadmapStatus } from '../aggregates/executor-roadmap.aggregate';
import { DomainEvent } from '../base/domain-event';
import { TaskPriority, TaskStatus } from '../entities/roadmap-task.entity';
import { SuccessionContext } from '../value-objects/succession-context.vo';

// ==================== ROADMAP LIFECYCLE EVENTS ====================

export class RoadmapTaskStartedEvent extends DomainEvent<{
  taskId: string;
  title: string;
  startedBy: string;
  phase: RoadmapPhase;
  startedAt: Date;
}> {
  constructor(
    aggregateId: string,
    version: number,
    payload: {
      taskId: string;
      title: string;
      startedBy: string;
      phase: RoadmapPhase;
      startedAt: Date;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, 'ExecutorRoadmap', version, payload, occurredAt);
  }
}

/**
 * Event: Roadmap Task Completed
 *
 * Emitted when an executor completes a roadmap task.
 *
 * Legal Significance: Documents task completion.
 * Required for progress tracking and audit trail.
 */
export class RoadmapTaskCompletedEvent extends DomainEvent<{
  taskId: string;
  title: string;
  completedBy: string;
  phase: RoadmapPhase;
  timeSpentMinutes: number;
  completionNotes?: string;
  completedAt: Date;
}> {
  constructor(
    aggregateId: string,
    version: number,
    payload: {
      taskId: string;
      title: string;
      completedBy: string;
      phase: RoadmapPhase;
      timeSpentMinutes: number;
      completionNotes?: string;
      completedAt: Date;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, 'ExecutorRoadmap', version, payload, occurredAt);
  }
}
/**
 * Event: Roadmap Created
 *
 * Emitted when a new executor roadmap is created for an estate.
 */
export class RoadmapCreated extends DomainEvent<{
  roadmapId: string;
  estateId: string;
  readinessAssessmentId: string;
  successionContext: ReturnType<SuccessionContext['toJSON']>;
  userId: string;
  executorName: string;
  createdAt: Date;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      roadmapId: string;
      estateId: string;
      readinessAssessmentId: string;
      successionContext: ReturnType<SuccessionContext['toJSON']>;
      userId: string;
      executorName: string;
      createdAt: Date;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

/**
 * Event: Roadmap Completed
 *
 * Emitted when all roadmap phases and tasks are completed.
 */
export class RoadmapCompleted extends DomainEvent<{
  roadmapId: string;
  estateId: string;
  completedAt: Date;
  totalTasks: number;
  completedTasks: number;
  skippedTasks: number;
  totalTimeSpentHours: number;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      roadmapId: string;
      estateId: string;
      completedAt: Date;
      totalTasks: number;
      completedTasks: number;
      skippedTasks: number;
      totalTimeSpentHours: number;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

/**
 * Event: Roadmap Optimized
 *
 * Emitted when AI optimization recalculates task dependencies and timelines.
 */
export class RoadmapOptimized extends DomainEvent<{
  roadmapId: string;
  estateId: string;
  optimizationCount: number;
  optimizedAt: Date;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      roadmapId: string;
      estateId: string;
      optimizationCount: number;
      optimizedAt: Date;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

/**
 * Event: Roadmap Regenerated
 *
 * Emitted when significant context changes require complete roadmap regeneration.
 */
export class RoadmapRegenerated extends DomainEvent<{
  roadmapId: string;
  estateId: string;
  oldContext: ReturnType<SuccessionContext['toJSON']>;
  newContext: ReturnType<SuccessionContext['toJSON']>;
  totalTasks: number;
  carriedOverTasks: number;
  regeneratedAt: Date;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      roadmapId: string;
      estateId: string;
      oldContext: ReturnType<SuccessionContext['toJSON']>;
      newContext: ReturnType<SuccessionContext['toJSON']>;
      totalTasks: number;
      carriedOverTasks: number;
      regeneratedAt: Date;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

// ==================== PHASE MANAGEMENT EVENTS ====================

/**
 * Event: Phase Transitioned
 *
 * Emitted when moving from one succession phase to another.
 */
export class PhaseTransitioned extends DomainEvent<{
  roadmapId: string;
  estateId: string;
  fromPhase: RoadmapPhase;
  toPhase: RoadmapPhase;
  transitionedAt: Date;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      roadmapId: string;
      estateId: string;
      fromPhase: RoadmapPhase;
      toPhase: RoadmapPhase;
      transitionedAt: Date;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

/**
 * Event: All Phase Tasks Completed
 *
 * Emitted when all tasks in a phase are completed/skipped.
 */
export class AllPhaseTasksCompleted extends DomainEvent<{
  roadmapId: string;
  estateId: string;
  phase: RoadmapPhase;
  totalTasks: number;
  completedAt: Date;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      roadmapId: string;
      estateId: string;
      phase: RoadmapPhase;
      totalTasks: number;
      completedAt: Date;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

// ==================== TASK MANAGEMENT EVENTS ====================

/**
 * Event: Task Assigned
 *
 * Emitted when a new task is added to the roadmap.
 */
export class TaskAssigned extends DomainEvent<{
  roadmapId: string;
  estateId: string;
  taskId: string;
  taskTitle: string;
  phase: RoadmapPhase;
  priority: TaskPriority;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      roadmapId: string;
      estateId: string;
      taskId: string;
      taskTitle: string;
      phase: RoadmapPhase;
      priority: TaskPriority;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

/**
 * Event: Task Auto-Completed
 *
 * Emitted when system automatically completes a task.
 */
export class TaskAutoCompleted extends DomainEvent<{
  roadmapId: string;
  estateId: string;
  taskId: string;
  taskTitle: string;
  reason: string;
  completedAt: Date;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      roadmapId: string;
      estateId: string;
      taskId: string;
      taskTitle: string;
      reason: string;
      completedAt: Date;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

/**
 * Event: Task Dependencies Updated
 *
 * Emitted when task dependency relationships are recalculated.
 */
export class TaskDependenciesUpdated extends DomainEvent<{
  roadmapId: string;
  estateId: string;
  updatedTaskCount: number;
  updatedAt: Date;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      roadmapId: string;
      estateId: string;
      updatedTaskCount: number;
      updatedAt: Date;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

// ==================== RISK INTEGRATION EVENTS ====================

/**
 * Event: Risk Blocking Task
 *
 * Emitted when an identified risk blocks a roadmap task.
 */
export class RiskBlockingTask extends DomainEvent<{
  roadmapId: string;
  estateId: string;
  taskId: string;
  taskTitle: string;
  riskId?: string;
  reason: string;
  blockedAt: Date;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      roadmapId: string;
      estateId: string;
      taskId: string;
      taskTitle: string;
      riskId?: string;
      reason: string;
      blockedAt: Date;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

// ==================== ANALYTICS & OPTIMIZATION EVENTS ====================

/**
 * Event: Critical Path Identified
 *
 * Emitted when AI identifies the critical path (tasks with highest impact).
 */
export class CriticalPathIdentified extends DomainEvent<{
  roadmapId: string;
  estateId: string;
  criticalTaskCount: number;
  criticalTasks: {
    id: string;
    title: string;
    priority: TaskPriority;
    status: TaskStatus;
  }[];
  identifiedAt: Date;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      roadmapId: string;
      estateId: string;
      criticalTaskCount: number;
      criticalTasks: {
        id: string;
        title: string;
        priority: TaskPriority;
        status: TaskStatus;
      }[];
      identifiedAt: Date;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

// ==================== ADDITIONAL EVENTS NEEDED FOR AGGREGATE ====================

/**
 * Event: Task Unlocked
 *
 * Emitted when task dependencies are met and task becomes available.
 */
export class TaskUnlocked extends DomainEvent<{
  roadmapId: string;
  estateId: string;
  taskId: string;
  taskTitle: string;
  unlockedAt: Date;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      roadmapId: string;
      estateId: string;
      taskId: string;
      taskTitle: string;
      unlockedAt: Date;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

/**
 * Event: Roadmap Status Changed
 *
 * Emitted when roadmap status changes (e.g., ACTIVE → BLOCKED).
 */
export class RoadmapStatusChanged extends DomainEvent<{
  roadmapId: string;
  estateId: string;
  oldStatus: RoadmapStatus;
  newStatus: RoadmapStatus;
  changedAt: Date;
  reason: string;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      roadmapId: string;
      estateId: string;
      oldStatus: RoadmapStatus;
      newStatus: RoadmapStatus;
      changedAt: Date;
      reason: string;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

/**
 * Event: Roadmap Escalated
 *
 * Emitted when roadmap requires human intervention/escalation.
 */
export class RoadmapEscalated extends DomainEvent<{
  roadmapId: string;
  estateId: string;
  escalationLevel: number;
  escalatedAt: Date;
  reason: string;
  escalatedTo: string;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      roadmapId: string;
      estateId: string;
      escalationLevel: number;
      escalatedAt: Date;
      reason: string;
      escalatedTo: string;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

// ==================== SUPPORTING EVENTS FOR FUTURE USE ====================

/**
 * Event: Risk Resolved
 *
 * Emitted when a blocking risk is resolved and tasks are unblocked.
 */
export class RiskResolved extends DomainEvent<{
  roadmapId: string;
  estateId: string;
  riskId: string;
  resolvedAt: Date;
  resolutionMethod: string;
  unblockedTaskIds: string[];
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      roadmapId: string;
      estateId: string;
      riskId: string;
      resolvedAt: Date;
      resolutionMethod: string;
      unblockedTaskIds: string[];
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

/**
 * Event: Document Gap Linked
 *
 * Emitted when document gap is linked to roadmap tasks.
 */
export class DocumentGapLinked extends DomainEvent<{
  roadmapId: string;
  estateId: string;
  documentGapId: string;
  linkedAt: Date;
  resolvingTaskIds: string[];
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      roadmapId: string;
      estateId: string;
      documentGapId: string;
      linkedAt: Date;
      resolvingTaskIds: string[];
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

/**
 * Event: Efficiency Score Updated
 *
 * Emitted when roadmap efficiency score is recalculated.
 */
export class EfficiencyScoreUpdated extends DomainEvent<{
  roadmapId: string;
  estateId: string;
  oldScore: number;
  newScore: number;
  updatedAt: Date;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      roadmapId: string;
      estateId: string;
      oldScore: number;
      newScore: number;
      updatedAt: Date;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

// ==================== COMPOSITE/AGGREGATE EVENTS ====================

/**
 * Event: Weekly Progress Summary
 *
 * Emitted weekly to summarize roadmap progress.
 */
export class WeeklyProgressSummary extends DomainEvent<{
  roadmapId: string;
  estateId: string;
  weekEnding: Date;
  summary: {
    tasksCompleted: number;
    tasksStarted: number;
    tasksBlocked: number;
    phaseProgress: {
      phase: RoadmapPhase;
      percentComplete: number;
    }[];
    timeSpentHours: number;
    nextWeekFocus: string[];
  };
  generatedAt: Date;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      roadmapId: string;
      estateId: string;
      weekEnding: Date;
      summary: {
        tasksCompleted: number;
        tasksStarted: number;
        tasksBlocked: number;
        phaseProgress: {
          phase: RoadmapPhase;
          percentComplete: number;
        }[];
        timeSpentHours: number;
        nextWeekFocus: string[];
      };
      generatedAt: Date;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

/**
 * Event: Milestone Achieved
 *
 * Emitted when major roadmap milestones are reached.
 */
export class MilestoneAchieved extends DomainEvent<{
  roadmapId: string;
  estateId: string;
  milestone: string;
  achievedAt: Date;
  daysFromStart: number;
}> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: {
      roadmapId: string;
      estateId: string;
      milestone: string;
      achievedAt: Date;
      daysFromStart: number;
    },
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }
}

// Export all events
export const RoadmapEvents = {
  RoadmapCreated,
  RoadmapCompleted,
  RoadmapOptimized,
  RoadmapRegenerated,
  PhaseTransitioned,
  AllPhaseTasksCompleted,
  TaskAssigned,
  TaskAutoCompleted,
  TaskUnlocked,
  TaskDependenciesUpdated,
  RiskBlockingTask,
  RiskResolved,
  CriticalPathIdentified,
  EfficiencyScoreUpdated,
  RoadmapStatusChanged,
  RoadmapEscalated,
  DocumentGapLinked,
  WeeklyProgressSummary,
  MilestoneAchieved,
};
