// src/succession-automation/src/domain/aggregates/executor-roadmap.aggregate.ts
import { AggregateRoot } from '../base/aggregate-root';
import { DomainEvent } from '../base/domain-event';
import { UniqueEntityID } from '../base/unique-entity-id';
import {
  RoadmapTask,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  TaskTrigger,
} from '../entities/roadmap-task.entity';
import {
  AllPhaseTasksCompleted,
  CriticalPathIdentified,
  PhaseTransitioned,
  RiskBlockingTask,
  RoadmapCompleted,
  RoadmapCreated,
  RoadmapOptimized,
  RoadmapRegenerated,
  RoadmapTaskCompletedEvent,
  RoadmapTaskStartedEvent,
  TaskAssigned,
  TaskAutoCompleted,
  TaskDependenciesUpdated,
  TaskUnlocked,
} from '../events/roadmap.events';
import { ReadinessScore } from '../value-objects/readiness-score.vo';
import {
  SuccessionContext,
  SuccessionMarriageType,
  SuccessionRegime,
  SuccessionReligion,
} from '../value-objects/succession-context.vo';

/**
 * Executor Roadmap Aggregate Root
 *
 * INNOVATION: AI-Powered Legal GPS System
 *
 * This aggregate implements:
 * 1. **Dynamic Task Generation**: Creates personalized legal roadmap based on case specifics
 * 2. **Smart Dependencies**: Tasks automatically unlock when prerequisites met
 * 3. **Critical Path Analysis**: Identifies the most urgent legal bottlenecks
 * 4. **Event-Driven Automation**: Updates roadmap when external systems change
 * 5. **Predictive Time Estimates**: Learns from similar cases to improve accuracy
 * 6. **Risk Integration**: Links roadmap tasks to ReadinessAssessment risks
 *
 * SMART FEATURES:
 * - Auto-generates tasks based on succession context
 * - Adjusts task order based on court backlog data
 * - Prioritizes tasks that resolve blocking risks
 * - Suggests parallel task execution where safe
 * - Escalates stuck tasks to legal team automatically
 *
 * LEGAL WORKFLOW ENGINE:
 * 1. PRE_FILING: Identity → Documents → Family → Assets → Debts
 * 2. FILING: Forms → Consents → Fees → Court Submission → Gazette
 * 3. CONFIRMATION: Hearings → Objections → Grant → Registration
 * 4. DISTRIBUTION: Assets → Debts → Taxes → Transfers → Accounts
 * 5. CLOSURE: Final Returns → Beneficiary Releases → Court Discharge
 */

export enum RoadmapPhase {
  PRE_FILING = 'PRE_FILING', // Phase 1: Gather everything needed
  FILING = 'FILING', // Phase 2: Submit to court
  CONFIRMATION = 'CONFIRMATION', // Phase 3: Obtain court grant
  DISTRIBUTION = 'DISTRIBUTION', // Phase 4: Distribute estate
  CLOSURE = 'CLOSURE', // Phase 5: Finalize and close
}

export enum RoadmapStatus {
  DRAFT = 'DRAFT', // Just created, tasks being generated
  ACTIVE = 'ACTIVE', // User actively working
  PAUSED = 'PAUSED', // User paused (e.g., waiting for funds)
  BLOCKED = 'BLOCKED', // Critical risk blocking progress
  COMPLETED = 'COMPLETED', // All phases done
  ABANDONED = 'ABANDONED', // User gave up
  ESCALATED = 'ESCALATED', // Sent to legal team for help
}

export interface PhaseProgress {
  phase: RoadmapPhase;
  completedTasks: number;
  totalTasks: number;
  percentComplete: number;
  startedAt?: Date;
  completedAt?: Date;
  estimatedCompletionDate?: Date;
  criticalTasksRemaining: number;
}

export interface RoadmapAnalytics {
  estimatedTotalTimeDays: number;
  estimatedCostKES: number;
  complexityScore: number; // 1-10
  riskExposure: number; // 0-100
  efficiencyScore?: number; // Compared to similar cases
  predictedBottlenecks: string[];
  recommendedAccelerations: string[];
}

export interface ExecutorRoadmapProps {
  // Identity & Context
  estateId: string;
  successionContext: SuccessionContext;
  readinessAssessmentId: string;
  readinessScore?: ReadinessScore;

  // Current State
  currentPhase: RoadmapPhase;
  status: RoadmapStatus;
  percentComplete: number; // 0-100 overall

  // Task Collection
  tasks: RoadmapTask[];

  // Phase Tracking
  phases: Map<RoadmapPhase, PhaseProgress>;
  phaseHistory: Array<{
    phase: RoadmapPhase;
    enteredAt: Date;
    exitedAt?: Date;
    durationDays?: number;
  }>;

  // Completion Tracking
  totalTasks: number;
  completedTasks: number;
  skippedTasks: number;
  overdueTasks: number;
  blockedTasks: number;

  // Time Tracking
  startedAt: Date;
  estimatedCompletionDate?: Date;
  actualCompletionDate?: Date;
  totalTimeSpentHours: number;

  // Risk Integration
  blockedByRiskIds: string[]; // Risks currently blocking roadmap
  resolvesRiskIds: string[]; // Risks resolved by completing roadmap
  linkedDocumentGaps: string[]; // Document gaps addressed by tasks

  // Analytics
  analytics: RoadmapAnalytics;

  // User Progress
  userId: string;
  executorName: string;
  lastActiveAt: Date;
  daysInactive: number;

  // Automation
  autoTransitionEnabled: boolean; // Automatically move to next phase
  autoTaskGenerationEnabled: boolean; // Generate new tasks automatically
  escalationThresholdDays: number; // Auto-escalate after X days stuck

  // Metadata
  version: number;
  lastOptimizedAt?: Date;
  optimizationCount: number;
  notes?: string;
  internalNotes?: string;
}

export class ExecutorRoadmap extends AggregateRoot<ExecutorRoadmapProps> {
  // Phase definitions with descriptions and goals
  private static readonly PHASE_DEFINITIONS = {
    [RoadmapPhase.PRE_FILING]: {
      name: 'Pre-Filing Preparation',
      goal: 'Gather all required documents and information before filing',
      description:
        'Identity verification, family tree confirmation, asset discovery, and document collection',
      legalBasis: 'S.56 LSA - Requirements for application',
      estimatedDurationDays: 30,
      requiredForNextPhase: 80, // Must complete 80% to move to filing
    },
    [RoadmapPhase.FILING]: {
      name: 'Court Filing Process',
      goal: 'Submit complete application to court and publish gazette notice',
      description:
        'Form generation, consent collection, fee payment, court submission, gazette publication',
      legalBasis: 'S.56 LSA - Procedure for application',
      estimatedDurationDays: 60,
      requiredForNextPhase: 100, // Must complete 100% to get grant
    },
    [RoadmapPhase.CONFIRMATION]: {
      name: 'Court Confirmation',
      goal: 'Obtain Grant of Representation from court',
      description: 'Court hearings, objection resolution, grant issuance, grant registration',
      legalBasis: 'S.71 LSA - Grant of representation',
      estimatedDurationDays: 45,
      requiredForNextPhase: 100,
    },
    [RoadmapPhase.DISTRIBUTION]: {
      name: 'Estate Distribution',
      goal: 'Distribute assets to beneficiaries according to law/will',
      description:
        'Asset valuation, debt payment, tax clearance, asset transfer, beneficiary payments',
      legalBasis: 'S.83 LSA - Duties of executor',
      estimatedDurationDays: 90,
      requiredForNextPhase: 100,
    },
    [RoadmapPhase.CLOSURE]: {
      name: 'Estate Closure',
      goal: 'Complete all legal requirements and close estate',
      description:
        'Final accounts, beneficiary releases, court discharge, estate closure certificate',
      legalBasis: 'S.83(f) LSA - Final accounts',
      estimatedDurationDays: 30,
      requiredForNextPhase: 100,
    },
  };

