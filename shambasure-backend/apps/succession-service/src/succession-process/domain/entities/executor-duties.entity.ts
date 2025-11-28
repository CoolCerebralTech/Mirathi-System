import { AggregateRoot } from '@nestjs/cqrs';
import { DutyStatus, ExecutorDutyType, LegalBasis, PriorityLevel } from '@prisma/client';

// Domain Events
import { DutyAssignedEvent } from '../events/duty-assigned.event';
import { DutyCompletedEvent } from '../events/duty-completed.event';
import { DutyExtendedEvent } from '../events/duty-extended.event';
import { DutyOverdueEvent } from '../events/duty-overdue.event';
import { DutyStartedEvent } from '../events/duty-started.event';

// Main Entity
export class ExecutorDuty extends AggregateRoot {
  constructor(
    private readonly id: string,
    private readonly estateId: string,
    private readonly executorId: string,
    private type: ExecutorDutyType,
    private description: string,
    private stepOrder: number,
    private deadline: Date,
    private status: DutyStatus = DutyStatus.PENDING,
    private priority: PriorityLevel = PriorityLevel.MEDIUM,
    private legalBasis: LegalBasis = LegalBasis.SECTION_83,
    private startedAt?: Date,
    private estimatedCompletion?: Date,
    private completedAt?: Date,
    private notes?: string,
    private supportingDocuments: string[] = [],
    private courtOrderNumber?: string,
    private previousDeadline?: Date,
    private extensionReason?: string,
    private extendedBy?: string,
    private extensionDate?: Date,
    private overdueNotificationsSent: number = 0,
    private lastOverdueNotification?: Date,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
  ) {
    super();
    this.validate();
  }

