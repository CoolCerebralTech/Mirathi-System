// src/succession-automation/src/domain/aggregates/executor-roadmap.aggregate.ts
import { AggregateRoot } from '../base/aggregate-root';
import { DomainEvent } from '../base/domain-event';
import { UniqueEntityID } from '../base/unique-entity-id';
import {
  RoadmapTask,
  TaskCategory,
  TaskPriority,
  TaskStatus,
} from '../entities/roadmap-task.entity';
import {
  MilestoneReached,
  PhaseCompleted,
  RoadmapCompleted,
  RoadmapCreated,
  TaskCompleted,
  TaskOverdue,
  TaskSkipped,
  TaskStarted,
  TaskUnlocked,
} from '../events/roadmap.events';
import { SuccessionContext } from '../value-objects/succession-context.vo';

/**
 * Executor Roadmap Aggregate Root
 *
 * PURPOSE: The "GPS" - guides users through the succession process
 * with dynamic, context-aware tasks.
 *
 * AGGREGATE BOUNDARY:
 * - Root: ExecutorRoadmap
 * - Entities: RoadmapTask[] (collection)
 * - Value Objects: SuccessionContext, RoadmapPhase
 *
 * INVARIANTS:
 * 1. Tasks must be unlocked in order (respect dependencies)
 * 2. Cannot complete roadmap with incomplete required tasks
 * 3. Phase progression follows legal order (PRE_FILING → FILING → DISTRIBUTION)
 * 4. Conditional tasks can be skipped, mandatory tasks cannot
 *
 * DYNAMIC TASK GENERATION:
 * Tasks are generated based on SuccessionContext:
 * - Intestate → Include "Obtain Chief's Letter"
 * - Testate → Include "Locate Original Will"
 * - Islamic → Include "File in Kadhi's Court"
 * - Polygamous → Include "Define Houses (S.40)"
 * - Has Minors → Include "Appoint Guardian"
 *
 * PHASES (Legal Workflow):
 * 1. PRE_FILING: Gather documents, verify family, inventory assets
 * 2. FILING_AND_GAZETTE: Generate forms, collect consents, file application
 * 3. CONFIRMATION: Attend court hearings, obtain grant
 * 4. DISTRIBUTION: Pay debts, distribute assets, close estate
 * 5. CLOSED: Estate fully administered
 */

export enum RoadmapPhase {
  PRE_FILING = 'PRE_FILING',
  FILING_AND_GAZETTE = 'FILING_AND_GAZETTE',
  CONFIRMATION = 'CONFIRMATION',
  DISTRIBUTION = 'DISTRIBUTION',
  CLOSED = 'CLOSED',
}

interface ExecutorRoadmapProps {
  // Identity & Context
  estateId: string;
  successionContext: SuccessionContext;

  // Progress Tracking
  currentPhase: RoadmapPhase;
  percentComplete: number; // 0-100

  // Task Collection
  tasks: RoadmapTask[];

  // Completion Tracking
  totalTasks: number;
  completedTasks: number;
  skippedTasks: number;
  overdueTasks: number;

  // Milestones
  milestones: RoadmapMilestone[];

  // Completion
  isComplete: boolean;
  completedAt?: Date;

  // Metadata
  lastUpdatedAt: Date;
}

export interface RoadmapMilestone {
  name: string;
  description: string;
  phase: RoadmapPhase;
  achievedAt?: Date;
}

export class ExecutorRoadmap extends AggregateRoot<ExecutorRoadmapProps> {
  private constructor(id: UniqueEntityID, props: ExecutorRoadmapProps, createdAt?: Date) {
    super(id, props, createdAt);
  }

  // ==================== GETTERS ====================

  get estateId(): string {
    return this.props.estateId;
  }

  get successionContext(): SuccessionContext {
    return this.props.successionContext;
  }

  get currentPhase(): RoadmapPhase {
    return this.props.currentPhase;
  }

  get percentComplete(): number {
    return this.props.percentComplete;
  }

  get tasks(): ReadonlyArray<RoadmapTask> {
    return Object.freeze([...this.props.tasks]);
  }

  get totalTasks(): number {
    return this.props.totalTasks;
  }

  get completedTasks(): number {
    return this.props.completedTasks;
  }

  get skippedTasks(): number {
    return this.props.skippedTasks;
  }

  get overdueTasks(): number {
    return this.props.overdueTasks;
  }

  get milestones(): ReadonlyArray<RoadmapMilestone> {
    return Object.freeze([...this.props.milestones]);
  }