  // Task generation templates by context
  private static readonly TASK_TEMPLATES = {
    MANDATORY: [
      'DEATH_CERTIFICATE',
      'IDENTITY_DOCUMENTS',
      'FAMILY_TREE',
      'ASSET_INVENTORY',
      'P&A_FORM_GENERATION',
      'COURT_FILING',
      'GAZETTE_PUBLICATION',
      'GRANT_COLLECTION',
      'ASSET_DISTRIBUTION',
      'FINAL_ACCOUNTS',
    ],
    INTESTATE: ['CHIEF_LETTER', 'FAMILY_CONSENTS', 'PA57_GUARANTEE'],
    TESTATE: ['ORIGINAL_WILL', 'WILL_PROBATE', 'EXECUTOR_CONFIRMATION'],
    ISLAMIC: ['ISLAMIC_FORMS', 'KADHI_COURT_FILING', 'SHARIA_DISTRIBUTION'],
    POLYGAMOUS: ['HOUSE_DEFINITION', 'PER_HOUSE_CONSENTS', 'SECTION_40_CALCULATION'],
    WITH_MINORS: ['GUARDIAN_APPOINTMENT', 'MINOR_TRUST_SETUP', 'GUARDIAN_CONSENTS'],
    BUSINESS_ASSETS: ['BUSINESS_VALUATION', 'COMPANY_REGISTRY', 'SHARE_TRANSFER'],
    DISPUTED: ['MEDIATION_SETUP', 'AFFIDAVITS', 'COURT_HEARING_PREP'],
  };

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

  get readinessAssessmentId(): string {
    return this.props.readinessAssessmentId;
  }

  get readinessScore(): ReadinessScore | undefined {
    return this.props.readinessScore;
  }

  get currentPhase(): RoadmapPhase {
    return this.props.currentPhase;
  }

  get status(): RoadmapStatus {
    return this.props.status;
  }

  get percentComplete(): number {
    return this.props.percentComplete;
  }

  get tasks(): ReadonlyArray<RoadmapTask> {
    return Object.freeze([...this.props.tasks]);
  }

  get phases(): Map<RoadmapPhase, PhaseProgress> {
    return new Map(this.props.phases);
  }

