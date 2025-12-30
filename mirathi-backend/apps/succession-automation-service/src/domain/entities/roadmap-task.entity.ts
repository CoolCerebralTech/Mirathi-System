// src/succession-automation/src/domain/entities/roadmap-task.entity.ts
import { Entity } from '../base/entity';
import { UniqueEntityID } from '../base/unique-entity-id';
import { DocumentGapType } from '../value-objects/document-gap.vo';
import { SuccessionContext } from '../value-objects/succession-context.vo';

/**
 * Roadmap Task Entity
 *
 * INNOVATION: Context-Aware Legal Task Generator
 *
 * This entity represents a specific legal action the executor must complete.
 * Tasks are dynamically generated based on:
 * - Succession Context (Testate/Intestate, Islamic/Statutory, Polygamous/Monogamous)
 * - Court Jurisdiction (High Court, Magistrate, Kadhi's Court)
 * - Estate Complexity (Simple, Complex, Business Assets)
 * - Risk Profile (Blocking risks from ReadinessAssessment)
 *
 * SMART TASK FEATURES:
 * 1. **Automatic Unlocking**: Tasks unlock when dependencies are met
 * 2. **Conditional Tasks**: Only appear if specific conditions are met
 * 3. **Court-Specific Instructions**: Different for High Court vs Kadhi's Court
 * 4. **Legal Basis Tracking**: Every task tied to specific Kenyan law
 * 5. **Proof Requirements**: Some tasks require document uploads
 * 6. **Time Tracking**: Due dates, reminders, overdue detection
 *
 * LEGAL COMPLIANCE:
 * Each task corresponds to a legal requirement in Kenyan succession law:
 * - S.56 LSA: Filing requirements
 * - S.40 LSA: Polygamous house definition
 * - S.71 Children Act: Guardian appointment
 * - S.83 LSA: Executor duties
 * - Court Practice Directions: Filing procedures
 */

export enum TaskStatus {
  LOCKED = 'LOCKED', // Dependencies not met
  PENDING = 'PENDING', // Available to start
  IN_PROGRESS = 'IN_PROGRESS', // User actively working
  COMPLETED = 'COMPLETED', // Successfully done
  SKIPPED = 'SKIPPED', // Not applicable to this case
  WAIVED = 'WAIVED', // Court waived this requirement
  BLOCKED = 'BLOCKED', // Blocked by external factor
  FAILED = 'FAILED', // Attempted but failed (e.g., court rejection)
}

export enum TaskCategory {
  // Phase 1: Pre-Filing (Gathering)
  IDENTITY_VERIFICATION = 'IDENTITY_VERIFICATION', // Death cert, IDs
  FAMILY_STRUCTURE = 'FAMILY_STRUCTURE', // Family tree, marriages
  GUARDIANSHIP = 'GUARDIANSHIP', // Minor guardianship
  ASSET_DISCOVERY = 'ASSET_DISCOVERY', // Find all assets
  DEBT_SETTLEMENT = 'DEBT_SETTLEMENT', // Validate and settle debts

  // Phase 2: Document Collection
  DOCUMENT_COLLECTION = 'DOCUMENT_COLLECTION', // Gather required docs
  DOCUMENT_VALIDATION = 'DOCUMENT_VALIDATION', // Verify document validity
  CUSTOMARY_DOCUMENTS = 'CUSTOMARY_DOCUMENTS', // Chief's letter, elders' affidavit

  // Phase 3: Form Preparation
  FORM_GENERATION = 'FORM_GENERATION', // Generate P&A forms
  FORM_REVIEW = 'FORM_REVIEW', // Review forms for accuracy
  SIGNATURE_COLLECTION = 'SIGNATURE_COLLECTION', // Get consents/signatures

  // Phase 4: Court Filing
  COURT_SELECTION = 'COURT_SELECTION', // Choose correct court
  FEE_PAYMENT = 'FEE_PAYMENT', // Pay court fees
  LODGEMENT = 'LODGEMENT', // File papers at court
  GAZETTE_PUBLICATION = 'GAZETTE_PUBLICATION', // 30-day gazette notice

  // Phase 5: Court Proceedings
  COURT_ATTENDANCE = 'COURT_ATTENDANCE', // Attend hearings
  GRANT_ISSUANCE = 'GRANT_ISSUANCE', // Obtain grant of representation
  GRANT_CONFIRMATION = 'GRANT_CONFIRMATION', // P&A 5 confirmation

  // Phase 6: Asset Distribution
  ASSET_TRANSFER = 'ASSET_TRANSFER', // Transfer assets to beneficiaries
  DEBT_PAYMENT = 'DEBT_PAYMENT', // Pay remaining debts
  TAX_CLEARANCE = 'TAX_CLEARANCE', // Obtain tax clearance certificates

  // Phase 7: Finalization
  FINAL_ACCOUNTS = 'FINAL_ACCOUNTS', // File final accounts
  ESTATE_CLOSURE = 'ESTATE_CLOSURE', // Close estate officially
  BENEFICIARY_NOTIFICATION = 'BENEFICIARY_NOTIFICATION', // Notify beneficiaries

  // Special Categories
  WILL_SPECIFIC = 'WILL_SPECIFIC', // Tasks only for testate cases
  ISLAMIC_SPECIFIC = 'ISLAMIC_SPECIFIC', // Tasks for Kadhi's Court
  POLYGAMOUS_SPECIFIC = 'POLYGAMOUS_SPECIFIC', // Section 40 tasks
  MINOR_SPECIFIC = 'MINOR_SPECIFIC', // Tasks when minors involved
  DISPUTE_RESOLUTION = 'DISPUTE_RESOLUTION', // Tasks for disputed cases
}