  get isComplete(): boolean {
    return this.props.isComplete;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  // ==================== DERIVED PROPERTIES ====================

  /**
   * Get tasks by phase
   */
  public getTasksByPhase(phase: RoadmapPhase): RoadmapTask[] {
    return this.props.tasks.filter((task) => this.getTaskPhase(task) === phase);
  }

  /**
   * Get tasks by status
   */
  public getTasksByStatus(status: TaskStatus): RoadmapTask[] {
    return this.props.tasks.filter((task) => task.status === status);
  }

  /**
   * Get tasks by category
   */
  public getTasksByCategory(category: TaskCategory): RoadmapTask[] {
    return this.props.tasks.filter((task) => task.category === category);
  }

  /**
   * Get pending tasks (available to start)
   */
  public getPendingTasks(): RoadmapTask[] {
    return this.getTasksByStatus(TaskStatus.PENDING);
  }

  /**
   * Get in-progress tasks
   */
  public getInProgressTasks(): RoadmapTask[] {
    return this.getTasksByStatus(TaskStatus.IN_PROGRESS);
  }

  /**
   * Get overdue tasks
   */
  public getOverdueTasks(): RoadmapTask[] {
    return this.props.tasks.filter((task) => task.isOverdue);
  }

  /**
   * Get next task to do (highest priority pending task)
   */
  public getNextTask(): RoadmapTask | null {
    const pendingTasks = this.getPendingTasks();
    if (pendingTasks.length === 0) return null;

    // Sort by priority score (descending)
    const sorted = pendingTasks.sort((a, b) => b.getPriorityScore() - a.getPriorityScore());
    return sorted[0];
  }

  /**
   * Get current phase completion percentage
   */
  public getCurrentPhaseProgress(): number {
    const phaseTasks = this.getTasksByPhase(this.props.currentPhase);
    if (phaseTasks.length === 0) return 100;

    const completedOrSkipped = phaseTasks.filter(
      (t) => t.status === TaskStatus.COMPLETED || t.status === TaskStatus.SKIPPED,
    ).length;

    return Math.round((completedOrSkipped / phaseTasks.length) * 100);
  }

  /**
   * Get achieved milestones
   */
  public getAchievedMilestones(): RoadmapMilestone[] {
    return this.props.milestones.filter((m) => !!m.achievedAt);
  }

  /**
   * Get upcoming milestones
   */
  public getUpcomingMilestones(): RoadmapMilestone[] {
    return this.props.milestones.filter((m) => !m.achievedAt);
  }

  // ==================== BUSINESS LOGIC - TASK MANAGEMENT ====================

  /**
   * Add a task to the roadmap
   * BUSINESS RULE: Cannot add tasks after completion
   */
  public addTask(task: RoadmapTask): void {
    this.ensureNotDeleted();
    this.ensureNotComplete();

    const updatedTasks = [...this.props.tasks, task];

    this.updateState({
      tasks: updatedTasks,
      totalTasks: this.props.totalTasks + 1,
    });

    // Recalculate progress
    this.recalculateProgress();
  }

  /**
   * Start a task
   * BUSINESS RULE: Task must be PENDING
   */
  public startTask(taskId: string, userId: string): void {
    this.ensureNotDeleted();
    this.ensureNotComplete();

    const task = this.findTaskById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.start(userId);

    // Emit event
    this.addDomainEvent(
      new TaskStarted(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        roadmapId: this.id.toString(),
        estateId: this.props.estateId,
        taskId: task.id.toString(),
        taskTitle: task.title,
        userId,
      }),
    );

    this.updateState({ lastUpdatedAt: new Date() });
  }

  /**
   * Complete a task
   * BUSINESS RULE: Task must be IN_PROGRESS
   */
  public completeTask(
    taskId: string,
    userId: string,
    completionNotes?: string,
    proofDocumentId?: string,
  ): void {
    this.ensureNotDeleted();
    this.ensureNotComplete();

    const task = this.findTaskById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.complete(userId, completionNotes, proofDocumentId);

    // Update counters
    const newCompletedCount = this.props.completedTasks + 1;
    this.updateState({
      completedTasks: newCompletedCount,
      lastUpdatedAt: new Date(),
    });

    // Recalculate progress
    this.recalculateProgress();

    // Emit event
    this.addDomainEvent(
      new TaskCompleted(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        roadmapId: this.id.toString(),
        estateId: this.props.estateId,
        taskId: task.id.toString(),
        taskTitle: task.title,
        userId,
        completionNotes,
      }),
    );

    // Unlock dependent tasks
    this.unlockDependentTasks(taskId);

    // Check phase completion
    this.checkPhaseCompletion();

