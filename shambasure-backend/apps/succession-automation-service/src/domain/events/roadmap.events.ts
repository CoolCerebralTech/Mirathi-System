// src/succession-automation/src/domain/events/roadmap.events.ts
import { DomainEvent } from '../base/domain-event';

/**
 * Domain Events for Executor Roadmap Aggregate
 *
 * PURPOSE: Track user progress through the succession process
 *
 * EVENT CONSUMERS:
 * - Notification Service: "Great job! You completed 'Obtain Death Certificate'"
 * - Analytics Service: Track completion rates, common bottlenecks
 * - Gamification Service: Award badges, celebrate milestones
 * - Support Service: Detect users stuck on tasks for too long
 */

// ============================================================================
// Roadmap Created
// ============================================================================

export interface RoadmapCreatedPayload {
  roadmapId: string;
  estateId: string;
  successionContext: Record<string, any>;
}

export class RoadmapCreated extends DomainEvent<RoadmapCreatedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: RoadmapCreatedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'RoadmapCreated';
  }

  public getPayload(): RoadmapCreatedPayload {
    return super.getPayload();
  }
}

// ============================================================================
// Task Unlocked
// ============================================================================

export interface TaskUnlockedPayload {
  roadmapId: string;
  estateId: string;
  taskId: string;
  taskTitle: string;
}

export class TaskUnlocked extends DomainEvent<TaskUnlockedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: TaskUnlockedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'TaskUnlocked';
  }

  public getPayload(): TaskUnlockedPayload {
    return super.getPayload();
  }
}

// ============================================================================
// Task Started
// ============================================================================

export interface TaskStartedPayload {
  roadmapId: string;
  estateId: string;
  taskId: string;
  taskTitle: string;
  userId: string;
}

export class TaskStarted extends DomainEvent<TaskStartedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: TaskStartedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'TaskStarted';
  }

  public getPayload(): TaskStartedPayload {
    return super.getPayload();
  }
}

// ============================================================================
// Task Completed
// ============================================================================

export interface TaskCompletedPayload {
  roadmapId: string;
  estateId: string;
  taskId: string;
  taskTitle: string;
  userId: string;
  completionNotes?: string;
}

export class TaskCompleted extends DomainEvent<TaskCompletedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: TaskCompletedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'TaskCompleted';
  }

  public getPayload(): TaskCompletedPayload {
    return super.getPayload();
  }
}

// ============================================================================
// Task Skipped
// ============================================================================

export interface TaskSkippedPayload {
  roadmapId: string;
  estateId: string;
  taskId: string;
  taskTitle: string;
  reason: string;
}

export class TaskSkipped extends DomainEvent<TaskSkippedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: TaskSkippedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'TaskSkipped';
  }

  public getPayload(): TaskSkippedPayload {
    return super.getPayload();
  }
}

// ============================================================================
// Task Overdue
// ============================================================================

export interface TaskOverduePayload {
  roadmapId: string;
  estateId: string;
  taskId: string;
  taskTitle: string;
  daysOverdue: number;
}

export class TaskOverdue extends DomainEvent<TaskOverduePayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: TaskOverduePayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'TaskOverdue';
  }

  public getPayload(): TaskOverduePayload {
    return super.getPayload();
  }
}

// ============================================================================
// Phase Completed
// ============================================================================

export interface PhaseCompletedPayload {
  roadmapId: string;
  estateId: string;
  completedPhase: string; // RoadmapPhase enum value
  newPhase: string; // RoadmapPhase enum value
}

export class PhaseCompleted extends DomainEvent<PhaseCompletedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: PhaseCompletedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'PhaseCompleted';
  }

  public getPayload(): PhaseCompletedPayload {
    return super.getPayload();
  }
}

// ============================================================================
// Milestone Reached
// ============================================================================

export interface MilestoneReachedPayload {
  roadmapId: string;
  estateId: string;
  milestoneName: string;
  phase: string; // RoadmapPhase enum value
}

export class MilestoneReached extends DomainEvent<MilestoneReachedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: MilestoneReachedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'MilestoneReached';
  }

  public getPayload(): MilestoneReachedPayload {
    return super.getPayload();
  }
}

// ============================================================================
// Roadmap Completed
// ============================================================================

export interface RoadmapCompletedPayload {
  roadmapId: string;
  estateId: string;
  completedAt: Date;
  totalTasks: number;
  completedTasks: number;
  skippedTasks: number;
}

export class RoadmapCompleted extends DomainEvent<RoadmapCompletedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: RoadmapCompletedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'RoadmapCompleted';
  }

  public getPayload(): RoadmapCompletedPayload {
    return super.getPayload();
  }
}

// ============================================================================
// Task Reopened
// ============================================================================

export interface TaskReopenedPayload {
  roadmapId: string;
  estateId: string;
  taskId: string;
  taskTitle: string;
  reason: string;
}

export class TaskReopened extends DomainEvent<TaskReopenedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: TaskReopenedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'TaskReopened';
  }

  public getPayload(): TaskReopenedPayload {
    return super.getPayload();
  }
}

// ============================================================================
// Task Priority Changed
// ============================================================================

export interface TaskPriorityChangedPayload {
  roadmapId: string;
  estateId: string;
  taskId: string;
  taskTitle: string;
  previousPriority: string;
  newPriority: string;
}

export class TaskPriorityChanged extends DomainEvent<TaskPriorityChangedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: TaskPriorityChangedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'TaskPriorityChanged';
  }

  public getPayload(): TaskPriorityChangedPayload {
    return super.getPayload();
  }
}

// ============================================================================
// Progress Updated
// ============================================================================

export interface ProgressUpdatedPayload {
  roadmapId: string;
  estateId: string;
  previousPercent: number;
  newPercent: number;
  currentPhase: string;
}

export class ProgressUpdated extends DomainEvent<ProgressUpdatedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: ProgressUpdatedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'ProgressUpdated';
  }

  public getPayload(): ProgressUpdatedPayload {
    return super.getPayload();
  }

  /**
   * Did progress improve significantly? (>= 10 percentage points)
   */
  public isSignificantProgress(): boolean {
    const payload = this.getPayload();
    return payload.newPercent - payload.previousPercent >= 10;
  }
}

// ============================================================================
// All Tasks in Phase Completed
// ============================================================================

export interface AllTasksInPhaseCompletedPayload {
  roadmapId: string;
  estateId: string;
  phase: string;
  totalTasksInPhase: number;
  completedTasksInPhase: number;
}

export class AllTasksInPhaseCompleted extends DomainEvent<AllTasksInPhaseCompletedPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: AllTasksInPhaseCompletedPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'AllTasksInPhaseCompleted';
  }

  public getPayload(): AllTasksInPhaseCompletedPayload {
    return super.getPayload();
  }
}

// ============================================================================
// Task Reminder Sent
// ============================================================================

export interface TaskReminderSentPayload {
  roadmapId: string;
  estateId: string;
  taskId: string;
  taskTitle: string;
  userId: string;
  reminderType: 'OVERDUE' | 'DUE_SOON' | 'STUCK';
}

export class TaskReminderSent extends DomainEvent<TaskReminderSentPayload> {
  constructor(
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: TaskReminderSentPayload,
    occurredAt?: Date,
  ) {
    super(aggregateId, aggregateType, version, payload, occurredAt);
  }

  public getEventType(): string {
    return 'TaskReminderSent';
  }

  public getPayload(): TaskReminderSentPayload {
    return super.getPayload();
  }
}