  get phaseHistory(): Array<{
    phase: RoadmapPhase;
    enteredAt: Date;
    exitedAt?: Date;
    durationDays?: number;
  }> {
    return [...this.props.phaseHistory];
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

  get blockedTasks(): number {
    return this.props.blockedTasks;
  }

  get startedAt(): Date {
    return this.props.startedAt;
  }

  get estimatedCompletionDate(): Date | undefined {
    return this.props.estimatedCompletionDate;
  }

  get actualCompletionDate(): Date | undefined {
    return this.props.actualCompletionDate;
  }

  get totalTimeSpentHours(): number {
    return this.props.totalTimeSpentHours;
  }

  get blockedByRiskIds(): string[] {
    return [...this.props.blockedByRiskIds];
  }

  get resolvesRiskIds(): string[] {
    return [...this.props.resolvesRiskIds];
  }

  get linkedDocumentGaps(): string[] {
    return [...this.props.linkedDocumentGaps];
  }

  get analytics(): RoadmapAnalytics {
    return { ...this.props.analytics };
  }

  get userId(): string {
    return this.props.userId;
  }

  get executorName(): string {
    return this.props.executorName;
  }

  get lastActiveAt(): Date {
    return this.props.lastActiveAt;
  }

  get daysInactive(): number {
    return this.props.daysInactive;
  }

  get autoTransitionEnabled(): boolean {
    return this.props.autoTransitionEnabled;
  }

  get autoTaskGenerationEnabled(): boolean {
    return this.props.autoTaskGenerationEnabled;
  }

  get escalationThresholdDays(): number {
    return this.props.escalationThresholdDays;
  }

  get version(): number {
    return this.props.version;
  }

  get lastOptimizedAt(): Date | undefined {
    return this.props.lastOptimizedAt;
  }

  get optimizationCount(): number {
    return this.props.optimizationCount;
  }

  // ==================== DERIVED PROPERTIES ====================

  /**
   * Get tasks for current phase
   */
  public getCurrentPhaseTasks(): RoadmapTask[] {
    return this.props.tasks.filter((task) => this.getTaskPhase(task) === this.props.currentPhase);
  }

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
   * Get tasks by priority
   */
  public getTasksByPriority(priority: TaskPriority): RoadmapTask[] {
    return this.props.tasks.filter((task) => task.priority === priority);
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
   * Get blocked tasks
   */
  public getBlockedTasks(): RoadmapTask[] {
    return this.getTasksByStatus(TaskStatus.BLOCKED);
  }

  /**
   * Get next recommended task
   */
  public getNextRecommendedTask(): RoadmapTask | null {
    const currentPhaseTasks = this.getCurrentPhaseTasks();

    // 1. Check for critical overdue tasks
    const criticalOverdue = currentPhaseTasks.filter(
      (task) => task.isOverdue && task.priority === TaskPriority.CRITICAL,
    );
    if (criticalOverdue.length > 0) {
      return criticalOverdue.sort((a, b) => b.getUrgencyScore() - a.getUrgencyScore())[0];
    }

    // 2. Check for pending critical tasks
    const pendingCritical = currentPhaseTasks.filter(
      (task) => task.status === TaskStatus.PENDING && task.priority === TaskPriority.CRITICAL,
    );
    if (pendingCritical.length > 0) {
      return pendingCritical.sort((a, b) => b.getUrgencyScore() - a.getUrgencyScore())[0];
    }

    // 3. Check for any pending task with dependencies met
    const pendingTasks = currentPhaseTasks.filter((task) => task.status === TaskStatus.PENDING);
    const dependenciesMet = pendingTasks.filter((task) =>
      task.dependsOnTaskIds.every((depId) => {
        const depTask = this.findTaskById(depId);
        return (
          depTask &&
          (depTask.status === TaskStatus.COMPLETED || depTask.status === TaskStatus.SKIPPED)
        );
      }),
    );

    if (dependenciesMet.length > 0) {
      return dependenciesMet.sort((a, b) => b.getUrgencyScore() - a.getUrgencyScore())[0];
    }

    return null;
  }

  /**
   * Get critical path tasks (tasks that block other tasks)
   */
  public getCriticalPathTasks(): RoadmapTask[] {
    return this.props.tasks.filter((task) => task.blocksTaskIds.length > 0);
  }

  /**
   * Get phase progress
   */
  public getPhaseProgress(phase: RoadmapPhase): PhaseProgress | undefined {
    return this.props.phases.get(phase);
  }

  /**
   * Get current phase progress percentage
   */
  public getCurrentPhaseProgress(): number {
    const progress = this.props.phases.get(this.props.currentPhase);
    return progress ? progress.percentComplete : 0;
  }

  /**
   * Get days remaining in current phase
   */
  public getDaysRemainingInPhase(): number | null {
    const progress = this.props.phases.get(this.props.currentPhase);
    if (!progress || !progress.estimatedCompletionDate) {
      return null;
    }

    const now = new Date();
    const completionDate = progress.estimatedCompletionDate;
    const diffMs = completionDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  /**
   * Is roadmap blocked by risks?
   */
  public isBlockedByRisks(): boolean {
    return this.props.blockedByRiskIds.length > 0;
  }

  /**
   * Is roadmap ready for next phase?
   */
  public isReadyForNextPhase(): boolean {
    const phaseDef = ExecutorRoadmap.PHASE_DEFINITIONS[this.props.currentPhase];
    const progress = this.props.phases.get(this.props.currentPhase);

    if (!phaseDef || !progress) {
      return false;
    }

    return progress.percentComplete >= phaseDef.requiredForNextPhase;
  }

  /**
   * Get roadmap health status
   */
  public getHealthStatus(): 'HEALTHY' | 'WARNING' | 'CRITICAL' {
    const overdueTasks = this.getOverdueTasks().length;
    const blockedTasks = this.getBlockedTasks().length;
    const inactiveDays = this.props.daysInactive;

    if (blockedTasks > 0 || inactiveDays > 30) {
      return 'CRITICAL';
    } else if (overdueTasks > 3 || inactiveDays > 14) {
      return 'WARNING';
    } else {
      return 'HEALTHY';
    }
  }

  /**
   * Get efficiency score (compared to similar cases)
   */
  public calculateEfficiencyScore(): number {
    // Simple calculation - in production would use ML
    const now = new Date();
    const daysSinceStart = Math.floor(
      (now.getTime() - this.props.startedAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    const expectedDays = this.props.analytics.estimatedTotalTimeDays;
    if (daysSinceStart === 0 || expectedDays === 0) return 100;

    const efficiency = this.props.percentComplete / 100 / (daysSinceStart / expectedDays);
    return Math.min(100, Math.max(0, Math.round(efficiency * 100)));
  }

  // ==================== BUSINESS LOGIC - TASK MANAGEMENT ====================

  /**
   * Generate initial roadmap tasks based on succession context
   */
  public generateInitialTasks(estateValueKES: number, existingRisks: string[] = []): RoadmapTask[] {
    this.ensureNotDeleted();

    const generatedTasks: RoadmapTask[] = [];
    const taskTemplates = new Set<string>();

    // Add mandatory tasks
    ExecutorRoadmap.TASK_TEMPLATES.MANDATORY.forEach((template) => taskTemplates.add(template));

    // Add context-specific tasks
    const context = this.props.successionContext;

    if (context.regime === SuccessionRegime.INTESTATE) {
      ExecutorRoadmap.TASK_TEMPLATES.INTESTATE.forEach((template) => taskTemplates.add(template));
    } else if (context.regime === SuccessionRegime.TESTATE) {
      ExecutorRoadmap.TASK_TEMPLATES.TESTATE.forEach((template) => taskTemplates.add(template));
    }

    if (context.religion === SuccessionReligion.ISLAMIC) {
      ExecutorRoadmap.TASK_TEMPLATES.ISLAMIC.forEach((template) => taskTemplates.add(template));
    }

    if (context.marriageType === SuccessionMarriageType.POLYGAMOUS) {
      ExecutorRoadmap.TASK_TEMPLATES.POLYGAMOUS.forEach((template) => taskTemplates.add(template));
    }

    if (context.isMinorInvolved) {
      ExecutorRoadmap.TASK_TEMPLATES.WITH_MINORS.forEach((template) => taskTemplates.add(template));
    }

    if (context.isBusinessAssetsInvolved) {
      ExecutorRoadmap.TASK_TEMPLATES.BUSINESS_ASSETS.forEach((template) =>
        taskTemplates.add(template),
      );
    }

    if (context.hasDisputedAssets) {
      ExecutorRoadmap.TASK_TEMPLATES.DISPUTED.forEach((template) => taskTemplates.add(template));
    }

    // Generate tasks from templates
    let phase = 1;
    let orderIndex = 1;

    taskTemplates.forEach((template) => {
      const task = this.createTaskFromTemplate(template, phase, orderIndex, estateValueKES);
      if (task) {
        generatedTasks.push(task);

        // Link to existing risks if applicable
        existingRisks.forEach((riskId) => {
          if (this.taskResolvesRisk(task, riskId)) {
            task.addRelatedRiskFlag(riskId);
          }
        });

        orderIndex++;

        // Move to next phase after certain tasks
        if (['COURT_FILING', 'GAZETTE_PUBLICATION'].includes(template)) {
          phase = 2;
          orderIndex = 1;
        } else if (['GRANT_COLLECTION'].includes(template)) {
          phase = 3;
          orderIndex = 1;
        } else if (['ASSET_DISTRIBUTION'].includes(template)) {
          phase = 4;
          orderIndex = 1;
        } else if (['FINAL_ACCOUNTS'].includes(template)) {
          phase = 5;
          orderIndex = 1;
        }
      }
    });

    // Add all generated tasks to roadmap
    generatedTasks.forEach((task) => this.addTask(task));

    // Calculate dependencies
    this.calculateTaskDependencies();

    // Update analytics
    this.updateAnalytics();

    return generatedTasks;
  }

  /**
   * Add a task to the roadmap
   */
  public addTask(task: RoadmapTask): void {
    this.ensureNotDeleted();

    // Check for duplicate task (same shortCode in same phase)
    const existingTask = this.props.tasks.find(
      (t) => t.shortCode === task.shortCode && this.getTaskPhase(t) === this.getTaskPhase(task),
    );

    if (existingTask) {
      throw new Error(`Task ${task.shortCode} already exists in phase ${this.getTaskPhase(task)}`);
    }

    const updatedTasks = [...this.props.tasks, task];
    const phaseProgress = this.updatePhaseProgress(this.getTaskPhase(task));

    this.updateState({
      tasks: updatedTasks,
      totalTasks: this.props.totalTasks + 1,
      phases: new Map([...this.props.phases, [this.getTaskPhase(task), phaseProgress]]),
      lastActiveAt: new Date(),
    });

    // Emit event
    this.addDomainEvent(
      new TaskAssigned(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        roadmapId: this.id.toString(),
        estateId: this.props.estateId,
        taskId: task.id.toString(),
        taskTitle: task.title,
        phase: this.getTaskPhase(task),
        priority: task.priority,
      }),
    );
  }

  /**
   * Start a task
   */
  public startTask(taskId: string, userId: string): void {
    this.ensureNotDeleted();

    const task = this.findTaskById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Check dependencies
    const allDependenciesMet = task.dependsOnTaskIds.every((depId) => {
      const depTask = this.findTaskById(depId);
      return (
        depTask &&
        (depTask.status === TaskStatus.COMPLETED || depTask.status === TaskStatus.SKIPPED)
      );
    });

    if (!allDependenciesMet) {
      throw new Error('Cannot start task - dependencies not met');
    }

    task.start(userId);

    // Update last active time
    this.updateState({
      lastActiveAt: new Date(),
      daysInactive: 0,
    });

    // Emit event
    this.addDomainEvent(
      new RoadmapTaskStartedEvent(this.id.toString(), this.getVersion(), {
        taskId: task.id.toString(),
        title: task.title,
        startedBy: userId,
        phase: this.getTaskPhase(task),
        startedAt: new Date(),
      }),
    );

    // Update phase progress
    this.updatePhaseProgress(this.getTaskPhase(task));
  }

  /**
   * Complete a task
   */
  public completeTask(taskId: string, userId: string, notes?: string, proofData?: any): void {
    this.ensureNotDeleted();

    const task = this.findTaskById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (task.status !== TaskStatus.IN_PROGRESS) {
      throw new Error(`Cannot complete task with status ${task.status}`);
    }

    const timeSpentBefore = task.timeSpentMinutes;
    task.complete(userId, notes, proofData);
    const timeSpentAfter = task.timeSpentMinutes;

    // Update counters and time tracking
    const updatedCompletedTasks = this.props.completedTasks + 1;
    const updatedTimeSpent =
      this.props.totalTimeSpentHours + (timeSpentAfter - timeSpentBefore) / 60;

    this.updateState({
      completedTasks: updatedCompletedTasks,
      totalTimeSpentHours: updatedTimeSpent,
      lastActiveAt: new Date(),
      daysInactive: 0,
    });

    // Update phase progress
    const taskPhase = this.getTaskPhase(task);
    this.updatePhaseProgress(taskPhase);

    // Emit event
    this.addDomainEvent(
      new RoadmapTaskCompletedEvent(this.id.toString(), this.getVersion(), {
        taskId: task.id.toString(),
        title: task.title,
        completedBy: userId,
        phase: taskPhase,
        timeSpentMinutes: timeSpentAfter - timeSpentBefore,
        completionNotes: notes,
        completedAt: new Date(),
      }),
    );

    // Check if this task resolves any risks
    this.checkRiskResolution(task);

    // Unlock dependent tasks
    this.unlockDependentTasks(taskId);

    // Check phase completion
    this.checkPhaseCompletion();

    // Check roadmap completion
    this.checkRoadmapCompletion();

    // Update analytics
    this.updateAnalytics();
  }

  /**
   * Auto-complete a task (system triggered)
   */
  public autoCompleteTask(taskId: string, reason: string): void {
    this.ensureNotDeleted();

    const task = this.findTaskById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Only auto-complete pending or in-progress tasks
    if (![TaskStatus.PENDING, TaskStatus.IN_PROGRESS].includes(task.status)) {
      return;
    }

    task.complete('system', `Auto-completed: ${reason}`);

    // Update counters
    const updatedCompletedTasks = this.props.completedTasks + 1;

    this.updateState({
      completedTasks: updatedCompletedTasks,
      lastActiveAt: new Date(),
    });

    // Update phase progress
    this.updatePhaseProgress(this.getTaskPhase(task));

    // Emit event
    this.addDomainEvent(
      new TaskAutoCompleted(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        roadmapId: this.id.toString(),
        estateId: this.props.estateId,
        taskId: task.id.toString(),
        taskTitle: task.title,
        reason,
        completedAt: new Date(),
      }),
    );

    // Unlock dependent tasks
    this.unlockDependentTasks(taskId);

    // Check phase completion
    this.checkPhaseCompletion();
  }

  /**
   * Skip a task (when not applicable)
   */
  public skipTask(taskId: string, reason: string): void {
    this.ensureNotDeleted();

    const task = this.findTaskById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.skip('system', reason);

    // Update counters
    const updatedSkippedTasks = this.props.skippedTasks + 1;

    this.updateState({
      skippedTasks: updatedSkippedTasks,
      lastActiveAt: new Date(),
    });

    // Update phase progress
    this.updatePhaseProgress(this.getTaskPhase(task));

    // Unlock dependent tasks
    this.unlockDependentTasks(taskId);

    // Check phase completion
    this.checkPhaseCompletion();
  }

  /**
   * Block a task (due to external factor)
   */
  public blockTask(taskId: string, reason: string, riskId?: string): void {
    this.ensureNotDeleted();

    const task = this.findTaskById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    task.block('system', reason);

    // Update counters and risk tracking
    const updatedBlockedTasks = this.props.blockedTasks + 1;
    const updatedBlockedByRisks =
      riskId && !this.props.blockedByRiskIds.includes(riskId)
        ? [...this.props.blockedByRiskIds, riskId]
        : this.props.blockedByRiskIds;

    this.updateState({
      blockedTasks: updatedBlockedTasks,
      blockedByRiskIds: updatedBlockedByRisks,
      lastActiveAt: new Date(),
    });

    // Emit event
    this.addDomainEvent(
      new RiskBlockingTask(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        roadmapId: this.id.toString(),
        estateId: this.props.estateId,
        taskId: task.id.toString(),
        taskTitle: task.title,
        riskId,
        reason,
        blockedAt: new Date(),
      }),
    );
  }

  /**
   * Unblock a task (risk resolved)
   */
  public unblockTask(taskId: string, _reason: string, riskId?: string): void {
    this.ensureNotDeleted();

    const task = this.findTaskById(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    if (task.status !== TaskStatus.BLOCKED) {
      return;
    }

    task.unlock('system');

    // Update counters and risk tracking
    const updatedBlockedTasks = this.props.blockedTasks - 1;
    const updatedBlockedByRisks = riskId
      ? this.props.blockedByRiskIds.filter((id) => id !== riskId)
      : this.props.blockedByRiskIds;

    this.updateState({
      blockedTasks: updatedBlockedTasks,
      blockedByRiskIds: updatedBlockedByRisks,
      lastActiveAt: new Date(),
    });
  }

  // ==================== BUSINESS LOGIC - PHASE MANAGEMENT ====================

  /**
   * Transition to next phase
   */
  public transitionToNextPhase(): void {
    this.ensureNotDeleted();

    if (!this.isReadyForNextPhase()) {
      throw new Error(
        `Cannot transition from ${this.props.currentPhase} - only ${this.getCurrentPhaseProgress()}% complete (requires ${ExecutorRoadmap.PHASE_DEFINITIONS[this.props.currentPhase].requiredForNextPhase}%)`,
      );
    }

    const phaseOrder: RoadmapPhase[] = [
      RoadmapPhase.PRE_FILING,
      RoadmapPhase.FILING,
      RoadmapPhase.CONFIRMATION,
      RoadmapPhase.DISTRIBUTION,
      RoadmapPhase.CLOSURE,
    ];

    const currentIndex = phaseOrder.indexOf(this.props.currentPhase);
    if (currentIndex === -1 || currentIndex === phaseOrder.length - 1) {
      throw new Error('Cannot transition past final phase');
    }

    const oldPhase = this.props.currentPhase;
    const newPhase = phaseOrder[currentIndex + 1];

    // Update phase history
    const updatedPhaseHistory = [...this.props.phaseHistory];
    const currentPhaseEntry = updatedPhaseHistory.find(
      (entry) => entry.phase === oldPhase && !entry.exitedAt,
    );
    if (currentPhaseEntry) {
      currentPhaseEntry.exitedAt = new Date();
      if (currentPhaseEntry.enteredAt) {
        currentPhaseEntry.durationDays = Math.ceil(
          (currentPhaseEntry.exitedAt.getTime() - currentPhaseEntry.enteredAt.getTime()) /
            (1000 * 60 * 60 * 24),
        );
      }
    }

    // Add new phase entry
    updatedPhaseHistory.push({
      phase: newPhase,
      enteredAt: new Date(),
    });

    // Update phase progress
    const newPhaseProgress = this.updatePhaseProgress(newPhase);
    const updatedPhases = new Map(this.props.phases);
    updatedPhases.set(newPhase, newPhaseProgress);

    this.updateState({
      currentPhase: newPhase,
      phaseHistory: updatedPhaseHistory,
      phases: updatedPhases,
      lastActiveAt: new Date(),
    });

    // Emit event
    this.addDomainEvent(
      new PhaseTransitioned(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        roadmapId: this.id.toString(),
        estateId: this.props.estateId,
        fromPhase: oldPhase,
        toPhase: newPhase,
        transitionedAt: new Date(),
      }),
    );

    // Check if all tasks in old phase are complete
    const oldPhaseTasks = this.getTasksByPhase(oldPhase);
    const allOldPhaseComplete = oldPhaseTasks.every(
      (task) => task.status === TaskStatus.COMPLETED || task.status === TaskStatus.SKIPPED,
    );

    if (allOldPhaseComplete) {
      this.addDomainEvent(
        new AllPhaseTasksCompleted(this.id.toString(), this.getAggregateType(), this.getVersion(), {
          roadmapId: this.id.toString(),
          estateId: this.props.estateId,
          phase: oldPhase,
          totalTasks: oldPhaseTasks.length,
          completedAt: new Date(),
        }),
      );
    }

    // Update analytics
    this.updateAnalytics();
  }

  /**
   * Force transition to phase (for manual overrides)
   */
  public forceTransitionToPhase(targetPhase: RoadmapPhase): void {
    this.ensureNotDeleted();

    if (this.props.currentPhase === targetPhase) {
      return;
    }

    const phaseOrder: RoadmapPhase[] = [
      RoadmapPhase.PRE_FILING,
      RoadmapPhase.FILING,
      RoadmapPhase.CONFIRMATION,
      RoadmapPhase.DISTRIBUTION,
      RoadmapPhase.CLOSURE,
    ];

    const currentIndex = phaseOrder.indexOf(this.props.currentPhase);
    const targetIndex = phaseOrder.indexOf(targetPhase);

    if (currentIndex === -1 || targetIndex === -1) {
      throw new Error('Invalid phase');
    }

    if (targetIndex < currentIndex) {
      throw new Error('Cannot transition backwards');
    }

    const oldPhase = this.props.currentPhase;

    // Update phase history
    const updatedPhaseHistory = [...this.props.phaseHistory];
    const currentPhaseEntry = updatedPhaseHistory.find(
      (entry) => entry.phase === oldPhase && !entry.exitedAt,
    );
    if (currentPhaseEntry) {
      currentPhaseEntry.exitedAt = new Date();
      currentPhaseEntry.durationDays = Math.ceil(
        (currentPhaseEntry.exitedAt.getTime() - currentPhaseEntry.enteredAt.getTime()) /
          (1000 * 60 * 60 * 24),
      );
    }

    // Add new phase entry
    updatedPhaseHistory.push({
      phase: targetPhase,
      enteredAt: new Date(),
    });

    // Update phase progress
    const newPhaseProgress = this.updatePhaseProgress(targetPhase);
    const updatedPhases = new Map(this.props.phases);
    updatedPhases.set(targetPhase, newPhaseProgress);

    this.updateState({
      currentPhase: targetPhase,
      phaseHistory: updatedPhaseHistory,
      phases: updatedPhases,
      lastActiveAt: new Date(),
    });

    // Emit event
    this.addDomainEvent(
      new PhaseTransitioned(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        roadmapId: this.id.toString(),
        estateId: this.props.estateId,
        fromPhase: oldPhase,
        toPhase: targetPhase,
        transitionedAt: new Date(),
      }),
    );
  }

  // ==================== BUSINESS LOGIC - RISK INTEGRATION ====================

  /**
   * Link a risk to roadmap (when risk blocks progress)
   */
  public linkRisk(riskId: string, blockingTaskIds: string[] = []): void {
    this.ensureNotDeleted();

    if (this.props.blockedByRiskIds.includes(riskId)) {
      return; // Already linked
    }

    const updatedBlockedByRisks = [...this.props.blockedByRiskIds, riskId];

    // Block associated tasks
    blockingTaskIds.forEach((taskId) => {
      const task = this.findTaskById(taskId);
      if (task) {
        task.block('system', `Blocked by risk: ${riskId}`);
      }
    });

    const updatedBlockedTasks = this.props.tasks.filter(
      (t) => t.status === TaskStatus.BLOCKED,
    ).length;

    this.updateState({
      blockedByRiskIds: updatedBlockedByRisks,
      blockedTasks: updatedBlockedTasks,
      lastActiveAt: new Date(),
    });

    // Update roadmap status if blocked
    if (blockingTaskIds.length > 0 && this.props.status !== RoadmapStatus.BLOCKED) {
      this.updateState({
        status: RoadmapStatus.BLOCKED,
      });
    }
  }

  /**
   * Unlink a risk from roadmap (risk resolved)
   */
  public unlinkRisk(riskId: string): void {
    this.ensureNotDeleted();

    if (!this.props.blockedByRiskIds.includes(riskId)) {
      return; // Not linked
    }

    const updatedBlockedByRisks = this.props.blockedByRiskIds.filter((id) => id !== riskId);

    // Unblock tasks associated with this risk
    this.props.tasks.forEach((task) => {
      if (task.status === TaskStatus.BLOCKED && task.relatedRiskFlagIds.includes(riskId)) {
        task.unlock('system');
      }
    });

    const updatedBlockedTasks = this.props.tasks.filter(
      (t) => t.status === TaskStatus.BLOCKED,
    ).length;
    const updatedResolvesRiskIds = [...this.props.resolvesRiskIds, riskId];

    // Update roadmap status if no longer blocked
    let updatedStatus = this.props.status;
    if (updatedBlockedTasks === 0 && this.props.status === RoadmapStatus.BLOCKED) {
      updatedStatus = RoadmapStatus.ACTIVE;
    }

    this.updateState({
      blockedByRiskIds: updatedBlockedByRisks,
      resolvesRiskIds: updatedResolvesRiskIds,
      blockedTasks: updatedBlockedTasks,
      status: updatedStatus,
      lastActiveAt: new Date(),
    });
  }

  /**
   * Link document gap to roadmap
   */
  public linkDocumentGap(documentGapId: string, resolvingTaskIds: string[]): void {
    this.ensureNotDeleted();

    if (this.props.linkedDocumentGaps.includes(documentGapId)) {
      return;
    }

    const updatedLinkedDocumentGaps = [...this.props.linkedDocumentGaps, documentGapId];

    // Link to resolving tasks
    resolvingTaskIds.forEach((taskId) => {
      const task = this.findTaskById(taskId);
      if (task) {
        task.addRelatedDocumentGap(documentGapId);
      }
    });

    this.updateState({
      linkedDocumentGaps: updatedLinkedDocumentGaps,
      lastActiveAt: new Date(),
    });
  }

  // ==================== BUSINESS LOGIC - OPTIMIZATION ====================

  /**
   * Optimize roadmap based on current progress
   */
  public optimizeRoadmap(): void {
    this.ensureNotDeleted();

    // 1. Recalculate task dependencies
    this.calculateTaskDependencies();

    // 2. Update task priorities based on current context
    this.updateTaskPriorities();

    // 3. Recalculate estimated completion dates
    this.recalculateTimeEstimates();

    // 4. Identify critical path
    this.identifyCriticalPath();

    // 5. Update analytics
    this.updateAnalytics();

    this.updateState({
      lastOptimizedAt: new Date(),
      optimizationCount: this.props.optimizationCount + 1,
      lastActiveAt: new Date(),
    });

    // Emit event
    this.addDomainEvent(
      new RoadmapOptimized(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        roadmapId: this.id.toString(),
        estateId: this.props.estateId,
        optimizationCount: this.props.optimizationCount + 1,
        optimizedAt: new Date(),
      }),
    );
  }