export enum TaskPriority {
  CRITICAL = 'CRITICAL', // Blocking, must complete now
  HIGH = 'HIGH', // Should complete within 3 days
  MEDIUM = 'MEDIUM', // Should complete within 7 days
  LOW = 'LOW', // Can complete within 30 days
}

export enum ProofType {
  DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD', // Upload scanned document
  DIGITAL_SIGNATURE = 'DIGITAL_SIGNATURE', // E-signature
  SMS_VERIFICATION = 'SMS_VERIFICATION', // SMS confirmation
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION', // Email confirmation
  COURT_RECEIPT = 'COURT_RECEIPT', // Court filing receipt
  BANK_SLIP = 'BANK_SLIP', // Payment proof
  WITNESS_SIGNATURE = 'WITNESS_SIGNATURE', // Witness signature
  AFFIDAVIT = 'AFFIDAVIT', // Sworn affidavit
}

export enum TaskTrigger {
  MANUAL = 'MANUAL', // User manually starts
  AUTOMATIC = 'AUTOMATIC', // System auto-starts when conditions met
  EVENT_DRIVEN = 'EVENT_DRIVEN', // Started by domain event
  SCHEDULED = 'SCHEDULED', // Starts on specific date
  READINESS_BASED = 'READINESS_BASED', // Starts when readiness score threshold met
}

export interface ExternalLink {
  title: string;
  url: string;
  type: 'FORM' | 'GUIDE' | 'VIDEO' | 'FAQ' | 'LEGAL_TEXT' | 'COURT_PORTAL' | 'GOVERNMENT_PORTAL';
  description?: string;
}

export interface LegalReference {
  act: string; // e.g., "LSA", "Children Act"
  section: string; // e.g., "56", "40", "71"
  subsection?: string; // e.g., "(1)", "(3)(a)"
  description: string;
  isMandatory: boolean;
}

export interface TaskCondition {
  field: string; // e.g., "context.regime"
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
  logicalOperator?: 'AND' | 'OR'; // For compound conditions
}

interface RoadmapTaskProps {
  // Core Identity
  title: string;
  description: string;
  shortCode: string; // e.g., "TASK-001", "DEATH-CERT-COLLECT"
  category: TaskCategory;
  priority: TaskPriority;

  // Status Management
  status: TaskStatus;

  // Dependencies & Ordering
  phase: number; // 1-4 (Pre-Filing, Filing, Confirmation, Distribution)
  orderIndex: number; // Order within phase
  dependsOnTaskIds: string[]; // Task IDs that must be completed first
  blocksTaskIds: string[]; // Task IDs blocked by this task

  // Context Awareness
  applicableContexts: string[]; // JSON strings of SuccessionContext conditions
  legalReferences: LegalReference[];
  triggers: TaskTrigger[];
  autoStartConditions?: TaskCondition[]; // When to auto-start
  skipConditions?: TaskCondition[]; // When to skip

  // Guidance & Instructions
  detailedInstructions: string[];
  quickTips: string[];
  commonMistakes: string[];
  externalLinks: ExternalLink[];
  estimatedTimeMinutes: number; // How long to complete the task
  courtSpecificInstructions?: Record<string, string>; // Different per court

  // Proof & Verification
  requiresProof: boolean;
  proofTypes: ProofType[];
  proofDescription?: string; // What kind of proof is needed
  proofDocumentType?: DocumentGapType; // If document upload

  // Timing & Scheduling
  dueDate?: Date;
  startDate?: Date; // When task becomes available
  endDate?: Date; // When task expires (if applicable)
  startedAt?: Date;
  completedAt?: Date;
  skippedAt?: Date;
  lastRemindedAt?: Date;

  // Completion Details
  completedBy?: string; // User ID
  completionNotes?: string;
  skipReason?: string;
  waiverReason?: string;
  failureReason?: string;

  // Alerts & Monitoring
  isOverdue: boolean;
  reminderIntervalDays: number;
  escalationLevel: number; // 0-3 (0=no escalation, 3=urgent)
  autoEscalateAfterDays: number;

  // Performance Tracking
  timeSpentMinutes: number;
  retryCount: number;
  lastAttemptedAt?: Date;

  // Metadata
  tags: string[];
  templateVersion: string; // Task template version
  createdBy: string; // 'system' or user ID
  lastModifiedBy: string;
  lastModifiedAt: Date;

  // Integration
  relatedRiskFlagIds: string[]; // Risks this task resolves
  relatedDocumentGapIds: string[]; // Document gaps this task addresses
  externalServiceId?: string; // If integrates with external service
  externalTaskId?: string; // External system task ID

  // Audit
  history: TaskHistoryEntry[];
}

export interface TaskHistoryEntry {
  timestamp: Date;
  action:
    | 'CREATED'
    | 'STARTED'
    | 'COMPLETED'
    | 'SKIPPED'
    | 'WAIVED'
    | 'FAILED'
    | 'REOPENED'
    | 'STATUS_CHANGED'
    | 'PRIORITY_CHANGED'
    | 'PROOF_ADDED';
  performedBy: string;
  details?: string;
  oldValue?: any;
  newValue?: any;
}

export class RoadmapTask extends Entity<RoadmapTaskProps> {
  private static readonly ESCALATION_THRESHOLDS = [3, 7, 14]; // Days for escalation levels

