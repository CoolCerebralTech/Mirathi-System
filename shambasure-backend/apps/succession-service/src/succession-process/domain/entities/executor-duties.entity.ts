import { AggregateRoot } from '@nestjs/cqrs';
import { ExecutorDutyType } from '../../../common/types/kenyan-law.types';
import { DutyAssignedEvent } from '../events/duty-assigned.event';
import { DutyCompletedEvent } from '../events/duty-completed.event';
import { DutyOverdueEvent } from '../events/duty-overdue.event';
import { DutyWaivedEvent } from '../events/duty-waived.event';
import { DutyInProgressEvent } from '../events/duty-in-progress.event';
import { DutyDeadlineExtendedEvent } from '../events/duty-deadline-extended.event';

export type DutyStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'OVERDUE'
  | 'WAIVED'
  | 'EXTENDED';
export type PriorityLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type LegalBasis =
  | 'SECTION_83'
  | 'SECTION_79'
  | 'COURT_ORDER'
  | 'WILL_PROVISION'
  | 'CUSTOMARY_LAW';

// Safe interface for reconstitution
export interface ExecutorDutyProps {
  id: string;
  estateId: string;
  executorId: string;
  type: ExecutorDutyType;
  description: string;
  stepOrder: number;
  deadline: Date | string;
  status: DutyStatus;
  completedAt?: Date | string | null;
  notes?: string | null;
  priority: PriorityLevel;
  legalBasis: LegalBasis;
  supportingDocuments?: string[];
  courtOrderNumber?: string | null;
  extensionDetails?: {
    previousDeadline?: Date | string | null;
    extensionReason?: string | null;
    extendedBy?: string | null;
    extensionDate?: Date | string | null;
  } | null;
  startedAt?: Date | string | null;
  estimatedCompletion?: Date | string | null;
  overdueNotificationsSent: number;
  lastOverdueNotification?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export class ExecutorDuty extends AggregateRoot {
  private id: string;
  private estateId: string;
  private executorId: string;

  // Task Details
  private type: ExecutorDutyType;
  private description: string;
  private stepOrder: number;
  private priority: PriorityLevel;
  private legalBasis: LegalBasis;
  private supportingDocuments: string[];
  private courtOrderNumber: string | null;

  // Timing
  private deadline: Date;
  private startedAt: Date | null;
  private estimatedCompletion: Date | null;
  private completedAt: Date | null;

  // State
  private status: DutyStatus;
  private notes: string | null;

  // Extension Tracking
  private extensionDetails: {
    previousDeadline: Date | null;
    extensionReason: string | null;
    extendedBy: string | null;
    extensionDate: Date | null;
  };

  // Overdue Tracking
  private overdueNotificationsSent: number;
  private lastOverdueNotification: Date | null;

  private createdAt: Date;
  private updatedAt: Date;

  private constructor(
    id: string,
    estateId: string,
    executorId: string,
    type: ExecutorDutyType,
    description: string,
    stepOrder: number,
    deadline: Date,
    priority: PriorityLevel,
    legalBasis: LegalBasis,
  ) {
    super();
    this.id = id;
    this.estateId = estateId;
    this.executorId = executorId;
    this.type = type;
    this.description = description;
    this.stepOrder = stepOrder;
    this.deadline = deadline;
    this.priority = priority;
    this.legalBasis = legalBasis;

    this.status = 'PENDING';
    this.startedAt = null;
    this.estimatedCompletion = null;
    this.completedAt = null;
    this.notes = null;
    this.supportingDocuments = [];
    this.courtOrderNumber = null;

    this.extensionDetails = {
      previousDeadline: null,
      extensionReason: null,
      extendedBy: null,
      extensionDate: null,
    };

    this.overdueNotificationsSent = 0;
    this.lastOverdueNotification = null;

    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static assign(
    id: string,
    estateId: string,
    executorId: string,
    type: ExecutorDutyType,
    description: string,
    stepOrder: number,
    deadline: Date,
    options?: {
      priority?: PriorityLevel;
      legalBasis?: LegalBasis;
      courtOrderNumber?: string;
      supportingDocuments?: string[];
    },
  ): ExecutorDuty {
    if (deadline < new Date()) {
      throw new Error('Cannot assign duty with past deadline.');
    }

    const duty = new ExecutorDuty(
      id,
      estateId,
      executorId,
      type,
      description,
      stepOrder,
      deadline,
      options?.priority || 'MEDIUM',
      options?.legalBasis || 'SECTION_83',
    );

    if (options) {
      if (options.courtOrderNumber) duty.courtOrderNumber = options.courtOrderNumber;
      if (options.supportingDocuments) duty.supportingDocuments = options.supportingDocuments;
    }

    duty.apply(
      new DutyAssignedEvent(
        id,
        estateId,
        executorId,
        type,
        description,
        deadline,
        stepOrder,
        duty.legalBasis,
      ),
    );

    return duty;
  }

  static reconstitute(props: ExecutorDutyProps): ExecutorDuty {
    // Validate required fields
    if (
      !props.id ||
      !props.estateId ||
      !props.executorId ||
      !props.type ||
      !props.description ||
      !props.stepOrder ||
      !props.deadline ||
      !props.priority ||
      !props.legalBasis
    ) {
      throw new Error('Missing required properties for ExecutorDuty reconstitution');
    }

    const duty = new ExecutorDuty(
      props.id,
      props.estateId,
      props.executorId,
      props.type,
      props.description,
      props.stepOrder,
      new Date(props.deadline),
      props.priority,
      props.legalBasis,
    );

    // Safe property assignments
    duty.status = props.status;
    duty.supportingDocuments = props.supportingDocuments || [];
    duty.courtOrderNumber = props.courtOrderNumber ?? null;
    duty.overdueNotificationsSent = props.overdueNotificationsSent || 0;
    duty.notes = props.notes ?? null;

    // Safe date handling
    if (props.completedAt) {
      duty.completedAt = new Date(props.completedAt);
    } else {
      duty.completedAt = null;
    }

    if (props.startedAt) {
      duty.startedAt = new Date(props.startedAt);
    } else {
      duty.startedAt = null;
    }

    if (props.estimatedCompletion) {
      duty.estimatedCompletion = new Date(props.estimatedCompletion);
    } else {
      duty.estimatedCompletion = null;
    }

    if (props.lastOverdueNotification) {
      duty.lastOverdueNotification = new Date(props.lastOverdueNotification);
    } else {
      duty.lastOverdueNotification = null;
    }

    // Extension details - FIXED: Handle null properly
    if (props.extensionDetails) {
      duty.extensionDetails = {
        previousDeadline: props.extensionDetails.previousDeadline
          ? new Date(props.extensionDetails.previousDeadline)
          : null,
        extensionReason: props.extensionDetails.extensionReason ?? null,
        extendedBy: props.extensionDetails.extendedBy ?? null,
        extensionDate: props.extensionDetails.extensionDate
          ? new Date(props.extensionDetails.extensionDate)
          : null,
      };
    }

    duty.createdAt = new Date(props.createdAt);
    duty.updatedAt = new Date(props.updatedAt);

    // Check overdue status on reconstitution
    if (duty.status !== 'COMPLETED' && duty.status !== 'WAIVED' && new Date() > duty.deadline) {
      duty.status = 'OVERDUE';
    }

    return duty;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  /**
   * Mark duty as in progress
   */
  markInProgress(estimatedCompletion?: Date, progressNotes?: string): void {
    if (this.status !== 'PENDING' && this.status !== 'EXTENDED') {
      throw new Error('Only pending or extended duties can be marked as in progress.');
    }

    this.status = 'IN_PROGRESS';
    this.startedAt = new Date();

    if (estimatedCompletion) {
      this.estimatedCompletion = estimatedCompletion;
    }

    if (progressNotes) {
      this.notes = progressNotes;
    }

    this.updatedAt = new Date();

    this.apply(
      new DutyInProgressEvent(
        this.id,
        this.estateId,
        this.executorId,
        this.type,
        this.startedAt,
        estimatedCompletion,
        progressNotes,
      ),
    );
  }

  /**
   * Complete the duty with supporting documentation
   */
  complete(
    date: Date = new Date(),
    options?: {
      notes?: string;
      supportingDocuments?: string[];
      completedBy?: string;
    },
  ): void {
    if (this.status === 'COMPLETED') return;

    if (this.status === 'WAIVED') {
      throw new Error('Cannot complete a waived duty.');
    }

    this.status = 'COMPLETED';
    this.completedAt = date;

    if (options) {
      if (options.notes) this.notes = options.notes;
      if (options.supportingDocuments) {
        this.supportingDocuments = [...this.supportingDocuments, ...options.supportingDocuments];
      }
    }

    this.updatedAt = new Date();

    this.apply(
      new DutyCompletedEvent(
        this.id,
        this.estateId,
        this.executorId,
        date,
        this.type,
        options?.notes,
        options?.supportingDocuments,
      ),
    );
  }

  /**
   * Extend the deadline with proper tracking
   */
  extendDeadline(
    newDeadline: Date,
    reason: string,
    extendedBy: string,
    courtOrderNumber?: string,
  ): void {
    if (this.status === 'COMPLETED' || this.status === 'WAIVED') {
      throw new Error('Cannot extend deadline for completed or waived duties.');
    }

    if (newDeadline <= this.deadline) {
      throw new Error('New deadline must be after current deadline.');
    }

    const oldDeadline = this.deadline;
    this.extensionDetails.previousDeadline = oldDeadline;
    this.extensionDetails.extensionReason = reason;
    this.extensionDetails.extendedBy = extendedBy;
    this.extensionDetails.extensionDate = new Date();
    this.deadline = newDeadline;

    if (courtOrderNumber) {
      this.courtOrderNumber = courtOrderNumber;
    }

    const extensionDays = Math.floor(
      (newDeadline.getTime() - oldDeadline.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Reset overdue status if extended
    if (this.status === 'OVERDUE') {
      this.status = 'EXTENDED';
    }

    this.updatedAt = new Date();

    this.apply(
      new DutyDeadlineExtendedEvent(
        this.id,
        this.estateId,
        this.executorId,
        this.type,
        oldDeadline,
        newDeadline,
        reason,
        extendedBy,
        extensionDays,
      ),
    );
  }

  /**
   * System check to flag overdue items with notification tracking
   */
  checkOverdue(): boolean {
    if (this.status === 'COMPLETED' || this.status === 'WAIVED') return false;

    const now = new Date();
    if (now > this.deadline) {
      const wasNotOverdue = this.status !== 'OVERDUE';
      this.status = 'OVERDUE';
      this.updatedAt = now;

      if (wasNotOverdue) {
        const daysLate = Math.floor(
          (now.getTime() - this.deadline.getTime()) / (1000 * 60 * 60 * 24),
        );

        // Check if we should send notification (not sent in last 7 days)
        const shouldNotify =
          !this.lastOverdueNotification ||
          now.getTime() - this.lastOverdueNotification.getTime() > 7 * 24 * 60 * 60 * 1000;

        this.apply(
          new DutyOverdueEvent(
            this.id,
            this.estateId,
            this.executorId,
            this.type,
            daysLate,
            this.deadline,
            shouldNotify,
          ),
        );

        if (shouldNotify) {
          this.overdueNotificationsSent++;
          this.lastOverdueNotification = now;
        }
      }
      return true;
    }
    return false;
  }

  /**
   * Waive a duty with proper legal tracking
   */
  waive(reason: string, waivedBy: string, courtOrderNumber?: string): void {
    if (this.status === 'COMPLETED') {
      throw new Error('Cannot waive a completed duty.');
    }

    this.status = 'WAIVED';
    this.notes = `Waived: ${reason}`;

    if (courtOrderNumber) {
      this.courtOrderNumber = courtOrderNumber;
    }

    this.updatedAt = new Date();

    this.apply(
      new DutyWaivedEvent(
        this.id,
        this.estateId,
        this.executorId,
        this.type,
        reason,
        waivedBy,
        new Date(),
        courtOrderNumber,
      ),
    );
  }

  /**
   * Add supporting document to duty
   */
  addSupportingDocument(documentId: string): void {
    if (this.status === 'COMPLETED' || this.status === 'WAIVED') {
      throw new Error('Cannot add documents to completed or waived duties.');
    }

    this.supportingDocuments.push(documentId);
    this.updatedAt = new Date();
  }

  /**
   * Update duty notes
   */
  updateNotes(newNotes: string): void {
    this.notes = newNotes;
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // VALIDATION & HELPER METHODS
  // --------------------------------------------------------------------------

  /**
   * Check if duty is critical (high priority and approaching deadline)
   */
  isCritical(): boolean {
    if (this.status === 'COMPLETED' || this.status === 'WAIVED') return false;

    const now = new Date();
    const daysUntilDeadline = Math.floor(
      (this.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    return this.priority === 'HIGH' && daysUntilDeadline <= 7;
  }

  /**
   * Get days remaining until deadline
   */
  getDaysRemaining(): number {
    if (this.status === 'COMPLETED' || this.status === 'WAIVED') return 0;

    const now = new Date();
    const diffTime = this.deadline.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get days overdue (negative if not overdue)
   */
  getDaysOverdue(): number {
    if (this.status !== 'OVERDUE') return 0;

    const now = new Date();
    const diffTime = now.getTime() - this.deadline.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if duty requires court supervision - FIXED: Use valid ExecutorDutyType values
   */
  requiresCourtSupervision(): boolean {
    const courtSupervisedDuties: ExecutorDutyType[] = [
      'FILE_INVENTORY' as ExecutorDutyType, // Example - use your actual values
      'PAY_DEBTS' as ExecutorDutyType, // Example - use your actual values
      'DISTRIBUTE_ASSETS' as ExecutorDutyType, // Example - use your actual values
      'FILE_ACCOUNTS' as ExecutorDutyType, // Example - use your actual values
    ];

    return courtSupervisedDuties.includes(this.type);
  }

  /**
   * Get legal description for court documents
   */
  getLegalDescription(): string {
    const basisMap: Record<LegalBasis, string> = {
      SECTION_83: 'Law of Succession Act, Section 83',
      SECTION_79: 'Law of Succession Act, Section 79',
      COURT_ORDER: 'Court Order',
      WILL_PROVISION: 'Will Provision',
      CUSTOMARY_LAW: 'Customary Law',
    };

    return `${this.description} - ${basisMap[this.legalBasis]}`;
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  getId(): string {
    return this.id;
  }
  getType(): ExecutorDutyType {
    return this.type;
  }
  getStatus(): DutyStatus {
    return this.status;
  }
  getDeadline(): Date {
    return this.deadline;
  }
  getStepOrder(): number {
    return this.stepOrder;
  }
  getEstateId(): string {
    return this.estateId;
  }
  getExecutorId(): string {
    return this.executorId;
  }
  getDescription(): string {
    return this.description;
  }
  getPriority(): PriorityLevel {
    return this.priority;
  }
  getLegalBasis(): LegalBasis {
    return this.legalBasis;
  }
  getCompletedAt(): Date | null {
    return this.completedAt;
  }
  getStartedAt(): Date | null {
    return this.startedAt;
  }
  getEstimatedCompletion(): Date | null {
    return this.estimatedCompletion;
  }
  getNotes(): string | null {
    return this.notes;
  }
  getSupportingDocuments(): string[] {
    return [...this.supportingDocuments];
  }
  getCourtOrderNumber(): string | null {
    return this.courtOrderNumber;
  }
  getExtensionDetails() {
    return { ...this.extensionDetails };
  }
  getOverdueNotificationsSent(): number {
    return this.overdueNotificationsSent;
  }
  getLastOverdueNotification(): Date | null {
    return this.lastOverdueNotification;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Method to get all properties for persistence
  getProps(): ExecutorDutyProps {
    return {
      id: this.id,
      estateId: this.estateId,
      executorId: this.executorId,
      type: this.type,
      description: this.description,
      stepOrder: this.stepOrder,
      deadline: this.deadline,
      status: this.status,
      completedAt: this.completedAt,
      notes: this.notes,
      priority: this.priority,
      legalBasis: this.legalBasis,
      supportingDocuments: this.supportingDocuments,
      courtOrderNumber: this.courtOrderNumber,
      extensionDetails: this.extensionDetails,
      startedAt: this.startedAt,
      estimatedCompletion: this.estimatedCompletion,
      overdueNotificationsSent: this.overdueNotificationsSent,
      lastOverdueNotification: this.lastOverdueNotification,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