  /**
   * Regenerate roadmap (when context changes significantly)
   */
  public regenerateRoadmap(newContext: SuccessionContext, estateValueKES: number): RoadmapTask[] {
    this.ensureNotDeleted();

    // Store old tasks for reference

    // Clear current tasks (but keep completed ones for audit)
    const completedTasks = this.props.tasks.filter((t) => t.status === TaskStatus.COMPLETED);
    const newTasks = this.generateInitialTasks(estateValueKES);

    // Link completed tasks from old roadmap
    completedTasks.forEach((oldTask) => {
      const matchingNewTask = newTasks.find(
        (newTask) =>
          newTask.shortCode === oldTask.shortCode &&
          this.getTaskPhase(newTask) === this.getTaskPhase(oldTask),
      );

      if (matchingNewTask) {
        // Mark as completed
        matchingNewTask.complete('system', 'Carried over from previous roadmap generation');
      }
    });

    // Update state with new tasks
    const totalTasks = newTasks.length;
    const completedTasksCount = newTasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const skippedTasksCount = newTasks.filter((t) => t.status === TaskStatus.SKIPPED).length;

    // Reset phases
    const phases = new Map<RoadmapPhase, PhaseProgress>();
    Object.values(RoadmapPhase).forEach((phase) => {
      phases.set(phase, this.createPhaseProgress(phase));
    });

    this.updateState({
      tasks: newTasks,
      successionContext: newContext,
      totalTasks,
      completedTasks: completedTasksCount,
      skippedTasks: skippedTasksCount,
      phases,
      lastActiveAt: new Date(),
    });

    // Update analytics
    this.updateAnalytics();

    // Emit event
    this.addDomainEvent(
      new RoadmapRegenerated(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        roadmapId: this.id.toString(),
        estateId: this.props.estateId,
        oldContext: this.props.successionContext.toJSON(),
        newContext: newContext.toJSON(),
        totalTasks: newTasks.length,
        carriedOverTasks: completedTasks.length,
        regeneratedAt: new Date(),
      }),
    );

