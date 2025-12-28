// src/succession-automation/src/domain/entities/roadmap-task.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';

/**
 * Roadmap Task Entity
 *
 * PURPOSE: Represents a specific action the executor must complete.
 * Owned by: ExecutorRoadmap Aggregate
 *
 * DESIGN: Context-Aware Task Generation
 * Tasks are dynamically created based on SuccessionContext:
 * - Intestate → "Obtain Chief's Letter"
 * - Testate → "Locate Original Will"
 * - Islamic → "File in Kadhi's Court"
 * - Polygamous → "Define Houses (S.40)"
 * - Has Minors → "Appoint Guardian"
 *
 * LIFECYCLE:
 * 1. LOCKED → Task not yet available (dependencies incomplete)
 * 2. PENDING → Available to start
 * 3. IN_PROGRESS → User is working on it
 * 4. COMPLETED → Done (with proof if required)
 * 5. SKIPPED → Not applicable (e.g., Chief's Letter for Testate cases)
 *
 * DEPENDENCIES:
 * Tasks can have prerequisites. Example:
 * - "File Application" depends on "Pay Filing Fee"
 * - "Distribute Assets" depends on "Obtain Grant"
 */

export enum TaskStatus {
  LOCKED = 'LOCKED', // Dependencies not met
  PENDING = 'PENDING', // Ready to start
  IN_PROGRESS = 'IN_PROGRESS', // User started
  COMPLETED = 'COMPLETED', // Done
  SKIPPED = 'SKIPPED', // Not applicable
}

export enum TaskCategory {
  // Pre-Filing Tasks
  IDENTITY_VERIFICATION = 'IDENTITY_VERIFICATION',
  DOCUMENT_COLLECTION = 'DOCUMENT_COLLECTION',
  FAMILY_VERIFICATION = 'FAMILY_VERIFICATION',
  ASSET_INVENTORY = 'ASSET_INVENTORY',
  DEBT_VERIFICATION = 'DEBT_VERIFICATION',

  // Will-Specific Tasks
  WILL_VERIFICATION = 'WILL_VERIFICATION',
  WITNESS_CONFIRMATION = 'WITNESS_CONFIRMATION',

  // Guardianship Tasks
  GUARDIAN_APPOINTMENT = 'GUARDIAN_APPOINTMENT',

  // Form Generation Tasks
  FORM_GENERATION = 'FORM_GENERATION',
  FORM_REVIEW = 'FORM_REVIEW',

  // Consent Tasks
  CONSENT_COLLECTION = 'CONSENT_COLLECTION',

  // Filing Tasks
  PAYMENT = 'PAYMENT',
  COURT_FILING = 'COURT_FILING',

  // Post-Filing Tasks
  COURT_ATTENDANCE = 'COURT_ATTENDANCE',
  GRANT_COLLECTION = 'GRANT_COLLECTION',

  // Distribution Tasks
  ASSET_DISTRIBUTION = 'ASSET_DISTRIBUTION',
  FINAL_ACCOUNTS = 'FINAL_ACCOUNTS',

  // Other
  GENERAL = 'GENERAL',
}

export enum TaskPriority {
  CRITICAL = 'CRITICAL', // Blocker - must do now
  HIGH = 'HIGH', // Important - do soon
  MEDIUM = 'MEDIUM', // Normal priority
  LOW = 'LOW', // Nice to have
}

interface RoadmapTaskProps {
  // Identity
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;

  // Status
  status: TaskStatus;

  // Order & Dependencies
  orderIndex: number; // Sort order in roadmap
  dependsOnTaskIds: string[]; // Prerequisite task IDs
  blockingTaskIds: string[]; // Tasks blocked by this one

  // Legal Context
  legalBasis?: string; // E.g., "S.71 Children Act"
  applicableRegimes: string[]; // When is this task relevant?
  isConditional: boolean; // Does it depend on case facts?
  conditionExpression?: string; // "IF hasMinors THEN required"

  // Guidance
  instructions: string[]; // Step-by-step guide
  estimatedDurationDays: number;
  externalLinks: ExternalLink[]; // Helpful resources

  // Proof of Completion
  requiresProof: boolean;
  proofType?: string; // 'DOCUMENT_UPLOAD' | 'SIGNATURE' | 'CONFIRMATION'
  proofDocumentId?: string; // Link to uploaded proof

  // Timing
  dueDate?: Date;
  startedAt?: Date;
  completedAt?: Date;
  skippedAt?: Date;

  // Completion Details
  completedBy?: string; // User ID
  completionNotes?: string;
  skipReason?: string;