  // ==========================================================================
  // FACTORY METHODS (Creation & Reconstitution)
  // ==========================================================================

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
      notes?: string;
    },
  ): ExecutorDuty {
    // Legal Validation: Section 83 of Law of Succession Act
    ExecutorDuty.validateDutyType(type, deadline);

    const duty = new ExecutorDuty(
      id,
      estateId,
      executorId,
      type,
      description,
      stepOrder,
      deadline,
      DutyStatus.PENDING,
      options?.priority || PriorityLevel.MEDIUM,
      options?.legalBasis || LegalBasis.SECTION_83,
      undefined, // startedAt
      undefined, // estimatedCompletion
      undefined, // completedAt
      options?.notes,
      options?.supportingDocuments || [],
      options?.courtOrderNumber,
      undefined, // previousDeadline
      undefined, // extensionReason
      undefined, // extendedBy
      undefined, // extensionDate
      0, // overdueNotificationsSent
      undefined, // lastOverdueNotification
      new Date(), // createdAt
      new Date(), // updatedAt
    );

    duty.apply(
      new DutyAssignedEvent(
        duty.id,
        duty.estateId,
        duty.executorId,
        duty.type,
        duty.description,
        duty.deadline,
        duty.stepOrder,
      ),
    );

    return duty;
  }

  static reconstitute(props: {
    id: string;
    estateId: string;
    executorId: string;
    type: ExecutorDutyType;
    description: string;
    stepOrder: number;
    deadline: Date;
    status: DutyStatus;
    priority: PriorityLevel;
    legalBasis: LegalBasis;
    startedAt?: Date;
    estimatedCompletion?: Date;
    completedAt?: Date;
    notes?: string;
    supportingDocuments?: string[];
    courtOrderNumber?: string;
    previousDeadline?: Date;
    extensionReason?: string;
    extendedBy?: string;
    extensionDate?: Date;
    overdueNotificationsSent?: number;
    lastOverdueNotification?: Date;
    createdAt: Date;
    updatedAt: Date;
  }): ExecutorDuty {
    return new ExecutorDuty(
      props.id,
      props.estateId,
      props.executorId,
      props.type,
      props.description,
      props.stepOrder,
      props.deadline,
      props.status,
      props.priority,
      props.legalBasis,
      props.startedAt,
      props.estimatedCompletion,
      props.completedAt,
      props.notes,
      props.supportingDocuments || [],
      props.courtOrderNumber,
      props.previousDeadline,
      props.extensionReason,
      props.extendedBy,
      props.extensionDate,
      props.overdueNotificationsSent || 0,
      props.lastOverdueNotification,
      props.createdAt,
      props.updatedAt,
    );
  }

  // ==========================================================================
  // BUSINESS LOGIC (Domain Behavior)
  // ==========================================================================

  // Legal Requirement: Section 83 of Law of Succession Act - Executor duties
  startWork(estimatedCompletion?: Date, progressNotes?: string): void {
    if (this.status !== DutyStatus.PENDING && this.status !== DutyStatus.EXTENDED) {
      throw new Error('Only pending or extended duties can be started');
    }

    // Legal Requirement: Court-ordered duties may have specific start requirements
    if (this.legalBasis === LegalBasis.COURT_ORDER && !this.courtOrderNumber) {
      throw new Error('Court-ordered duties require court order number before starting');
    }

    this.status = DutyStatus.IN_PROGRESS;
    this.startedAt = new Date();
    this.estimatedCompletion = estimatedCompletion;

    if (progressNotes) {
      this.notes = progressNotes;
    }

    this.updatedAt = new Date();

    this.apply(
      new DutyStartedEvent(
        this.id,
        this.estateId,
        this.executorId,
        this.type,
        this.startedAt,
        estimatedCompletion,
      ),
    );
  }

  // Legal Requirement: Proper completion with documentation
  completeDuty(
    completionNotes?: string,
    additionalDocuments: string[] = [],
    completedAt: Date = new Date(),
  ): void {
    if (this.status === DutyStatus.COMPLETED) {
      throw new Error('Duty is already completed');
    }

    if (this.status === DutyStatus.WAIVED) {
      throw new Error('Cannot complete a waived duty');
    }

    // Legal Requirement: Validate completion conditions
    this.validateCompletionRequirements();

    this.status = DutyStatus.COMPLETED;
    this.completedAt = completedAt;

    if (completionNotes) {
      this.notes = completionNotes;
    }

    if (additionalDocuments.length > 0) {
      this.supportingDocuments.push(...additionalDocuments);
    }

    this.updatedAt = new Date();

    this.apply(
      new DutyCompletedEvent(
        this.id,
        this.estateId,
        this.executorId,
        this.type,
        this.completedAt,
        completionNotes,
      ),
    );
  }

  // Legal Requirement: Court-approved extensions for duties
  extendDeadline(
    newDeadline: Date,
    extensionReason: string,
    extendedBy: string,
    courtOrderNumber?: string,
  ): void {
    if (this.status === DutyStatus.COMPLETED || this.status === DutyStatus.WAIVED) {
      throw new Error('Cannot extend deadline for completed or waived duties');
    }

    if (newDeadline <= this.deadline) {
      throw new Error('New deadline must be after current deadline');
    }

    // Legal Requirement: Court approval for certain duty extensions
    if (this.requiresCourtApprovalForExtension() && !courtOrderNumber) {
      throw new Error('Court order required for extending this duty type');
    }

    this.previousDeadline = this.deadline;
    this.deadline = newDeadline;
    this.extensionReason = extensionReason;
    this.extendedBy = extendedBy;
    this.extensionDate = new Date();
    this.status = DutyStatus.EXTENDED;

    if (courtOrderNumber) {
      this.courtOrderNumber = courtOrderNumber;
    }

    this.updatedAt = new Date();

    const extensionDays = Math.ceil(
      (newDeadline.getTime() - this.previousDeadline.getTime()) / (1000 * 60 * 60 * 24),
    );

    this.apply(
      new DutyExtendedEvent(
        this.id,
        this.estateId,
        this.executorId,
        this.type,
        this.previousDeadline,
        newDeadline,
        extensionReason,
        extendedBy,
        extensionDays,
        courtOrderNumber,
      ),
    );
  }

  // Legal Requirement: Mark duties as overdue with proper notification
  markAsOverdue(): boolean {
    if ([DutyStatus.COMPLETED, DutyStatus.WAIVED].includes(this.status)) {
      return false;
    }

    const now = new Date();
    if (now > this.deadline && this.status !== DutyStatus.OVERDUE) {
      this.status = DutyStatus.OVERDUE;
      this.updatedAt = now;

      const daysOverdue = Math.ceil(
        (now.getTime() - this.deadline.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Only send notification if not sent in last 7 days
      const shouldNotify =
        !this.lastOverdueNotification ||
        now.getTime() - this.lastOverdueNotification.getTime() > 7 * 24 * 60 * 60 * 1000;

      if (shouldNotify) {
        this.overdueNotificationsSent++;
        this.lastOverdueNotification = now;
      }

      this.apply(
        new DutyOverdueEvent(
          this.id,
          this.estateId,
          this.executorId,
          this.type,
          daysOverdue,
          shouldNotify,
        ),
      );

      return true;
    }

    return false;
  }

  // Legal Requirement: Waive duties only with proper authority
  waiveDuty(waiveReason: string, waivedBy: string, courtOrderNumber?: string): void {
    if (this.status === DutyStatus.COMPLETED) {
      throw new Error('Cannot waive a completed duty');
    }

    // Legal Requirement: Certain duties cannot be waived
    if (this.isMandatoryDuty()) {
      throw new Error('This duty is mandatory and cannot be waived');
    }

    this.status = DutyStatus.WAIVED;
    this.notes = `Waived: ${waiveReason}`;

    if (courtOrderNumber) {
      this.courtOrderNumber = courtOrderNumber;
    }

    this.updatedAt = new Date();

    // Domain event for duty waiver would be added here
  }

  // Legal Requirement: Update progress with proper documentation
  updateProgress(progressNotes: string, additionalDocuments: string[] = []): void {
    if (this.status !== DutyStatus.IN_PROGRESS) {
      throw new Error('Can only update progress for duties in progress');
    }

    this.notes = progressNotes;

    if (additionalDocuments.length > 0) {
      this.supportingDocuments.push(...additionalDocuments);
    }

    this.updatedAt = new Date();
  }

  addSupportingDocument(documentId: string): void {
    if ([DutyStatus.COMPLETED, DutyStatus.WAIVED].includes(this.status)) {
      throw new Error('Cannot add documents to completed or waived duties');
    }

    this.supportingDocuments.push(documentId);
    this.updatedAt = new Date();
  }

  // ==========================================================================
  // LEGAL COMPLIANCE & VALIDATION
  // ==========================================================================

  private validate(): void {
    if (!this.id) throw new Error('Duty ID is required');
    if (!this.estateId) throw new Error('Estate ID is required');
    if (!this.executorId) throw new Error('Executor ID is required');
    if (!this.type) throw new Error('Duty type is required');
    if (!this.description?.trim()) throw new Error('Duty description is required');
    if (this.stepOrder < 1) throw new Error('Step order must be positive');
    if (!this.deadline) throw new Error('Deadline is required');
    if (!this.status) throw new Error('Duty status is required');
    if (!this.priority) throw new Error('Priority level is required');
    if (!this.legalBasis) throw new Error('Legal basis is required');

    // Validate deadline is in future for pending duties
    if (this.status === DutyStatus.PENDING && this.deadline < new Date()) {
      throw new Error('Pending duties cannot have past deadlines');
    }

    // Validate completion date is after start date if both exist
    if (this.completedAt && this.startedAt && this.completedAt < this.startedAt) {
      throw new Error('Completion date cannot be before start date');
    }
  }

  private static validateDutyType(type: ExecutorDutyType, deadline: Date): void {
    // Legal Requirement: Certain duties have specific timeframes
    const dutyTimeframes: Partial<Record<ExecutorDutyType, number>> = {
      [ExecutorDutyType.FILE_INVENTORY]: 90, // 90 days typically
      [ExecutorDutyType.OBTAIN_GRANT]: 180, // 6 months typically
      [ExecutorDutyType.FILE_ACCOUNTS]: 365, // 1 year typically
    };

    const typicalDays = dutyTimeframes[type];
    if (typicalDays) {
      const expectedDeadline = new Date();
      expectedDeadline.setDate(expectedDeadline.getDate() + typicalDays);

      if (deadline > expectedDeadline) {
        console.warn(`Deadline for ${type} exceeds typical timeframe of ${typicalDays} days`);
      }
    }
  }

  private validateCompletionRequirements(): void {
    // Legal Requirement: Specific completion validations by duty type
    switch (this.type) {
      case ExecutorDutyType.FILE_INVENTORY:
        if (!this.supportingDocuments.length) {
          throw new Error('Inventory filing requires supporting documents');
        }
        break;
      case ExecutorDutyType.PAY_DEBTS:
        // Debt payment may require court approval documentation
        if (this.legalBasis === LegalBasis.COURT_ORDER && !this.courtOrderNumber) {
          throw new Error('Court-ordered debt payments require court order number');
        }
        break;
      case ExecutorDutyType.DISTRIBUTE_ASSETS:
        // Asset distribution may require specific documentation
        console.warn('Asset distribution should have proper transfer documentation');
        break;
    }
  }

  private requiresCourtApprovalForExtension(): boolean {
    // Legal Requirement: Certain duty types require court approval for extensions
    const courtApprovalRequired = [
      ExecutorDutyType.DISTRIBUTE_ASSETS,
      ExecutorDutyType.FILE_ACCOUNTS,
      ExecutorDutyType.SETTLE_TAXES,
    ];
    return courtApprovalRequired.includes(this.type);
  }

  private isMandatoryDuty(): boolean {
    // Legal Requirement: Certain duties cannot be waived under Kenyan law
    const mandatoryDuties = [
      ExecutorDutyType.FILE_INVENTORY,
      ExecutorDutyType.PAY_DEBTS,
      ExecutorDutyType.SETTLE_TAXES,
      ExecutorDutyType.FILE_ACCOUNTS,
    ];
    return mandatoryDuties.includes(this.type);
  }

  // ==========================================================================
  // QUERY METHODS & BUSINESS RULES
  // ==========================================================================

  isOverdue(): boolean {
    return (
      this.status === DutyStatus.OVERDUE ||
      (this.status !== DutyStatus.COMPLETED &&
        this.status !== DutyStatus.WAIVED &&
        new Date() > this.deadline)
    );
  }

  getDaysRemaining(): number {
    if ([DutyStatus.COMPLETED, DutyStatus.WAIVED].includes(this.status)) {
      return 0;
    }

    const now = new Date();
    const diffTime = this.deadline.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDaysOverdue(): number {
    if (!this.isOverdue()) return 0;

    const now = new Date();
    const diffTime = now.getTime() - this.deadline.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isCritical(): boolean {
    return this.priority === PriorityLevel.HIGH && this.getDaysRemaining() <= 7;
  }

  requiresCourtSupervision(): boolean {
    const courtSupervisedDuties = [
      ExecutorDutyType.DISTRIBUTE_ASSETS,
      ExecutorDutyType.FILE_ACCOUNTS,
      ExecutorDutyType.OBTAIN_GRANT,
    ];
    return courtSupervisedDuties.includes(this.type);
  }

  canBeExtended(): boolean {
    return ![DutyStatus.COMPLETED, DutyStatus.WAIVED].includes(this.status);
  }

  getLegalDescription(): string {
    const basisDescriptions: Record<LegalBasis, string> = {
      [LegalBasis.SECTION_83]: 'Law of Succession Act, Section 83',
      [LegalBasis.SECTION_79]: 'Law of Succession Act, Section 79',
      [LegalBasis.COURT_ORDER]: 'Court Order',
      [LegalBasis.WILL_PROVISION]: 'Will Provision',
      [LegalBasis.CUSTOMARY_LAW]: 'Customary Law',
    };

    return `${this.description} - ${basisDescriptions[this.legalBasis]}`;
  }

  // ==========================================================================
  // GETTERS (Persistence Interface)
  // ==========================================================================

  getId(): string {
    return this.id;
  }
  getEstateId(): string {
    return this.estateId;
  }
  getExecutorId(): string {
    return this.executorId;
  }
  getType(): ExecutorDutyType {
    return this.type;
  }
  getDescription(): string {
    return this.description;
  }
  getStepOrder(): number {
    return this.stepOrder;
  }
  getDeadline(): Date {
    return this.deadline;
  }
  getStatus(): DutyStatus {
    return this.status;
  }
  getPriority(): PriorityLevel {
    return this.priority;
  }
  getLegalBasis(): LegalBasis {
    return this.legalBasis;
  }
  getStartedAt(): Date | undefined {
    return this.startedAt;
  }
  getEstimatedCompletion(): Date | undefined {
    return this.estimatedCompletion;
  }
  getCompletedAt(): Date | undefined {
    return this.completedAt;
  }
  getNotes(): string | undefined {
    return this.notes;
  }
  getSupportingDocuments(): string[] {
    return [...this.supportingDocuments];
  }
  getCourtOrderNumber(): string | undefined {
    return this.courtOrderNumber;
  }
  getPreviousDeadline(): Date | undefined {
    return this.previousDeadline;
  }
  getExtensionReason(): string | undefined {
    return this.extensionReason;
  }
  getExtendedBy(): string | undefined {
    return this.extendedBy;
  }
  getExtensionDate(): Date | undefined {
    return this.extensionDate;
  }
  getOverdueNotificationsSent(): number {
    return this.overdueNotificationsSent;
  }
  getLastOverdueNotification(): Date | undefined {
    return this.lastOverdueNotification;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // For persistence reconstitution
  getProps() {
    return {
      id: this.id,
      estateId: this.estateId,
      executorId: this.executorId,
      type: this.type,
      description: this.description,
      stepOrder: this.stepOrder,
      deadline: this.deadline,
      status: this.status,
      priority: this.priority,
      legalBasis: this.legalBasis,
      startedAt: this.startedAt,
      estimatedCompletion: this.estimatedCompletion,
      completedAt: this.completedAt,
      notes: this.notes,
      supportingDocuments: this.supportingDocuments,
      courtOrderNumber: this.courtOrderNumber,
      previousDeadline: this.previousDeadline,
      extensionReason: this.extensionReason,
      extendedBy: this.extendedBy,
      extensionDate: this.extensionDate,
      overdueNotificationsSent: this.overdueNotificationsSent,
      lastOverdueNotification: this.lastOverdueNotification,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