  // Task code prefixes
  private static readonly TASK_CODES = {
    [TaskCategory.IDENTITY_VERIFICATION]: 'IDV',
    [TaskCategory.DOCUMENT_COLLECTION]: 'DOC',
    [TaskCategory.FORM_GENERATION]: 'FRM',
    [TaskCategory.LODGEMENT]: 'FIL',
    [TaskCategory.ASSET_TRANSFER]: 'AST',
  };

  constructor(id: UniqueEntityID, props: RoadmapTaskProps, createdAt?: Date) {
    super(id, props, createdAt);
    this.ensureConsistency();
  }

  // ==================== GETTERS ====================

  get title(): string {
    return this.props.title;
  }

  get description(): string {
    return this.props.description;
  }

  get shortCode(): string {
    return this.props.shortCode;
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

  get phase(): number {
    return this.props.phase;
  }

  get orderIndex(): number {
    return this.props.orderIndex;
  }

  get dependsOnTaskIds(): string[] {
    return [...this.props.dependsOnTaskIds];
  }

  get blocksTaskIds(): string[] {
    return [...this.props.blocksTaskIds];
  }

  get applicableContexts(): string[] {
    return [...this.props.applicableContexts];
  }

  get legalReferences(): LegalReference[] {
    return [...this.props.legalReferences];
  }

  get triggers(): TaskTrigger[] {
    return [...this.props.triggers];
  }

  get detailedInstructions(): string[] {
    return [...this.props.detailedInstructions];
  }

  get quickTips(): string[] {
    return [...this.props.quickTips];
  }

  get commonMistakes(): string[] {
    return [...this.props.commonMistakes];
  }

  get externalLinks(): ExternalLink[] {
    return [...this.props.externalLinks];
  }

  get estimatedTimeMinutes(): number {
    return this.props.estimatedTimeMinutes;
  }

  get requiresProof(): boolean {
    return this.props.requiresProof;
  }

  get proofTypes(): ProofType[] {
    return [...this.props.proofTypes];
  }

  get proofDocumentType(): DocumentGapType | undefined {
    return this.props.proofDocumentType;
  }

  get dueDate(): Date | undefined {
    return this.props.dueDate;
  }

  get startedAt(): Date | undefined {
    return this.props.startedAt;
  }

  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }

  get isOverdue(): boolean {
    return this.props.isOverdue;
  }

  get timeSpentMinutes(): number {
    return this.props.timeSpentMinutes;
  }

  get tags(): string[] {
    return [...this.props.tags];
  }

  get templateVersion(): string {
    return this.props.templateVersion;
  }

  get relatedRiskFlagIds(): string[] {
    return [...this.props.relatedRiskFlagIds];
  }

  get relatedDocumentGapIds(): string[] {
    return [...this.props.relatedDocumentGapIds];
  }

  get history(): TaskHistoryEntry[] {
    return [...this.props.history];
  }

  // ==================== DERIVED PROPERTIES ====================
  public addDependency(taskId: string): void {
    if (!this.props.dependsOnTaskIds.includes(taskId)) {
      this.updateState({
        dependsOnTaskIds: [...this.props.dependsOnTaskIds, taskId],
      });
    }
  }
  /**
   * Get primary legal basis for display
   */
  public getPrimaryLegalBasis(): string {
    if (this.props.legalReferences.length === 0) {
      return 'Standard court procedure';
    }

    const primary = this.props.legalReferences[0];
    return `${primary.act} S.${primary.section}${primary.subsection || ''}`;
  }

  /**
   * Get all legal bases as formatted string
   */
  public getAllLegalBases(): string {
    return this.props.legalReferences
      .map((ref) => `${ref.act} S.${ref.section}${ref.subsection || ''}: ${ref.description}`)
      .join('; ');
  }

  /**
   * Check if task is applicable for given succession context
   */
  public isApplicableForContext(context: SuccessionContext): boolean {
    if (this.props.applicableContexts.length === 0) {
      return true; // No restrictions
    }

    // Simple context matching (for now)
    // In production, this would parse and evaluate conditions
    const contextJson = JSON.stringify(context.toJSON());

    return this.props.applicableContexts.some((applicableContext) =>
      contextJson.includes(applicableContext),
    );
  }

  /**
   * Check if all dependencies are met
   */
  public areDependenciesMet(completedTaskIds: string[]): boolean {
    return this.props.dependsOnTaskIds.every((taskId) => completedTaskIds.includes(taskId));
  }

  /**
   * Calculate days overdue
   */
  public getDaysOverdue(now: Date = new Date()): number {
    if (!this.props.dueDate || this.props.status === TaskStatus.COMPLETED) {
      return 0;
    }

    const overdueMs = now.getTime() - this.props.dueDate.getTime();
    const overdueDays = Math.floor(overdueMs / (1000 * 60 * 60 * 24));

    return Math.max(0, overdueDays);
  }