  // Alerts & Reminders
  isOverdue: boolean;
  reminderSentAt?: Date;

  // Metadata
  tags: string[]; // For filtering/search
  helpText?: string; // Tooltip for UI
}

export interface ExternalLink {
  title: string;
  url: string;
  type: 'FORM' | 'GUIDE' | 'VIDEO' | 'FAQ' | 'LEGAL_TEXT';
}

export class RoadmapTask extends Entity<RoadmapTaskProps> {
  private constructor(id: UniqueEntityID, props: RoadmapTaskProps, createdAt?: Date) {
    super(id, props, createdAt);
  }

  // ==================== GETTERS ====================

  get title(): string {
    return this.props.title;
  }

  get description(): string {
    return this.props.description;
  }

  get category(): TaskCategory {
    return this.props.category;
  }

  get priority(): TaskPriority {
    return this.props.priority;
  }

  get status(): TaskStatus {
    return this.props.status;
  }

  get orderIndex(): number {
    return this.props.orderIndex;
  }

  get dependsOnTaskIds(): string[] {
    return [...this.props.dependsOnTaskIds];
  }

  get blockingTaskIds(): string[] {
    return [...this.props.blockingTaskIds];
  }

  get legalBasis(): string | undefined {
    return this.props.legalBasis;
  }

  get instructions(): string[] {
    return [...this.props.instructions];
  }

  get estimatedDurationDays(): number {
    return this.props.estimatedDurationDays;
  }

  get externalLinks(): ExternalLink[] {
    return [...this.props.externalLinks];
  }

  get requiresProof(): boolean {
    return this.props.requiresProof;
  }

  get proofDocumentId(): string | undefined {
    return this.props.proofDocumentId;
  }