    // Check roadmap completion
    this.checkRoadmapCompletion();
  }

  /**
   * Skip a task
   * BUSINESS RULE: Task must be conditional
   */
  public skipTask(taskId: string, reason: string): void {
    this.ensureNotDeleted();
    this.ensureNotComplete();

    const task = this.findTaskById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.skip(reason);

    // Update counters
    const newSkippedCount = this.props.skippedTasks + 1;
    this.updateState({
      skippedTasks: newSkippedCount,
      lastUpdatedAt: new Date(),
    });

    // Recalculate progress
    this.recalculateProgress();

    // Emit event
    this.addDomainEvent(
      new TaskSkipped(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        roadmapId: this.id.toString(),
        estateId: this.props.estateId,
        taskId: task.id.toString(),
        taskTitle: task.title,
        reason,
      }),
    );

    // Unlock dependent tasks
    this.unlockDependentTasks(taskId);

    // Check phase completion
    this.checkPhaseCompletion();
  }

  /**
   * Mark task as overdue (called by system cron)
   */
  public markTaskAsOverdue(taskId: string): void {
    this.ensureNotDeleted();

    const task = this.findTaskById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.markAsOverdue();

    // Update overdue counter
    const overdueCount = this.getOverdueTasks().length;
    this.updateState({
      overdueTasks: overdueCount,
      lastUpdatedAt: new Date(),
    });

    // Emit event
    this.addDomainEvent(
      new TaskOverdue(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        roadmapId: this.id.toString(),
        estateId: this.props.estateId,
        taskId: task.id.toString(),
        taskTitle: task.title,
        daysOverdue: task.getDaysOverdue(),
      }),
    );
  }

  // ==================== BUSINESS LOGIC - PHASE MANAGEMENT ====================

  /**
   * Advance to next phase
   * BUSINESS RULE: Current phase must be complete
   */
  public advanceToNextPhase(): void {
    this.ensureNotDeleted();
    this.ensureNotComplete();

    const currentPhaseProgress = this.getCurrentPhaseProgress();
    if (currentPhaseProgress < 100) {
      throw new Error(
        `Cannot advance phase - current phase is only ${currentPhaseProgress}% complete`,
      );
    }

    const phaseOrder: RoadmapPhase[] = [
      RoadmapPhase.PRE_FILING,
      RoadmapPhase.FILING_AND_GAZETTE,
      RoadmapPhase.CONFIRMATION,
      RoadmapPhase.DISTRIBUTION,
      RoadmapPhase.CLOSED,
    ];

    const currentIndex = phaseOrder.indexOf(this.props.currentPhase);
    if (currentIndex === -1 || currentIndex === phaseOrder.length - 1) {
      throw new Error('Cannot advance past final phase');
    }

    const newPhase = phaseOrder[currentIndex + 1];

    this.updateState({
      currentPhase: newPhase,
      lastUpdatedAt: new Date(),
    });

    // Emit event
    this.addDomainEvent(
      new PhaseCompleted(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        roadmapId: this.id.toString(),
        estateId: this.props.estateId,
        completedPhase: phaseOrder[currentIndex],
        newPhase,
      }),
    );

    // Check for milestone
    this.checkMilestoneAchieved(newPhase);
  }

  // ==================== PRIVATE HELPERS ====================

  /**
   * Find task by ID
   */
  private findTaskById(taskId: string): RoadmapTask | null {
    return this.props.tasks.find((t) => t.id.equals(taskId)) || null;
  }

  /**
   * Get phase for a task (based on category mapping)
   */
  private getTaskPhase(task: RoadmapTask): RoadmapPhase {
    const phaseMapping: Record<TaskCategory, RoadmapPhase> = {
      [TaskCategory.IDENTITY_VERIFICATION]: RoadmapPhase.PRE_FILING,
      [TaskCategory.DOCUMENT_COLLECTION]: RoadmapPhase.PRE_FILING,
      [TaskCategory.FAMILY_VERIFICATION]: RoadmapPhase.PRE_FILING,
      [TaskCategory.ASSET_INVENTORY]: RoadmapPhase.PRE_FILING,
      [TaskCategory.DEBT_VERIFICATION]: RoadmapPhase.PRE_FILING,
      [TaskCategory.WILL_VERIFICATION]: RoadmapPhase.PRE_FILING,
      [TaskCategory.WITNESS_CONFIRMATION]: RoadmapPhase.PRE_FILING,
      [TaskCategory.GUARDIAN_APPOINTMENT]: RoadmapPhase.PRE_FILING,
      [TaskCategory.FORM_GENERATION]: RoadmapPhase.FILING_AND_GAZETTE,
      [TaskCategory.FORM_REVIEW]: RoadmapPhase.FILING_AND_GAZETTE,
      [TaskCategory.CONSENT_COLLECTION]: RoadmapPhase.FILING_AND_GAZETTE,
      [TaskCategory.PAYMENT]: RoadmapPhase.FILING_AND_GAZETTE,
      [TaskCategory.COURT_FILING]: RoadmapPhase.FILING_AND_GAZETTE,
      [TaskCategory.COURT_ATTENDANCE]: RoadmapPhase.CONFIRMATION,
      [TaskCategory.GRANT_COLLECTION]: RoadmapPhase.CONFIRMATION,
      [TaskCategory.ASSET_DISTRIBUTION]: RoadmapPhase.DISTRIBUTION,
      [TaskCategory.FINAL_ACCOUNTS]: RoadmapPhase.DISTRIBUTION,
      [TaskCategory.GENERAL]: this.props.currentPhase,
    };

    return phaseMapping[task.category] || this.props.currentPhase;
  }

  /**
   * Unlock tasks that depended on the completed task
   */
  private unlockDependentTasks(completedTaskId: string): void {
    const dependentTasks = this.props.tasks.filter(
      (task) =>
        task.dependsOnTaskIds.includes(completedTaskId) && task.status === TaskStatus.LOCKED,
    );

    for (const task of dependentTasks) {
      // Check if ALL dependencies are met
      const allDependenciesMet = task.dependsOnTaskIds.every((depId) => {
        const depTask = this.findTaskById(depId);
        return depTask && (depTask.isCompleted() || depTask.isSkipped());
      });

      if (allDependenciesMet) {
        task.unlock();

        // Emit event
        this.addDomainEvent(
          new TaskUnlocked(this.id.toString(), this.getAggregateType(), this.getVersion(), {
            roadmapId: this.id.toString(),
            estateId: this.props.estateId,
            taskId: task.id.toString(),
            taskTitle: task.title,
          }),
        );
      }
    }
  }

  /**
   * Recalculate overall progress percentage
   */
  private recalculateProgress(): void {
    if (this.props.totalTasks === 0) {
      this.updateState({ percentComplete: 0 });
      return;
    }

    const completedOrSkipped = this.props.completedTasks + this.props.skippedTasks;
    const percent = Math.round((completedOrSkipped / this.props.totalTasks) * 100);

    this.updateState({ percentComplete: percent });
  }

  /**
   * Check if current phase is complete
   */
  private checkPhaseCompletion(): void {
    const currentPhaseProgress = this.getCurrentPhaseProgress();

    if (currentPhaseProgress === 100) {
      // Try to advance automatically (if next phase has no tasks yet)
      const nextPhase = this.getNextPhase();
      if (nextPhase && this.getTasksByPhase(nextPhase).length > 0) {
        // Don't auto-advance if next phase has tasks (user needs to review)
        return;
      }

      // Emit completion event (don't auto-advance)
      this.addDomainEvent(
        new PhaseCompleted(this.id.toString(), this.getAggregateType(), this.getVersion(), {
          roadmapId: this.id.toString(),
          estateId: this.props.estateId,
          completedPhase: this.props.currentPhase,
          newPhase: nextPhase || this.props.currentPhase,
        }),
      );
    }
  }

  /**
   * Check if entire roadmap is complete
   */
  private checkRoadmapCompletion(): void {
    // Roadmap is complete when:
    // 1. All required tasks are completed or skipped
    // 2. Current phase is DISTRIBUTION (final phase)

    const requiredTasks = this.props.tasks.filter((t) => !t.props.isConditional);
    const allRequiredComplete = requiredTasks.every((t) => t.isCompleted() || t.isSkipped());

    if (allRequiredComplete && this.props.percentComplete === 100) {
      this.updateState({
        isComplete: true,
        completedAt: new Date(),
        currentPhase: RoadmapPhase.CLOSED,
      });

      // Emit event
      this.addDomainEvent(
        new RoadmapCompleted(this.id.toString(), this.getAggregateType(), this.getVersion(), {
          roadmapId: this.id.toString(),
          estateId: this.props.estateId,
          completedAt: new Date(),
          totalTasks: this.props.totalTasks,
          completedTasks: this.props.completedTasks,
          skippedTasks: this.props.skippedTasks,
        }),
      );
    }
  }

  /**
   * Get next phase
   */
  private getNextPhase(): RoadmapPhase | null {
    const phaseOrder: RoadmapPhase[] = [
      RoadmapPhase.PRE_FILING,
      RoadmapPhase.FILING_AND_GAZETTE,
      RoadmapPhase.CONFIRMATION,
      RoadmapPhase.DISTRIBUTION,
      RoadmapPhase.CLOSED,
    ];

    const currentIndex = phaseOrder.indexOf(this.props.currentPhase);
    if (currentIndex === -1 || currentIndex === phaseOrder.length - 1) {
      return null;
    }

    return phaseOrder[currentIndex + 1];
  }

  /**
   * Check if milestone achieved
   */
  private checkMilestoneAchieved(newPhase: RoadmapPhase): void {
    const milestone = this.props.milestones.find((m) => m.phase === newPhase && !m.achievedAt);

    if (milestone) {
      milestone.achievedAt = new Date();

      // Emit event
      this.addDomainEvent(
        new MilestoneReached(this.id.toString(), this.getAggregateType(), this.getVersion(), {
          roadmapId: this.id.toString(),
          estateId: this.props.estateId,
          milestoneName: milestone.name,
          phase: newPhase,
        }),
      );
    }
  }

  /**
   * Ensure roadmap is not complete
   */
  private ensureNotComplete(): void {
    if (this.props.isComplete) {
      throw new Error('Cannot modify completed roadmap');
    }
  }

  // ==================== VALIDATION ====================

  public validate(): void {
    // INVARIANT 1: All tasks must have valid order indices
    const orderIndices = this.props.tasks.map((t) => t.orderIndex);
    const uniqueIndices = new Set(orderIndices);
    if (orderIndices.length !== uniqueIndices.size) {
      throw new Error('Duplicate task order indices detected');
    }

    // INVARIANT 2: Task dependencies must exist
    for (const task of this.props.tasks) {
      for (const depId of task.dependsOnTaskIds) {
        const depTask = this.findTaskById(depId);
        if (!depTask) {
          throw new Error(`Task ${task.id.toString()} depends on non-existent task ${depId}`);
        }
      }
    }

    // INVARIANT 3: Completed tasks count must match
    const actualCompleted = this.props.tasks.filter((t) => t.isCompleted()).length;
    if (actualCompleted !== this.props.completedTasks) {
      throw new Error(
        `Completed tasks count mismatch: stored=${this.props.completedTasks}, actual=${actualCompleted}`,
      );
    }
  }

  // ==================== EVENT SOURCING ====================

  protected applyEvent(event: DomainEvent): void {
    // Event replay logic
    switch (event.getEventType()) {
      case 'RoadmapCreated':
      case 'TaskStarted':
      case 'TaskCompleted':
        // State already updated via business logic
        break;
      default:
        // Unknown event - ignore
        break;
    }
  }

  // ==================== FACTORY METHODS ====================

  /**
   * Create a new executor roadmap
   */
  public static create(estateId: string, successionContext: SuccessionContext): ExecutorRoadmap {
    const id = UniqueEntityID.newID();

    // Define standard milestones
    const milestones: RoadmapMilestone[] = [
      {
        name: 'Ready to File',
        description: 'All pre-filing requirements met',
        phase: RoadmapPhase.FILING_AND_GAZETTE,
      },
      {
        name: 'Application Filed',
        description: 'Probate application submitted to court',
        phase: RoadmapPhase.FILING_AND_GAZETTE,
      },
      {
        name: 'Grant Obtained',
        description: 'Court approved succession application',
        phase: RoadmapPhase.CONFIRMATION,
      },
      {
        name: 'Distribution Complete',
        description: 'All assets distributed to beneficiaries',
        phase: RoadmapPhase.DISTRIBUTION,
      },
    ];

    const roadmap = new ExecutorRoadmap(id, {
      estateId,
      successionContext,
      currentPhase: RoadmapPhase.PRE_FILING,
      percentComplete: 0,
      tasks: [],
      totalTasks: 0,
      completedTasks: 0,
      skippedTasks: 0,
      overdueTasks: 0,
      milestones,
      isComplete: false,
      lastUpdatedAt: new Date(),
    });

    // Emit creation event
    roadmap.addDomainEvent(
      new RoadmapCreated(id.toString(), roadmap.getAggregateType(), 1, {
        roadmapId: id.toString(),
        estateId,
        successionContext: successionContext.toJSON(),
      }),
    );

    return roadmap;
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(
    id: string,
    props: ExecutorRoadmapProps,
    createdAt: Date,
    updatedAt: Date,
    version: number,
  ): ExecutorRoadmap {
    const aggregate = new ExecutorRoadmap(new UniqueEntityID(id), props, createdAt);
    (aggregate as any)._updatedAt = updatedAt;
    (aggregate as any)._version = version;
    return aggregate;
  }
}