    return newTasks;
  }

  // ==================== PRIVATE HELPERS ====================

  /**
   * Find task by ID
   */
  private findTaskById(taskId: string): RoadmapTask | null {
    return this.props.tasks.find((t) => t.id.equals(taskId)) || null;
  }

  /**
   * Get phase for a task
   */
  private getTaskPhase(task: RoadmapTask): RoadmapPhase {
    // Map task category to phase
    const categoryPhaseMap: Record<TaskCategory, RoadmapPhase> = {
      [TaskCategory.IDENTITY_VERIFICATION]: RoadmapPhase.PRE_FILING,
      [TaskCategory.FAMILY_STRUCTURE]: RoadmapPhase.PRE_FILING,
      [TaskCategory.GUARDIANSHIP]: RoadmapPhase.PRE_FILING,
      [TaskCategory.ASSET_DISCOVERY]: RoadmapPhase.PRE_FILING,
      [TaskCategory.DEBT_SETTLEMENT]: RoadmapPhase.PRE_FILING,
      [TaskCategory.DOCUMENT_COLLECTION]: RoadmapPhase.PRE_FILING,
      [TaskCategory.DOCUMENT_VALIDATION]: RoadmapPhase.PRE_FILING,
      [TaskCategory.CUSTOMARY_DOCUMENTS]: RoadmapPhase.PRE_FILING,
      [TaskCategory.FORM_GENERATION]: RoadmapPhase.FILING,
      [TaskCategory.FORM_REVIEW]: RoadmapPhase.FILING,
      [TaskCategory.SIGNATURE_COLLECTION]: RoadmapPhase.FILING,
      [TaskCategory.COURT_SELECTION]: RoadmapPhase.FILING,
      [TaskCategory.FEE_PAYMENT]: RoadmapPhase.FILING,
      [TaskCategory.LODGEMENT]: RoadmapPhase.FILING,
      [TaskCategory.GAZETTE_PUBLICATION]: RoadmapPhase.FILING,
      [TaskCategory.COURT_ATTENDANCE]: RoadmapPhase.CONFIRMATION,
      [TaskCategory.GRANT_ISSUANCE]: RoadmapPhase.CONFIRMATION,
      [TaskCategory.GRANT_CONFIRMATION]: RoadmapPhase.CONFIRMATION,
      [TaskCategory.ASSET_TRANSFER]: RoadmapPhase.DISTRIBUTION,
      [TaskCategory.DEBT_PAYMENT]: RoadmapPhase.DISTRIBUTION,
      [TaskCategory.TAX_CLEARANCE]: RoadmapPhase.DISTRIBUTION,
      [TaskCategory.FINAL_ACCOUNTS]: RoadmapPhase.CLOSURE,
      [TaskCategory.ESTATE_CLOSURE]: RoadmapPhase.CLOSURE,
      [TaskCategory.BENEFICIARY_NOTIFICATION]: RoadmapPhase.CLOSURE,
      [TaskCategory.WILL_SPECIFIC]: RoadmapPhase.PRE_FILING,
      [TaskCategory.ISLAMIC_SPECIFIC]: RoadmapPhase.PRE_FILING,
      [TaskCategory.POLYGAMOUS_SPECIFIC]: RoadmapPhase.PRE_FILING,
      [TaskCategory.MINOR_SPECIFIC]: RoadmapPhase.PRE_FILING,
      [TaskCategory.DISPUTE_RESOLUTION]: RoadmapPhase.CONFIRMATION,
    };

    return categoryPhaseMap[task.category] || RoadmapPhase.PRE_FILING;
  }

  /**
   * Create a task from template
   */
  private createTaskFromTemplate(
    template: string,
    phase: number,
    orderIndex: number,
    _estateValueKES: number,
  ): RoadmapTask | null {
    const context = this.props.successionContext;

    switch (template) {
      case 'DEATH_CERTIFICATE':
        return RoadmapTask.createDeathCertificateTask(
          this.props.estateId,
          phase,
          orderIndex,
          'system',
        );

      case 'CHIEF_LETTER':
        if (context.regime === SuccessionRegime.INTESTATE) {
          return RoadmapTask.createChiefLetterTask(
            this.props.estateId,
            phase,
            orderIndex,
            'system',
          );
        }
        return null;

      case 'GUARDIAN_APPOINTMENT':
        if (context.isMinorInvolved) {
          return RoadmapTask.createGuardianAppointmentTask(
            this.props.estateId,
            [], // minorIds would come from family service
            phase,
            orderIndex,
            'system',
          );
        }
        return null;

      case 'COURT_FILING': {
        const courtJurisdiction = context.determineCourtJurisdiction();
        return RoadmapTask.createCourtFilingTask(
          courtJurisdiction,
          phase,
          orderIndex,
          [], // dependsOnTaskIds would be calculated
          'system',
        );
      }

      default:
        // Create generic task for other templates
        return RoadmapTask.create({
          title: this.formatTemplateToTitle(template),
          description: `Complete ${template.replace(/_/g, ' ').toLowerCase()}`,
          shortCode: `${template}-${phase}-${orderIndex}`,
          category: TaskCategory.DOCUMENT_COLLECTION,
          priority: TaskPriority.HIGH,
          status: TaskStatus.PENDING,
          phase,
          orderIndex,
          dependsOnTaskIds: [],
          blocksTaskIds: [],
          applicableContexts: ['ALL'],
          legalReferences: [],
          triggers: [TaskTrigger.MANUAL],
          detailedInstructions: ['Complete this task as required'],
          quickTips: [],
          commonMistakes: [],
          externalLinks: [],
          estimatedTimeMinutes: 60,
          requiresProof: false,
          proofTypes: [],
          isOverdue: false,
          reminderIntervalDays: 7,
          escalationLevel: 0,
          autoEscalateAfterDays: 14,
          timeSpentMinutes: 0,
          retryCount: 0,
          tags: ['auto-generated', template.toLowerCase()],
          templateVersion: '2024.1',
          createdBy: 'system',
          lastModifiedBy: 'system',
          lastModifiedAt: new Date(),
          relatedRiskFlagIds: [],
          relatedDocumentGapIds: [],
          history: [
            {
              timestamp: new Date(),
              action: 'CREATED',
              performedBy: 'system',
            },
          ],
        });
    }
  }

  /**
   * Format template string to title
   */
  private formatTemplateToTitle(template: string): string {
    return template
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Calculate task dependencies
   */
  private calculateTaskDependencies(): void {
    const tasks = [...this.props.tasks];

    // Simple dependency logic:
    // - Identity verification before family structure
    // - Family structure before asset discovery
    // - All pre-filing before court filing
    // etc.

    // This would be more complex in production
    const identityTask = tasks.find((t) => t.shortCode.includes('IDV'));
    const familyTask = tasks.find((t) => t.shortCode.includes('FAMILY'));
    const assetTask = tasks.find((t) => t.shortCode.includes('ASSET'));

    if (identityTask && familyTask) {
      familyTask.addDependency(identityTask.id.toString());
    }

    if (familyTask && assetTask) {
      assetTask.addDependency(familyTask.id.toString());
    }

    // Emit event if dependencies changed
    this.addDomainEvent(
      new TaskDependenciesUpdated(this.id.toString(), this.getAggregateType(), this.getVersion(), {
        roadmapId: this.id.toString(),
        estateId: this.props.estateId,
        updatedTaskCount: tasks.length,
        updatedAt: new Date(),
      }),
    );
  }

  /**
   * Unlock dependent tasks when a task is completed
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
        return (
          depTask &&
          (depTask.status === TaskStatus.COMPLETED || depTask.status === TaskStatus.SKIPPED)
        );
      });

      if (allDependenciesMet) {
        task.unlock('system');

        // Emit event
        this.addDomainEvent(
          new TaskUnlocked(this.id.toString(), this.getAggregateType(), this.getVersion(), {
            roadmapId: this.id.toString(),
            estateId: this.props.estateId,
            taskId: task.id.toString(),
            taskTitle: task.title,
            unlockedAt: new Date(),
          }),
        );
      }
    }
  }

  /**
   * Check if task resolves a risk
   */
  private taskResolvesRisk(task: RoadmapTask, _riskId: string): boolean {
    // Simple check - in production would use risk analysis
    const riskKeywords = ['DEATH_CERTIFICATE', 'GUARDIAN', 'CHIEF_LETTER', 'WILL', 'ASSET'];
    const taskTitle = task.title.toUpperCase();

    return riskKeywords.some(
      (keyword) => taskTitle.includes(keyword) || task.shortCode.includes(keyword),
    );
  }

  /**
   * Check risk resolution when task completes
   */
  private checkRiskResolution(task: RoadmapTask): void {
    task.relatedRiskFlagIds.forEach((riskId) => {
      this.unlinkRisk(riskId);
    });
  }

  /**
   * Check phase completion
   */
  private checkPhaseCompletion(): void {
    const currentPhase = this.props.currentPhase;
    const phaseProgress = this.props.phases.get(currentPhase);

    if (!phaseProgress) return;

    if (phaseProgress.percentComplete >= 100 && this.props.autoTransitionEnabled) {
      // Auto-transition to next phase
      try {
        this.transitionToNextPhase();
      } catch (error) {
        // Might be last phase or other constraint
        console.log('Auto-transition failed:', error.message);
      }
    }
  }

  /**
   * Check roadmap completion
   */
  private checkRoadmapCompletion(): void {
    if (this.props.percentComplete >= 100 && this.props.currentPhase === RoadmapPhase.CLOSURE) {
      this.updateState({
        status: RoadmapStatus.COMPLETED,
        actualCompletionDate: new Date(),
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
          totalTimeSpentHours: this.props.totalTimeSpentHours,
        }),
      );
    }
  }

  /**
   * Update phase progress
   */
  private updatePhaseProgress(phase: RoadmapPhase): PhaseProgress {
    const phaseTasks = this.getTasksByPhase(phase);
    const totalTasks = phaseTasks.length;

    if (totalTasks === 0) {
      return {
        phase,
        completedTasks: 0,
        totalTasks: 0,
        percentComplete: 100,
        criticalTasksRemaining: 0,
      };
    }

    const completedTasks = phaseTasks.filter(
      (t) => t.status === TaskStatus.COMPLETED || t.status === TaskStatus.SKIPPED,
    ).length;

    const percentComplete = Math.round((completedTasks / totalTasks) * 100);
    const criticalTasksRemaining = phaseTasks.filter(
      (t) =>
        t.status !== TaskStatus.COMPLETED &&
        t.status !== TaskStatus.SKIPPED &&
        t.priority === TaskPriority.CRITICAL,
    ).length;

    const existingProgress = this.props.phases.get(phase);

    return {
      phase,
      completedTasks,
      totalTasks,
      percentComplete,
      startedAt: existingProgress?.startedAt || (phaseTasks.length > 0 ? new Date() : undefined),
      completedAt: percentComplete === 100 ? new Date() : undefined,
      estimatedCompletionDate: this.calculatePhaseCompletionDate(phase),
      criticalTasksRemaining,
    };
  }

  /**
   * Create initial phase progress
   */
  private createPhaseProgress(phase: RoadmapPhase): PhaseProgress {
    return {
      phase,
      completedTasks: 0,
      totalTasks: 0,
      percentComplete: 0,
      criticalTasksRemaining: 0,
    };
  }

  /**
   * Calculate phase completion date
   */
  private calculatePhaseCompletionDate(phase: RoadmapPhase): Date {
    const phaseDef = ExecutorRoadmap.PHASE_DEFINITIONS[phase];
    const now = new Date();

    if (!phaseDef) {
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days default
    }

    // Adjust based on progress
    const progress = this.props.phases.get(phase);
    const percentComplete = progress?.percentComplete || 0;
    const remainingPercent = 100 - percentComplete;

    // Estimated remaining days = (remaining percent / 100) * total estimated days
    const estimatedRemainingDays = (remainingPercent / 100) * phaseDef.estimatedDurationDays;

    const completionDate = new Date(now);
    completionDate.setDate(completionDate.getDate() + estimatedRemainingDays);

    return completionDate;
  }

  /**
   * Update task priorities
   */
  private updateTaskPriorities(): void {
    this.props.tasks.forEach((task) => {
      if (task.status === TaskStatus.PENDING || task.status === TaskStatus.IN_PROGRESS) {
        // Upgrade priority if overdue
        if (task.isOverdue && task.priority !== TaskPriority.CRITICAL) {
          task.updatePriority(TaskPriority.CRITICAL, 'system');
        }

        // Check if task is blocking other tasks
        const blockingCount = task.blocksTaskIds.length;
        if (blockingCount > 2 && task.priority !== TaskPriority.CRITICAL) {
          task.updatePriority(TaskPriority.HIGH, 'system');
        }
      }
    });
  }

  /**
   * Recalculate time estimates
   */
  private recalculateTimeEstimates(): void {
    // Update task due dates based on current progress
    const now = new Date();

    this.props.tasks.forEach((task) => {
      if (task.status === TaskStatus.PENDING && !task.dueDate) {
        // Set due date based on task priority
        const dueDate = new Date(now);
        const priorityDays = {
          [TaskPriority.CRITICAL]: 3,
          [TaskPriority.HIGH]: 7,
          [TaskPriority.MEDIUM]: 14,
          [TaskPriority.LOW]: 30,
        };

        dueDate.setDate(dueDate.getDate() + priorityDays[task.priority]);
        task.updateDueDate(dueDate, 'system');
      }
    });
  }

  /**
   * Identify critical path
   */
  private identifyCriticalPath(): void {
    const criticalTasks = this.props.tasks.filter(
      (task) =>
        task.priority === TaskPriority.CRITICAL &&
        (task.status === TaskStatus.PENDING || task.status === TaskStatus.IN_PROGRESS),
    );

    if (criticalTasks.length > 0) {
      this.addDomainEvent(
        new CriticalPathIdentified(this.id.toString(), this.getAggregateType(), this.getVersion(), {
          roadmapId: this.id.toString(),
          estateId: this.props.estateId,
          criticalTaskCount: criticalTasks.length,
          criticalTasks: criticalTasks.map((t) => ({
            id: t.id.toString(),
            title: t.title,
            priority: t.priority,
            status: t.status,
          })),
          identifiedAt: new Date(),
        }),
      );
    }
  }

  /**
   * Update roadmap analytics
   */
  private updateAnalytics(): void {
    // Calculate estimated total time
    let estimatedTotalDays = 0;
    Object.values(RoadmapPhase).forEach((phase) => {
      const phaseDef = ExecutorRoadmap.PHASE_DEFINITIONS[phase];
      if (phaseDef) {
        estimatedTotalDays += phaseDef.estimatedDurationDays;
      }
    });

    // Adjust based on progress
    const remainingPercent = 100 - this.props.percentComplete;
    const estimatedRemainingDays = (remainingPercent / 100) * estimatedTotalDays;
    const estimatedCompletion = new Date();
    estimatedCompletion.setDate(estimatedCompletion.getDate() + estimatedRemainingDays);

    // Calculate complexity score
    const complexityScore = Math.min(10, this.props.successionContext.estimatedComplexityScore);

    // Calculate risk exposure
    const riskExposure = Math.min(
      100,
      this.props.blockedByRiskIds.length * 20 +
        this.getOverdueTasks().length * 10 +
        this.getBlockedTasks().length * 15,
    );

    const analytics: RoadmapAnalytics = {
      estimatedTotalTimeDays: estimatedTotalDays,
      estimatedCostKES: this.estimateTotalCost(),
      complexityScore,
      riskExposure,
      efficiencyScore: this.calculateEfficiencyScore(),
      predictedBottlenecks: this.predictBottlenecks(),
      recommendedAccelerations: this.recommendAccelerations(),
    };

    this.updateState({
      analytics,
      estimatedCompletionDate: estimatedCompletion,
    });
  }

  /**
   * Estimate total cost
   */
  private estimateTotalCost(): number {
    // Base court fees
    let total = 5000; // Base filing fees

    // Additional costs based on complexity
    const context = this.props.successionContext;

    if (context.isBusinessAssetsInvolved) {
      total += 20000; // Business valuation costs
    }

    if (context.isForeignAssetsInvolved) {
      total += 15000; // International legal fees
    }

    if (context.hasDisputedAssets) {
      total += 30000; // Mediation/legal costs
    }

    // Gazette publication
    total += 2000;

    return total;
  }

  /**
   * Predict bottlenecks
   */
  private predictBottlenecks(): string[] {
    const bottlenecks: string[] = [];
    const context = this.props.successionContext;

    if (context.marriageType === SuccessionMarriageType.POLYGAMOUS) {
      bottlenecks.push('Family consent collection from multiple wives');
    }

    if (context.isMinorInvolved) {
      bottlenecks.push('Guardian appointment court process');
    }

    if (context.hasDisputedAssets) {
      bottlenecks.push('Asset dispute resolution');
    }

    if (context.isBusinessAssetsInvolved) {
      bottlenecks.push('Business valuation and transfer');
    }

    return bottlenecks;
  }

  /**
   * Recommend accelerations
   */
  private recommendAccelerations(): string[] {
    const accelerations: string[] = [];

    if (this.getOverdueTasks().length > 0) {
      accelerations.push('Focus on overdue critical tasks first');
    }

    if (this.props.daysInactive > 7) {
      accelerations.push('Resume activity to avoid delays');
    }

    const pendingTasks = this.getTasksByStatus(TaskStatus.PENDING);
    if (pendingTasks.length > 10) {
      accelerations.push('Consider parallel task execution for independent tasks');
    }

    return accelerations;
  }

  // ==================== VALIDATION ====================

  public validate(): void {
    // INVARIANT 1: Percent complete must match actual completion
    const actualCompleted = this.props.tasks.filter(
      (t) => t.status === TaskStatus.COMPLETED || t.status === TaskStatus.SKIPPED,
    ).length;

    const calculatedPercent =
      this.props.totalTasks > 0 ? Math.round((actualCompleted / this.props.totalTasks) * 100) : 0;

    if (Math.abs(this.props.percentComplete - calculatedPercent) > 5) {
      throw new Error(
        `Percent complete mismatch: stored=${this.props.percentComplete}, actual=${calculatedPercent}`,
      );
    }

    // INVARIANT 2: Phase progress must be consistent
    Object.values(RoadmapPhase).forEach((phase) => {
      const progress = this.props.phases.get(phase);
      if (progress) {
        const phaseTasks = this.getTasksByPhase(phase);
        const completedPhaseTasks = phaseTasks.filter(
          (t) => t.status === TaskStatus.COMPLETED || t.status === TaskStatus.SKIPPED,
        ).length;

        const calculatedPhasePercent =
          phaseTasks.length > 0 ? Math.round((completedPhaseTasks / phaseTasks.length) * 100) : 100;

        if (Math.abs(progress.percentComplete - calculatedPhasePercent) > 5) {
          throw new Error(
            `Phase ${phase} progress mismatch: stored=${progress.percentComplete}, actual=${calculatedPhasePercent}`,
          );
        }
      }
    });

    // INVARIANT 3: Cannot have completed roadmap with incomplete phases
    if (this.props.status === RoadmapStatus.COMPLETED) {
      const incompletePhases = Array.from(this.props.phases.values()).filter(
        (progress) => progress.percentComplete < 100,
      );

      if (incompletePhases.length > 0) {
        throw new Error('Completed roadmap cannot have incomplete phases');
      }
    }

    // INVARIANT 4: Task dependencies must exist
    for (const task of this.props.tasks) {
      for (const depId of task.dependsOnTaskIds) {
        const depTask = this.findTaskById(depId);
        if (!depTask) {
          throw new Error(`Task ${task.id.toString()} depends on non-existent task ${depId}`);
        }
      }
    }
  }

  // ==================== EVENT SOURCING ====================

  protected applyEvent(event: DomainEvent): void {
    // Event replay logic for rebuilding aggregate state
    switch (event.getEventType()) {
      case 'RoadmapCreated':
      case 'TaskAssigned':
      case 'TaskCompleted':
      case 'PhaseTransitioned':
        // State already updated via business logic methods
        break;
      case 'TaskOverdue': {
        // Handle overdue task updates
        const overduePayload = event.getPayload();
        const task = this.findTaskById(overduePayload.taskId);
        if (task) {
          task.markAsOverdue();
        }
        break;
      }
      default:
        // Handle other events as needed
        break;
    }
  }

  // ==================== FACTORY METHODS ====================

  /**
   * Create a new executor roadmap
   */
  public static create(
    estateId: string,
    successionContext: SuccessionContext,
    readinessAssessmentId: string,
    readinessScore: ReadinessScore,
    userId: string,
    executorName: string,
  ): ExecutorRoadmap {
    const id = UniqueEntityID.newID();
    const now = new Date();

    // Initialize phases
    const phases = new Map<RoadmapPhase, PhaseProgress>();
    Object.values(RoadmapPhase).forEach((phase) => {
      phases.set(phase, {
        phase,
        completedTasks: 0,
        totalTasks: 0,
        percentComplete: 0,
        criticalTasksRemaining: 0,
      });
    });

    // Initialize analytics
    const analytics: RoadmapAnalytics = {
      estimatedTotalTimeDays: 0,
      estimatedCostKES: 0,
      complexityScore: successionContext.estimatedComplexityScore,
      riskExposure: 0,
      predictedBottlenecks: [],
      recommendedAccelerations: [],
    };

    const roadmap = new ExecutorRoadmap(id, {
      estateId,
      successionContext,
      readinessAssessmentId,
      readinessScore,
      currentPhase: RoadmapPhase.PRE_FILING,
      status: RoadmapStatus.DRAFT,
      percentComplete: 0,
      tasks: [],
      phases,
      phaseHistory: [
        {
          phase: RoadmapPhase.PRE_FILING,
          enteredAt: now,
        },
      ],
      totalTasks: 0,
      completedTasks: 0,
      skippedTasks: 0,
      overdueTasks: 0,
      blockedTasks: 0,
      startedAt: now,
      totalTimeSpentHours: 0,
      blockedByRiskIds: [],
      resolvesRiskIds: [],
      linkedDocumentGaps: [],
      analytics,
      userId,
      executorName,
      lastActiveAt: now,
      daysInactive: 0,
      autoTransitionEnabled: true,
      autoTaskGenerationEnabled: true,
      escalationThresholdDays: 14,
      version: 1,
      optimizationCount: 0,
    });

    // Emit creation event
    roadmap.addDomainEvent(
      new RoadmapCreated(id.toString(), roadmap.getAggregateType(), 1, {
        roadmapId: id.toString(),
        estateId,
        readinessAssessmentId,
        successionContext: successionContext.toJSON(),
        userId,
        executorName,
        createdAt: now,
      }),
    );

    return roadmap;
  }

  /**
   * Auto-generate roadmap from readiness assessment
   */
  public static autoGenerate(
    estateId: string,
    successionContext: SuccessionContext,
    readinessAssessmentId: string,
    readinessScore: ReadinessScore,
    userId: string,
    executorName: string,
    estateValueKES: number,
    existingRisks: string[] = [],
  ): ExecutorRoadmap {
    const roadmap = ExecutorRoadmap.create(
      estateId,
      successionContext,
      readinessAssessmentId,
      readinessScore,
      userId,
      executorName,
    );

    // Update status to active
    roadmap.updateState({
      status: RoadmapStatus.ACTIVE,
    });

    // Generate initial tasks
    roadmap.generateInitialTasks(estateValueKES, existingRisks);

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