  get dueDate(): Date | undefined {
    return this.props.dueDate;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get isOverdue(): boolean {
    return this.props.isOverdue;
  }

  get tags(): string[] {
    return [...this.props.tags];
  }

  // ==================== DERIVED PROPERTIES ====================

  /**
   * Is this task locked (dependencies not met)?
   */
  public isLocked(): boolean {
    return this.props.status === TaskStatus.LOCKED;
  }

  /**
   * Is this task available to start?
   */
  public isPending(): boolean {
    return this.props.status === TaskStatus.PENDING;
  }

  /**
   * Is this task in progress?
   */
  public isInProgress(): boolean {
    return this.props.status === TaskStatus.IN_PROGRESS;
  }

  /**
   * Is this task completed?
   */
  public isCompleted(): boolean {
    return this.props.status === TaskStatus.COMPLETED;
  }

  /**
   * Is this task skipped?
   */
  public isSkipped(): boolean {
    return this.props.status === TaskStatus.SKIPPED;
  }

  /**
   * Can this task be started?
   */
  public canStart(): boolean {
    return this.props.status === TaskStatus.PENDING;
  }

  /**
   * Can this task be completed?
   */
  public canComplete(): boolean {
    if (!this.requiresProof) {
      return this.props.status === TaskStatus.IN_PROGRESS;
    }
    // If proof required, must have proof document
    return this.props.status === TaskStatus.IN_PROGRESS && !!this.props.proofDocumentId;
  }

  /**
   * Can this task be skipped?
   */
  public canSkip(): boolean {
    return (
      this.props.isConditional &&
      (this.props.status === TaskStatus.PENDING || this.props.status === TaskStatus.IN_PROGRESS)
    );
  }

  /**
   * Calculate days overdue (negative if not due yet)
   */
  public getDaysOverdue(): number {
    if (!this.props.dueDate) return 0;

    const now = new Date();
    const diffMs = now.getTime() - this.props.dueDate.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  /**
   * Calculate days remaining until due
   */
  public getDaysRemaining(): number | null {
    if (!this.props.dueDate) return null;

    const now = new Date();
    const diffMs = this.props.dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  /**
   * Get priority score (for sorting)
   */
  public getPriorityScore(): number {
    const priorityScores = {
      [TaskPriority.CRITICAL]: 100,
      [TaskPriority.HIGH]: 75,
      [TaskPriority.MEDIUM]: 50,
      [TaskPriority.LOW]: 25,
    };

    let score = priorityScores[this.props.priority];

    // Boost if overdue
    if (this.props.isOverdue) {
      score += 50;
    }

    // Boost if due soon
    const daysRemaining = this.getDaysRemaining();
    if (daysRemaining !== null && daysRemaining <= 3) {
      score += (3 - daysRemaining) * 10;
    }

    return score;
  }

  /**
   * Get status icon (for UI)
   */
  public getStatusIcon(): string {
    const icons = {
      [TaskStatus.LOCKED]: '🔒',
      [TaskStatus.PENDING]: '⏳',
      [TaskStatus.IN_PROGRESS]: '🔄',
      [TaskStatus.COMPLETED]: '✅',
      [TaskStatus.SKIPPED]: '⏭️',
    };
    return icons[this.props.status] || '❓';
  }

  // ==================== BUSINESS LOGIC ====================

  /**
   * Unlock task (dependencies met)
   * BUSINESS RULE: Can only unlock if currently LOCKED
   */
  public unlock(): void {
    this.ensureNotDeleted();

    if (this.props.status !== TaskStatus.LOCKED) {
      throw new Error(`Cannot unlock task with status ${this.props.status}`);
    }

    this.updateState({
      status: TaskStatus.PENDING,
    });
  }

  /**
   * Start task
   * BUSINESS RULE: Can only start if PENDING
   */
  public start(userId: string): void {
    this.ensureNotDeleted();

    if (this.props.status !== TaskStatus.PENDING) {
      throw new Error(`Cannot start task with status ${this.props.status}`);
    }

    this.updateState({
      status: TaskStatus.IN_PROGRESS,
      startedAt: new Date(),
    });
  }

  /**
   * Complete task
   * BUSINESS RULE: Can only complete if IN_PROGRESS and proof provided (if required)
   */
  public complete(userId: string, completionNotes?: string, proofDocumentId?: string): void {
    this.ensureNotDeleted();

    if (this.props.status !== TaskStatus.IN_PROGRESS) {
      throw new Error(`Cannot complete task with status ${this.props.status}`);
    }

    if (this.props.requiresProof && !proofDocumentId && !this.props.proofDocumentId) {
      throw new Error('Proof of completion is required for this task');
    }

    this.updateState({
      status: TaskStatus.COMPLETED,
      completedAt: new Date(),
      completedBy: userId,
      completionNotes,
      proofDocumentId: proofDocumentId || this.props.proofDocumentId,
      isOverdue: false, // Clear overdue flag
    });
  }

  /**
   * Skip task
   * BUSINESS RULE: Can only skip if conditional and not completed
   */
  public skip(reason: string): void {
    this.ensureNotDeleted();

    if (!this.props.isConditional) {
      throw new Error('Cannot skip non-conditional task');
    }

    if (this.props.status === TaskStatus.COMPLETED) {
      throw new Error('Cannot skip completed task');
    }

    this.updateState({
      status: TaskStatus.SKIPPED,
      skippedAt: new Date(),
      skipReason: reason,
    });
  }

  /**
   * Reopen task (if skipped or completed incorrectly)
   * BUSINESS RULE: Can only reopen if COMPLETED or SKIPPED
   */
  public reopen(): void {
    this.ensureNotDeleted();

    if (![TaskStatus.COMPLETED, TaskStatus.SKIPPED].includes(this.props.status)) {
      throw new Error(`Cannot reopen task with status ${this.props.status}`);
    }

    this.updateState({
      status: TaskStatus.PENDING,
      completedAt: undefined,
      completedBy: undefined,
      completionNotes: undefined,
      skippedAt: undefined,
      skipReason: undefined,
      proofDocumentId: undefined,
    });
  }

  /**
   * Update due date
   */
  public updateDueDate(dueDate: Date): void {
    this.ensureNotDeleted();

    this.updateState({
      dueDate,
      isOverdue: new Date() > dueDate && !this.isCompleted(),
    });
  }

  /**
   * Attach proof document
   */
  public attachProof(documentId: string): void {
    this.ensureNotDeleted();

    if (!this.props.requiresProof) {
      throw new Error('This task does not require proof');
    }

    this.updateState({
      proofDocumentId: documentId,
    });
  }

  /**
   * Mark as overdue (called by system cron)
   */
  public markAsOverdue(): void {
    this.ensureNotDeleted();

    if (this.props.status === TaskStatus.COMPLETED || this.props.status === TaskStatus.SKIPPED) {
      return; // Don't mark completed/skipped tasks as overdue
    }

    if (!this.props.dueDate) {
      return; // No due date
    }

    if (new Date() > this.props.dueDate) {
      this.updateState({
        isOverdue: true,
      });
    }
  }

  /**
   * Send reminder
   */
  public recordReminderSent(): void {
    this.ensureNotDeleted();

    this.updateState({
      reminderSentAt: new Date(),
    });
  }

  /**
   * Update priority
   */
  public updatePriority(newPriority: TaskPriority): void {
    this.ensureNotDeleted();

    this.updateState({
      priority: newPriority,
    });
  }

  // ==================== FACTORY METHODS ====================

  /**
   * Create a locked task (dependencies not yet met)
   */
  public static createLocked(
    title: string,
    description: string,
    category: TaskCategory,
    priority: TaskPriority,
    orderIndex: number,
    dependsOnTaskIds: string[],
    instructions: string[],
    estimatedDurationDays: number,
    options?: {
      legalBasis?: string;
      applicableRegimes?: string[];
      isConditional?: boolean;
      requiresProof?: boolean;
      proofType?: string;
      externalLinks?: ExternalLink[];
      tags?: string[];
    },
  ): RoadmapTask {
    const id = UniqueEntityID.newID();

    return new RoadmapTask(id, {
      title,
      description,
      category,
      priority,
      status: TaskStatus.LOCKED,
      orderIndex,
      dependsOnTaskIds,
      blockingTaskIds: [],
      legalBasis: options?.legalBasis,
      applicableRegimes: options?.applicableRegimes || [],
      isConditional: options?.isConditional || false,
      instructions,
      estimatedDurationDays,
      externalLinks: options?.externalLinks || [],
      requiresProof: options?.requiresProof || false,
      proofType: options?.proofType,
      isOverdue: false,
      tags: options?.tags || [],
    });
  }

  /**
   * Create a pending task (ready to start)
   */
  public static createPending(
    title: string,
    description: string,
    category: TaskCategory,
    priority: TaskPriority,
    orderIndex: number,
    instructions: string[],
    estimatedDurationDays: number,
    options?: {
      legalBasis?: string;
      dueDate?: Date;
      requiresProof?: boolean;
      proofType?: string;
      externalLinks?: ExternalLink[];
      tags?: string[];
    },
  ): RoadmapTask {
    const id = UniqueEntityID.newID();

    return new RoadmapTask(id, {
      title,
      description,
      category,
      priority,
      status: TaskStatus.PENDING,
      orderIndex,
      dependsOnTaskIds: [],
      blockingTaskIds: [],
      legalBasis: options?.legalBasis,
      applicableRegimes: [],
      isConditional: false,
      instructions,
      estimatedDurationDays,
      externalLinks: options?.externalLinks || [],
      requiresProof: options?.requiresProof || false,
      proofType: options?.proofType,
      dueDate: options?.dueDate,
      isOverdue: options?.dueDate ? new Date() > options.dueDate : false,
      tags: options?.tags || [],
    });
  }

  /**
   * Reconstitute from persistence
   */
  public static reconstitute(
    id: string,
    props: RoadmapTaskProps,
    createdAt: Date,
    updatedAt: Date,
  ): RoadmapTask {
    const entity = new RoadmapTask(new UniqueEntityID(id), props, createdAt);
    (entity as any)._updatedAt = updatedAt;
    return entity;
  }

  // ==================== SERIALIZATION ====================

  public toJSON(): Record<string, any> {
    return {
      id: this.id.toString(),
      title: this.props.title,
      description: this.props.description,
      category: this.props.category,
      priority: this.props.priority,
      status: this.props.status,
      orderIndex: this.props.orderIndex,
      dependsOnTaskIds: this.props.dependsOnTaskIds,
      blockingTaskIds: this.props.blockingTaskIds,
      legalBasis: this.props.legalBasis,
      applicableRegimes: this.props.applicableRegimes,
      isConditional: this.props.isConditional,
      conditionExpression: this.props.conditionExpression,
      instructions: this.props.instructions,
      estimatedDurationDays: this.props.estimatedDurationDays,
      externalLinks: this.props.externalLinks,
      requiresProof: this.props.requiresProof,
      proofType: this.props.proofType,
      proofDocumentId: this.props.proofDocumentId,
      dueDate: this.props.dueDate?.toISOString(),
      startedAt: this.props.startedAt?.toISOString(),
      completedAt: this.props.completedAt?.toISOString(),
      skippedAt: this.props.skippedAt?.toISOString(),
      completedBy: this.props.completedBy,
      completionNotes: this.props.completionNotes,
      skipReason: this.props.skipReason,
      isOverdue: this.props.isOverdue,
      reminderSentAt: this.props.reminderSentAt?.toISOString(),
      tags: this.props.tags,
      helpText: this.props.helpText,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      // Derived
      statusIcon: this.getStatusIcon(),
      canStart: this.canStart(),
      canComplete: this.canComplete(),
      canSkip: this.canSkip(),
      daysRemaining: this.getDaysRemaining(),
      daysOverdue: this.getDaysOverdue(),
      priorityScore: this.getPriorityScore(),
    };
  }
}