  /**
   * Calculate days remaining
   */
  public getDaysRemaining(now: Date = new Date()): number | null {
    if (!this.props.dueDate) {
      return null;
    }

    const remainingMs = this.props.dueDate.getTime() - now.getTime();
    const remainingDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));

    return Math.max(0, remainingDays);
  }

  /**
   * Get escalation level based on overdue days
   */
  public getEscalationLevel(): number {
    if (!this.props.isOverdue) {
      return 0;
    }

    const overdueDays = this.getDaysOverdue();

    if (overdueDays >= RoadmapTask.ESCALATION_THRESHOLDS[2]) return 3;
    if (overdueDays >= RoadmapTask.ESCALATION_THRESHOLDS[1]) return 2;
    if (overdueDays >= RoadmapTask.ESCALATION_THRESHOLDS[0]) return 1;

    return 0;
  }

  /**
   * Check if reminder should be sent
   */
  public shouldSendReminder(now: Date = new Date()): boolean {
    if (
      this.props.status === TaskStatus.COMPLETED ||
      this.props.status === TaskStatus.SKIPPED ||
      this.props.status === TaskStatus.WAIVED
    ) {
      return false;
    }

    if (!this.props.lastRemindedAt) {
      return true; // Never reminded
    }

    const daysSinceLastReminder =
      (now.getTime() - this.props.lastRemindedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceLastReminder >= this.props.reminderIntervalDays;
  }

  /**
   * Get task urgency score (for sorting)
   */
  public getUrgencyScore(): number {
    let score = 0;

    // Priority score
    const priorityScores = {
      [TaskPriority.CRITICAL]: 100,
      [TaskPriority.HIGH]: 75,
      [TaskPriority.MEDIUM]: 50,
      [TaskPriority.LOW]: 25,
    };

    score += priorityScores[this.props.priority];

    // Overdue penalty
    if (this.props.isOverdue) {
      score += 50;
      score += this.getDaysOverdue() * 5;
    }

    // Due soon boost
    const daysRemaining = this.getDaysRemaining();
    if (daysRemaining !== null && daysRemaining <= 3) {
      score += (3 - daysRemaining) * 10;
    }

    // In progress tasks get slight boost
    if (this.props.status === TaskStatus.IN_PROGRESS) {
      score += 10;
    }

    return score;
  }

  /**
   * Get status icon for UI
   */
  public getStatusIcon(): string {
    const icons = {
      [TaskStatus.LOCKED]: '🔒',
      [TaskStatus.PENDING]: '⏳',
      [TaskStatus.IN_PROGRESS]: '🔄',
      [TaskStatus.COMPLETED]: '✅',
      [TaskStatus.SKIPPED]: '⏭️',
      [TaskStatus.WAIVED]: '📄✅',
      [TaskStatus.BLOCKED]: '🚫',
      [TaskStatus.FAILED]: '❌',
    };
    return icons[this.props.status] || '❓';
  }

  /**
   * Get phase name
   */
  public getPhaseName(): string {
    const phases = {
      1: 'Pre-Filing',
      2: 'Filing',
      3: 'Confirmation',
      4: 'Distribution',
      5: 'Finalization',
    };
    return phases[this.props.phase] || `Phase ${this.props.phase}`;
  }

  // ==================== BUSINESS LOGIC ====================

  /**
   * Start the task
   */
  public start(userId: string): void {
    this.ensureNotDeleted();

    if (this.props.status !== TaskStatus.PENDING) {
      throw new Error(`Cannot start task with status ${this.props.status}`);
    }

    this.updateState({
      status: TaskStatus.IN_PROGRESS,
      startedAt: new Date(),
      lastModifiedBy: userId,
      lastModifiedAt: new Date(),
    });

    this.addHistoryEntry({
      timestamp: new Date(),
      action: 'STARTED',
      performedBy: userId,
    });
  }

  /**
   * Complete the task
   */
  public complete(userId: string, notes?: string, proofData?: any): void {
    this.ensureNotDeleted();

    if (this.props.status !== TaskStatus.IN_PROGRESS) {
      throw new Error(`Cannot complete task with status ${this.props.status}`);
    }

    if (this.props.requiresProof && !proofData) {
      throw new Error('Proof is required to complete this task');
    }

    const now = new Date();
    const timeSpent = this.props.startedAt
      ? Math.round((now.getTime() - this.props.startedAt.getTime()) / (1000 * 60))
      : 0;

    this.updateState({
      status: TaskStatus.COMPLETED,
      completedAt: now,
      completedBy: userId,
      completionNotes: notes,
      isOverdue: false,
      timeSpentMinutes: this.props.timeSpentMinutes + timeSpent,
      lastModifiedBy: userId,
      lastModifiedAt: now,
    });

    this.addHistoryEntry({
      timestamp: now,
      action: 'COMPLETED',
      performedBy: userId,
      details: notes,
      newValue: proofData,
    });
  }

  /**
   * Skip the task
   */
  public skip(userId: string, reason: string): void {
    this.ensureNotDeleted();

    if (![TaskStatus.PENDING, TaskStatus.IN_PROGRESS].includes(this.props.status)) {
      throw new Error(`Cannot skip task with status ${this.props.status}`);
    }

    this.updateState({
      status: TaskStatus.SKIPPED,
      skippedAt: new Date(),
      skipReason: reason,
      lastModifiedBy: userId,
      lastModifiedAt: new Date(),
    });

    this.addHistoryEntry({
      timestamp: new Date(),
      action: 'SKIPPED',
      performedBy: userId,
      details: reason,
    });
  }

  /**
   * Waive the task (court waived requirement)
   */
  public waive(userId: string, reason: string): void {
    this.ensureNotDeleted();

    this.updateState({
      status: TaskStatus.WAIVED,
      waiverReason: reason,
      lastModifiedBy: userId,
      lastModifiedAt: new Date(),
    });

    this.addHistoryEntry({
      timestamp: new Date(),
      action: 'WAIVED',
      performedBy: userId,
      details: reason,
    });
  }

  /**
   * Mark as failed (e.g., court rejected document)
   */
  public markAsFailed(userId: string, reason: string): void {
    this.ensureNotDeleted();

    this.updateState({
      status: TaskStatus.FAILED,
      failureReason: reason,
      retryCount: this.props.retryCount + 1,
      lastAttemptedAt: new Date(),
      lastModifiedBy: userId,
      lastModifiedAt: new Date(),
    });

    this.addHistoryEntry({
      timestamp: new Date(),
      action: 'FAILED',
      performedBy: userId,
      details: reason,
    });
  }

  /**
   * Reopen task
   */
  public reopen(userId: string, reason: string): void {
    this.ensureNotDeleted();

    if (
      ![TaskStatus.COMPLETED, TaskStatus.SKIPPED, TaskStatus.WAIVED, TaskStatus.FAILED].includes(
        this.props.status,
      )
    ) {
      throw new Error(`Cannot reopen task with status ${this.props.status}`);
    }

    this.updateState({
      status: TaskStatus.PENDING,
      completedAt: undefined,
      completedBy: undefined,
      completionNotes: undefined,
      skippedAt: undefined,
      skipReason: undefined,
      waiverReason: undefined,
      failureReason: undefined,
      lastModifiedBy: userId,
      lastModifiedAt: new Date(),
    });

    this.addHistoryEntry({
      timestamp: new Date(),
      action: 'REOPENED',
      performedBy: userId,
      details: reason,
    });
  }

  /**
   * Unlock task (dependencies met)
   */
  public unlock(userId: string = 'system'): void {
    this.ensureNotDeleted();

    if (this.props.status !== TaskStatus.LOCKED) {
      return; // Already unlocked
    }

    this.updateState({
      status: TaskStatus.PENDING,
      lastModifiedBy: userId,
      lastModifiedAt: new Date(),
    });

    this.addHistoryEntry({
      timestamp: new Date(),
      action: 'STATUS_CHANGED',
      performedBy: userId,
      oldValue: TaskStatus.LOCKED,
      newValue: TaskStatus.PENDING,
      details: 'Dependencies met',
    });
  }

  /**
   * Block task (external blocking factor)
   */
  public block(userId: string, reason: string): void {
    this.ensureNotDeleted();

    this.updateState({
      status: TaskStatus.BLOCKED,
      lastModifiedBy: userId,
      lastModifiedAt: new Date(),
    });

    this.addHistoryEntry({
      timestamp: new Date(),
      action: 'STATUS_CHANGED',
      performedBy: userId,
      oldValue: this.props.status,
      newValue: TaskStatus.BLOCKED,
      details: reason,
    });
  }

  /**
   * Update priority
   */
  public updatePriority(newPriority: TaskPriority, userId: string): void {
    this.ensureNotDeleted();

    if (this.props.priority === newPriority) {
      return;
    }

    this.updateState({
      priority: newPriority,
      lastModifiedBy: userId,
      lastModifiedAt: new Date(),
    });

    this.addHistoryEntry({
      timestamp: new Date(),
      action: 'PRIORITY_CHANGED',
      performedBy: userId,
      oldValue: this.props.priority,
      newValue: newPriority,
    });
  }

  /**
   * Update due date
   */
  public updateDueDate(newDueDate: Date, userId: string): void {
    this.ensureNotDeleted();

    this.updateState({
      dueDate: newDueDate,
      isOverdue: new Date() > newDueDate && this.props.status !== TaskStatus.COMPLETED,
      lastModifiedBy: userId,
      lastModifiedAt: new Date(),
    });
  }

  /**
   * Add proof
   */
  public addProof(proofType: ProofType, proofData: any, userId: string): void {
    this.ensureNotDeleted();

    if (!this.props.requiresProof) {
      throw new Error('This task does not require proof');
    }

    this.addHistoryEntry({
      timestamp: new Date(),
      action: 'PROOF_ADDED',
      performedBy: userId,
      details: `Added proof type: ${proofType}`,
      newValue: proofData,
    });
  }

  /**
   * Record reminder sent
   */
  public recordReminderSent(userId: string = 'system'): void {
    this.ensureNotDeleted();

    this.updateState({
      lastRemindedAt: new Date(),
      lastModifiedBy: userId,
      lastModifiedAt: new Date(),
    });
  }

  /**
   * Mark as overdue (system cron job)
   */
  public markAsOverdue(): void {
    this.ensureNotDeleted();

    if (
      this.props.status === TaskStatus.COMPLETED ||
      this.props.status === TaskStatus.SKIPPED ||
      this.props.status === TaskStatus.WAIVED
    ) {
      return;
    }

    if (this.props.dueDate && new Date() > this.props.dueDate) {
      this.updateState({
        isOverdue: true,
      });
    }
  }

  /**
   * Add time spent
   */
  public addTimeSpent(minutes: number): void {
    this.ensureNotDeleted();

    this.updateState({
      timeSpentMinutes: this.props.timeSpentMinutes + minutes,
      lastModifiedAt: new Date(),
    });
  }

  /**
   * Add related risk flag
   */
  public addRelatedRiskFlag(riskFlagId: string): void {
    this.ensureNotDeleted();

    if (!this.props.relatedRiskFlagIds.includes(riskFlagId)) {
      const updatedIds = [...this.props.relatedRiskFlagIds, riskFlagId];
      this.updateState({
        relatedRiskFlagIds: updatedIds,
        lastModifiedAt: new Date(),
      });
    }
  }

  /**
   * Add related document gap
   */
  public addRelatedDocumentGap(documentGapId: string): void {
    this.ensureNotDeleted();

    if (!this.props.relatedDocumentGapIds.includes(documentGapId)) {
      const updatedIds = [...this.props.relatedDocumentGapIds, documentGapId];
      this.updateState({
        relatedDocumentGapIds: updatedIds,
        lastModifiedAt: new Date(),
      });
    }
  }

  // ==================== HELPER METHODS ====================

  private ensureConsistency(): void {
    // Ensure due date is in the future for pending/in-progress tasks
    if (
      this.props.dueDate &&
      [TaskStatus.PENDING, TaskStatus.IN_PROGRESS].includes(this.props.status) &&
      new Date() > this.props.dueDate
    ) {
      this.updateState({
        isOverdue: true,
      });
    }
  }

  private addHistoryEntry(entry: TaskHistoryEntry): void {
    const updatedHistory = [...this.props.history, entry];
    this.updateState({
      history: updatedHistory,
    });
  }

  // ==================== FACTORY METHODS ====================

  /**
   * Create Death Certificate Collection Task
   */
  public static createDeathCertificateTask(
    estateId: string,
    phase: number,
    orderIndex: number,
    createdBy: string = 'system',
  ): RoadmapTask {
    const id = UniqueEntityID.newID();
    const taskCode = `${RoadmapTask.TASK_CODES[TaskCategory.DOCUMENT_COLLECTION]}-001`;

    return new RoadmapTask(id, {
      title: 'Obtain Death Certificate',
      description: 'Obtain official Death Certificate from Civil Registration Office',
      shortCode: taskCode,
      category: TaskCategory.DOCUMENT_COLLECTION,
      priority: TaskPriority.CRITICAL,
      status: TaskStatus.PENDING,
      phase,
      orderIndex,
      dependsOnTaskIds: [],
      blocksTaskIds: [],
      applicableContexts: ['ALL'], // Everyone needs death certificate
      legalReferences: [
        {
          act: 'LSA',
          section: '56',
          description: 'Death Certificate mandatory for all succession cases',
          isMandatory: true,
        },
      ],
      triggers: [TaskTrigger.MANUAL, TaskTrigger.READINESS_BASED],
      detailedInstructions: [
        'Visit the Civil Registration Office where death was registered',
        'Bring: Your National ID, deceased National ID (if available), KES 50 fee',
        'Fill out Form CR12 (Application for Death Certificate)',
        'Processing takes 1-3 business days',
        'Collect certified copy (minimum 3 copies recommended)',
      ],
      quickTips: [
        'If death occurred overseas, obtain certified copy and apostille',
        'Keep multiple copies for different institutions (banks, lands registry)',
      ],
      commonMistakes: [
        'Not getting enough copies (need min. 3 for banks, lands, court)',
        'Forgetting to certify copies for court filing',
      ],
      externalLinks: [
        {
          title: 'Civil Registration Offices Directory',
          url: 'https://civilregistration.go.ke/offices',
          type: 'GOVERNMENT_PORTAL',
          description: 'Find your nearest Civil Registration Office',
        },
      ],
      estimatedTimeMinutes: 240, // 4 hours including travel
      requiresProof: true,
      proofTypes: [ProofType.DOCUMENT_UPLOAD],
      proofDocumentType: DocumentGapType.DEATH_CERTIFICATE,
      isOverdue: false,
      reminderIntervalDays: 3,
      escalationLevel: 0,
      autoEscalateAfterDays: 7,
      timeSpentMinutes: 0,
      retryCount: 0,
      tags: ['mandatory', 'document', 'pre-filing'],
      templateVersion: '2024.1',
      createdBy,
      lastModifiedBy: createdBy,
      lastModifiedAt: new Date(),
      relatedRiskFlagIds: [],
      relatedDocumentGapIds: [],
      history: [
        {
          timestamp: new Date(),
          action: 'CREATED',
          performedBy: createdBy,
        },
      ],
    });
  }

  /**
   * Create Chief's Letter Task (Intestate only)
   */
  public static createChiefLetterTask(
    estateId: string,
    phase: number,
    orderIndex: number,
    createdBy: string = 'system',
  ): RoadmapTask {
    const id = UniqueEntityID.newID();
    const taskCode = `${RoadmapTask.TASK_CODES[TaskCategory.CUSTOMARY_DOCUMENTS]}-001`;

    return new RoadmapTask(id, {
      title: 'Obtain Letter from Area Chief',
      description: 'Get letter from local chief confirming next of kin for intestate cases',
      shortCode: taskCode,
      category: TaskCategory.CUSTOMARY_DOCUMENTS,
      priority: TaskPriority.CRITICAL,
      status: TaskStatus.PENDING,
      phase,
      orderIndex,
      dependsOnTaskIds: [],
      blocksTaskIds: [],
      applicableContexts: ['"regime":"INTESTATE"'], // Only for intestate cases
      legalReferences: [
        {
          act: 'Customary Law',
          section: 'N/A',
          description:
            "Chief's letter required for intestate succession to confirm family structure",
          isMandatory: true,
        },
      ],
      triggers: [TaskTrigger.MANUAL],
      detailedInstructions: [
        "Visit the Chief's office in the deceased's home area",
        'Bring: Death Certificate, National IDs of family members',
        'Chief will verify family tree with local elders',
        'Letter should list all surviving family members',
        'Processing takes 7-14 days (depends on chief availability)',
      ],
      quickTips: [
        'If chief is unavailable, Assistant Chief or DO can issue the letter',
        'Bring elders who knew the family to speed up verification',
      ],
      commonMistakes: [
        'Not including all family members in the letter',
        'Getting letter from wrong jurisdiction',
      ],
      externalLinks: [],
      estimatedTimeMinutes: 480, // 8 hours including travel to rural areas
      requiresProof: true,
      proofTypes: [ProofType.DOCUMENT_UPLOAD],
      proofDocumentType: DocumentGapType.CHIEF_LETTER,
      isOverdue: false,
      reminderIntervalDays: 7,
      escalationLevel: 0,
      autoEscalateAfterDays: 14,
      timeSpentMinutes: 0,
      retryCount: 0,
      tags: ['intestate', 'customary', 'document', 'pre-filing'],
      templateVersion: '2024.1',
      createdBy,
      lastModifiedBy: createdBy,
      lastModifiedAt: new Date(),
      relatedRiskFlagIds: [],
      relatedDocumentGapIds: [],
      history: [
        {
          timestamp: new Date(),
          action: 'CREATED',
          performedBy: createdBy,
        },
      ],
    });
  }

  /**
   * Create Guardian Appointment Task (When minors involved)
   */
  public static createGuardianAppointmentTask(
    estateId: string,
    minorIds: string[],
    phase: number,
    orderIndex: number,
    createdBy: string = 'system',
  ): RoadmapTask {
    const id = UniqueEntityID.newID();
    const taskCode = `${RoadmapTask.TASK_CODES[TaskCategory.GUARDIANSHIP]}-001`;

    return new RoadmapTask(id, {
      title: 'Appoint Legal Guardian for Minor(s)',
      description: `Appoint legal guardian for ${minorIds.length} minor beneficiary(es)`,
      shortCode: taskCode,
      category: TaskCategory.GUARDIANSHIP,
      priority: TaskPriority.HIGH,
      status: TaskStatus.PENDING,
      phase,
      orderIndex,
      dependsOnTaskIds: [],
      blocksTaskIds: [],
      applicableContexts: ['"isMinorInvolved":true'], // Only when minors involved
      legalReferences: [
        {
          act: 'Children Act',
          section: '71',
          description: 'Every minor must have a legal guardian for estate matters',
          isMandatory: true,
        },
      ],
      triggers: [TaskTrigger.MANUAL, TaskTrigger.EVENT_DRIVEN],
      detailedInstructions: [
        'Identify suitable guardian (must be adult 18+, of sound mind)',
        'Guardian must consent in writing (Form P&A 38)',
        "If family disputes, apply to Children's Court for appointment",
        "Guardian will manage minor's share until they turn 18",
        "Guardian must file annual returns on minor's welfare",
      ],
      quickTips: [
        'Prefer close relatives (parent, grandparent, aunt/uncle)',
        'Consider creating trust for large inheritances to minors',
      ],
      commonMistakes: [
        'Appointing guardian without their knowledge/consent',
        'Not considering potential conflicts of interest',
      ],
      externalLinks: [
        {
          title: 'Children Act Guardianship Guidelines',
          url: 'https://judiciary.go.ke/children-act-guardianship',
          type: 'LEGAL_TEXT',
          description: 'Official guidelines for appointing guardians',
        },
      ],
      estimatedTimeMinutes: 120,
      requiresProof: true,
      proofTypes: [ProofType.DOCUMENT_UPLOAD, ProofType.DIGITAL_SIGNATURE],
      isOverdue: false,
      reminderIntervalDays: 5,
      escalationLevel: 0,
      autoEscalateAfterDays: 10,
      timeSpentMinutes: 0,
      retryCount: 0,
      tags: ['minor', 'guardianship', 'legal', 'pre-filing'],
      templateVersion: '2024.1',
      createdBy,
      lastModifiedBy: createdBy,
      lastModifiedAt: new Date(),
      relatedRiskFlagIds: [],
      relatedDocumentGapIds: [],
      history: [
        {
          timestamp: new Date(),
          action: 'CREATED',
          performedBy: createdBy,
        },
      ],
    });
  }

  /**
   * Create Court Filing Task
   */
  public static createCourtFilingTask(
    courtJurisdiction: string,
    phase: number,
    orderIndex: number,
    dependsOnTaskIds: string[],
    createdBy: string = 'system',
  ): RoadmapTask {
    const id = UniqueEntityID.newID();
    const taskCode = `${RoadmapTask.TASK_CODES[TaskCategory.LODGEMENT]}-001`;

    const courtSpecificInstructions: Record<string, string> = {
      HIGH_COURT: 'File at High Court Probate Registry, Room 12. Bring 3 copies of all documents.',
      MAGISTRATE_COURT: "File at Resident Magistrate's Court registry. Bring 2 copies.",
      KADHIS_COURT: "File at Kadhi's Court. Documents must be in Arabic or Kiswahili.",
    };

    return new RoadmapTask(id, {
      title: `File Succession Documents at ${courtJurisdiction}`,
      description: `Lodge all required documents at ${courtJurisdiction} registry`,
      shortCode: taskCode,
      category: TaskCategory.LODGEMENT,
      priority: TaskPriority.CRITICAL,
      status: TaskStatus.PENDING,
      phase,
      orderIndex,
      dependsOnTaskIds,
      blocksTaskIds: [],
      applicableContexts: ['ALL'],
      legalReferences: [
        {
          act: 'LSA',
          section: '56',
          description: 'Application for grant of representation must be filed in proper court',
          isMandatory: true,
        },
      ],
      triggers: [TaskTrigger.MANUAL],
      detailedInstructions: [
        'Ensure all documents are properly signed and witnessed',
        'Make required number of copies (varies by court)',
        'Pay filing fees at court cashier',
        'Submit documents to registry clerk',
        'Obtain filing receipt with case number',
      ],
      quickTips: [
        'Go early (8-10 AM) to avoid long queues',
        'Bring extra copies just in case',
        'Check court website for any special requirements',
      ],
      commonMistakes: [
        'Not having documents properly signed',
        'Not paying correct filing fees',
        'Going to wrong court division',
      ],
      externalLinks: [
        {
          title: 'Court Filing Fees Calculator',
          url: 'https://ecitizen.judiciary.go.ke/fees-calculator',
          type: 'COURT_PORTAL',
          description: 'Calculate exact filing fees',
        },
      ],
      estimatedTimeMinutes: 180,
      courtSpecificInstructions,
      requiresProof: true,
      proofTypes: [ProofType.COURT_RECEIPT, ProofType.BANK_SLIP],
      isOverdue: false,
      reminderIntervalDays: 2,
      escalationLevel: 0,
      autoEscalateAfterDays: 5,
      timeSpentMinutes: 0,
      retryCount: 0,
      tags: ['court', 'filing', 'mandatory', 'phase-2'],
      templateVersion: '2024.1',
      createdBy,
      lastModifiedBy: createdBy,
      lastModifiedAt: new Date(),
      relatedRiskFlagIds: [],
      relatedDocumentGapIds: [],
      history: [
        {
          timestamp: new Date(),
          action: 'CREATED',
          performedBy: createdBy,
        },
      ],
    });
  }

  /**
   * Generic factory method
   */
  public static create(props: RoadmapTaskProps): RoadmapTask {
    return new RoadmapTask(UniqueEntityID.newID(), props);
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
    const now = new Date();

    return {
      id: this.id.toString(),
      title: this.props.title,
      description: this.props.description,
      shortCode: this.props.shortCode,
      category: this.props.category,
      priority: this.props.priority,
      status: this.props.status,
      phase: this.props.phase,
      phaseName: this.getPhaseName(),
      orderIndex: this.props.orderIndex,
      dependsOnTaskIds: this.props.dependsOnTaskIds,
      blocksTaskIds: this.props.blocksTaskIds,
      applicableContexts: this.props.applicableContexts,
      legalReferences: this.props.legalReferences,
      primaryLegalBasis: this.getPrimaryLegalBasis(),
      allLegalBases: this.getAllLegalBases(),
      triggers: this.props.triggers,
      detailedInstructions: this.props.detailedInstructions,
      quickTips: this.props.quickTips,
      commonMistakes: this.props.commonMistakes,
      externalLinks: this.props.externalLinks,
      estimatedTimeMinutes: this.props.estimatedTimeMinutes,
      requiresProof: this.props.requiresProof,
      proofTypes: this.props.proofTypes,
      proofDocumentType: this.props.proofDocumentType,
      dueDate: this.props.dueDate?.toISOString(),
      startDate: this.props.startDate?.toISOString(),
      endDate: this.props.endDate?.toISOString(),
      startedAt: this.props.startedAt?.toISOString(),
      completedAt: this.props.completedAt?.toISOString(),
      skippedAt: this.props.skippedAt?.toISOString(),
      completedBy: this.props.completedBy,
      completionNotes: this.props.completionNotes,
      skipReason: this.props.skipReason,
      waiverReason: this.props.waiverReason,
      failureReason: this.props.failureReason,
      isOverdue: this.props.isOverdue,
      daysOverdue: this.getDaysOverdue(now),
      daysRemaining: this.getDaysRemaining(now),
      reminderIntervalDays: this.props.reminderIntervalDays,
      lastRemindedAt: this.props.lastRemindedAt?.toISOString(),
      escalationLevel: this.props.escalationLevel,
      currentEscalationLevel: this.getEscalationLevel(),
      autoEscalateAfterDays: this.props.autoEscalateAfterDays,
      timeSpentMinutes: this.props.timeSpentMinutes,
      retryCount: this.props.retryCount,
      lastAttemptedAt: this.props.lastAttemptedAt?.toISOString(),
      tags: this.props.tags,
      templateVersion: this.props.templateVersion,
      createdBy: this.props.createdBy,
      lastModifiedBy: this.props.lastModifiedBy,
      lastModifiedAt: this.props.lastModifiedAt.toISOString(),
      relatedRiskFlagIds: this.props.relatedRiskFlagIds,
      relatedDocumentGapIds: this.props.relatedDocumentGapIds,
      history: this.props.history.map((entry) => ({
        ...entry,
        timestamp: entry.timestamp.toISOString(),
      })),

      // Derived properties for UI
      statusIcon: this.getStatusIcon(),
      canStart: this.props.status === TaskStatus.PENDING,
      canComplete: this.props.status === TaskStatus.IN_PROGRESS,
      canSkip: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS].includes(this.props.status),
      urgencyScore: this.getUrgencyScore(),
      shouldSendReminder: this.shouldSendReminder(now),
      isBlocked: this.props.status === TaskStatus.BLOCKED,
      isFailed: this.props.status === TaskStatus.FAILED,
      isWaived: this.props.status === TaskStatus.WAIVED,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
