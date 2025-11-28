import { AggregateRoot } from '@nestjs/cqrs';
import { DisputeStatus, DisputeType } from '@prisma/client';

// Domain Events
import { DisputeFiledEvent } from '../events/dispute-filed.event';
import { DisputeResolvedEvent } from '../events/dispute-resolved.event';
import { DisputeStatusChangedEvent } from '../events/dispute-status-changed.event';

// Value Objects
export class LegalGrounds {
  constructor(
    private readonly grounds: string[],
    private readonly supportingEvidence: string[],
    private readonly evidenceDescription?: string,
  ) {
    if (!grounds.length) {
      throw new Error('Legal grounds cannot be empty');
    }
  }

  getGrounds(): ReadonlyArray<string> {
    return [...this.grounds];
  }
  getSupportingEvidence(): ReadonlyArray<string> {
    return [...this.supportingEvidence];
  }
  getEvidenceDescription(): string | undefined {
    return this.evidenceDescription;
  }

  addEvidence(evidenceUrl: string): LegalGrounds {
    return new LegalGrounds(
      this.grounds,
      [...this.supportingEvidence, evidenceUrl],
      this.evidenceDescription,
    );
  }

  static createFromDisputeType(
    type: DisputeType,
    description: string,
    evidenceRefs: string[] = [],
  ): LegalGrounds {
    const grounds = LegalGrounds.getDefaultGroundsForType(type);
    return new LegalGrounds(grounds, evidenceRefs, description);
  }

  private static getDefaultGroundsForType(type: DisputeType): string[] {
    const groundsMap: Record<DisputeType, string[]> = {
      [DisputeType.VALIDITY_CHALLENGE]: [
        'Testator lacked testamentary capacity at time of will execution',
        'Will does not comply with formal requirements under Section 11 of Law of Succession Act',
      ],
      [DisputeType.UNDUE_INFLUENCE]: [
        'Testator was coerced or unduly influenced in making the will',
        'Testator did not exercise free will in disposition of property',
      ],
      [DisputeType.LACK_CAPACITY]: [
        'Testator was of unsound mind at time of will execution',
        'Testator did not understand nature and consequences of will',
      ],
      [DisputeType.FRAUD]: [
        'Will was procured by fraud or forgery',
        'Testator was deceived about nature of document being signed',
      ],
      [DisputeType.OMITTED_HEIR]: [
        'Dependant was not provided for as required by Section 26 of Law of Succession Act',
        'Testator had moral obligation to provide for omitted heir',
      ],
      [DisputeType.ASSET_VALUATION]: [
        'Asset valuation does not reflect true market value',
        'Valuation methodology was improper or biased',
      ],
      [DisputeType.EXECUTOR_MISCONDUCT]: [
        'Executor breached fiduciary duties',
        'Executor failed to administer estate in accordance with will or law',
      ],
      [DisputeType.OTHER]: ['Other grounds as specified in supporting evidence'],
    };
    return groundsMap[type] || ['Grounds to be specified in supporting evidence'];
  }
}

// Main Entity
export class Dispute extends AggregateRoot {
  constructor(
    private readonly id: string,
    private readonly willId: string,
    private readonly disputantId: string,
    private type: DisputeType,
    private description: string,
    private status: DisputeStatus = DisputeStatus.FILED,
    private lawyerName?: string,
    private lawyerContact?: string,
    private caseNumber?: string,
    private resolution?: string,
    private resolvedAt?: Date,
    private evidenceUrls: string[] = [],
    private readonly filedAt: Date = new Date(),
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
  ) {
    super();
    this.validate();
  }

  // ==========================================================================
  // FACTORY METHODS (Creation & Reconstitution)
  // ==========================================================================

  static file(
    id: string,
    willId: string,
    disputantId: string,
    type: DisputeType,
    description: string,
    options?: {
      lawyerName?: string;
      lawyerContact?: string;
      caseNumber?: string;
      evidenceUrls?: string[];
    },
  ): Dispute {
    // Legal Validation: Ensure dispute grounds are valid under Kenyan law
    Dispute.validateDisputeType(type, description);

    const dispute = new Dispute(
      id,
      willId,
      disputantId,
      type,
      description,
      DisputeStatus.FILED,
      options?.lawyerName,
      options?.lawyerContact,
      options?.caseNumber,
      undefined, // resolution
      undefined, // resolvedAt
      options?.evidenceUrls || [],
      new Date(), // filedAt
      new Date(), // createdAt
      new Date(), // updatedAt
    );

    dispute.apply(
      new DisputeFiledEvent(
        dispute.id,
        dispute.willId,
        dispute.disputantId,
        dispute.type,
        dispute.description,
      ),
    );

    return dispute;
  }

  static reconstitute(props: {
    id: string;
    willId: string;
    disputantId: string;
    type: DisputeType;
    description: string;
    status: DisputeStatus;
    lawyerName?: string;
    lawyerContact?: string;
    caseNumber?: string;
    resolution?: string;
    resolvedAt?: Date;
    evidenceUrls?: string[];
    filedAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }): Dispute {
    return new Dispute(
      props.id,
      props.willId,
      props.disputantId,
      props.type,
      props.description,
      props.status,
      props.lawyerName,
      props.lawyerContact,
      props.caseNumber,
      props.resolution,
      props.resolvedAt,
      props.evidenceUrls || [],
      props.filedAt,
      props.createdAt,
      props.updatedAt,
    );
  }

  // ==========================================================================
  // BUSINESS LOGIC (Domain Behavior)
  // ==========================================================================

  // Legal Requirement: Section 76 of Law of Succession Act - Caveat proceedings
  markUnderReview(reviewedBy: string): void {
    if (this.status !== DisputeStatus.FILED) {
      throw new Error('Only filed disputes can be marked as under review');
    }

    const oldStatus = this.status;
    this.status = DisputeStatus.UNDER_REVIEW;
    this.updatedAt = new Date();

    this.apply(
      new DisputeStatusChangedEvent(
        this.id,
        this.willId,
        oldStatus,
        this.status,
        'Dispute marked for review',
        reviewedBy,
      ),
    );
  }

  // Legal Requirement: Kenyan Court Annexed Mediation
  startMediation(mediatorName: string): void {
    if (![DisputeStatus.FILED, DisputeStatus.UNDER_REVIEW].includes(this.status)) {
      throw new Error('Dispute must be filed or under review to start mediation');
    }

    // Legal Restriction: Fraud disputes typically not suitable for mediation
    if (this.type === DisputeType.FRAUD) {
      throw new Error('Fraud disputes are generally not suitable for mediation under Kenyan law');
    }

    const oldStatus = this.status;
    this.status = DisputeStatus.MEDIATION;
    this.updatedAt = new Date();

    this.apply(
      new DisputeStatusChangedEvent(
        this.id,
        this.willId,
        oldStatus,
        this.status,
        `Mediation started with ${mediatorName}`,
        mediatorName,
      ),
    );
  }

  // Legal Requirement: Escalation to court proceedings
  fileInCourt(courtCaseNumber: string, courtName: string): void {
    if (this.status === DisputeStatus.RESOLVED || this.status === DisputeStatus.DISMISSED) {
      throw new Error('Cannot escalate a resolved or dismissed dispute');
    }

    const oldStatus = this.status;
    this.status = DisputeStatus.COURT_PROCEEDING;
    this.caseNumber = courtCaseNumber;
    this.updatedAt = new Date();

    this.apply(
      new DisputeStatusChangedEvent(
        this.id,
        this.willId,
        oldStatus,
        this.status,
        `Dispute filed in ${courtName} as case ${courtCaseNumber}`,
        'Court Registry',
      ),
    );
  }

  // Legal Requirement: Resolution with court oversight for certain types
  resolve(
    resolution: string,
    resolvedBy: string,
    isDismissed: boolean = false,
    courtOrderNumber?: string,
  ): void {
    if ([DisputeStatus.RESOLVED, DisputeStatus.DISMISSED].includes(this.status)) {
      throw new Error('Dispute is already closed');
    }

    // Legal Requirement: Court disputes require court order for resolution
    if (this.status === DisputeStatus.COURT_PROCEEDING && !courtOrderNumber) {
      throw new Error('Court proceeding disputes require a court order number for resolution');
    }

    const oldStatus = this.status;
    this.status = isDismissed ? DisputeStatus.DISMISSED : DisputeStatus.RESOLVED;
    this.resolution = resolution;
    this.resolvedAt = new Date();
    this.updatedAt = new Date();

    this.apply(
      new DisputeResolvedEvent(
        this.id,
        this.willId,
        resolution,
        this.status,
        this.resolvedAt,
        courtOrderNumber,
      ),
    );

    this.apply(
      new DisputeStatusChangedEvent(
        this.id,
        this.willId,
        oldStatus,
        this.status,
        isDismissed ? 'Dispute dismissed' : 'Dispute resolved',
        resolvedBy,
      ),
    );
  }

  withdraw(reason: string, withdrawnBy: string): void {
    this.resolve(
      `Withdrawn by applicant: ${reason}`,
      withdrawnBy,
      true, // isDismissed
    );
  }

  addEvidence(evidenceUrl: string): void {
    if ([DisputeStatus.RESOLVED, DisputeStatus.DISMISSED].includes(this.status)) {
      throw new Error('Cannot add evidence to a closed dispute');
    }

    this.evidenceUrls.push(evidenceUrl);
    this.updatedAt = new Date();
  }

  assignLegalRepresentation(lawyerName: string, lawyerContact: string): void {
    if (!lawyerName?.trim() || !lawyerContact?.trim()) {
      throw new Error('Lawyer name and contact information are required');
    }

    this.lawyerName = lawyerName;
    this.lawyerContact = lawyerContact;
    this.updatedAt = new Date();
  }

  // ==========================================================================
  // LEGAL COMPLIANCE & VALIDATION
  // ==========================================================================

  private validate(): void {
    if (!this.id) throw new Error('Dispute ID is required');
    if (!this.willId) throw new Error('Will ID is required');
    if (!this.disputantId) throw new Error('Disputant ID is required');
    if (!this.type) throw new Error('Dispute type is required');
    if (!this.description?.trim()) throw new Error('Dispute description is required');
    if (!this.status) throw new Error('Dispute status is required');
    if (!this.filedAt) throw new Error('Filing date is required');

    // Validate dates are in correct order
    if (this.resolvedAt && this.resolvedAt < this.filedAt) {
      throw new Error('Resolution date cannot be before filing date');
    }
  }

  private static validateDisputeType(type: DisputeType, description: string): void {
    if (!Object.values(DisputeType).includes(type)) {
      throw new Error(`Invalid dispute type: ${type}`);
    }

    // Legal Requirement: Specificity in dispute descriptions
    if (description.trim().length < 20) {
      throw new Error('Dispute description must be sufficiently detailed (minimum 20 characters)');
    }

    // Legal Restriction: Time limits for certain disputes
    if (type === DisputeType.OMITTED_HEIR) {
      // Omitted heirs must file within probate process timeframe
      const warning =
        'Note: Omitted heir claims should be filed during probate process for timely consideration';
      console.warn(warning);
    }
  }

  // ==========================================================================
  // QUERY METHODS & BUSINESS RULES
  // ==========================================================================

  isEligibleForMediation(): boolean {
    const nonMediableTypes = [DisputeType.FRAUD]; // Fraud typically goes straight to court
    return (
      !nonMediableTypes.includes(this.type) &&
      [DisputeStatus.FILED, DisputeStatus.UNDER_REVIEW].includes(this.status)
    );
  }

  isTimeSensitive(): boolean {
    // Legal Requirement: Probate disputes should be resolved within reasonable time
    const monthsSinceFiling = this.getMonthsSinceFiling();

    switch (this.type) {
      case DisputeType.VALIDITY_CHALLENGE:
        return monthsSinceFiling > 6; // Should be resolved within 6 months
      case DisputeType.OMITTED_HEIR:
        return monthsSinceFiling > 3; // Urgent for distribution planning
      default:
        return monthsSinceFiling > 12; // General 12-month guideline
    }
  }

  requiresCourtIntervention(): boolean {
    return [
      DisputeType.FRAUD,
      DisputeType.VALIDITY_CHALLENGE,
      DisputeType.EXECUTOR_MISCONDUCT,
    ].includes(this.type);
  }

  canBeWithdrawn(): boolean {
    return ![
      DisputeStatus.COURT_PROCEEDING,
      DisputeStatus.RESOLVED,
      DisputeStatus.DISMISSED,
    ].includes(this.status);
  }

  getMonthsSinceFiling(): number {
    const today = new Date();
    const months = (today.getFullYear() - this.filedAt.getFullYear()) * 12;
    return months + today.getMonth() - this.filedAt.getMonth();
  }

  getDaysSinceLastUpdate(): number {
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - this.updatedAt.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // ==========================================================================
  // GETTERS (Persistence Interface)
  // ==========================================================================

  getId(): string {
    return this.id;
  }
  getWillId(): string {
    return this.willId;
  }
  getDisputantId(): string {
    return this.disputantId;
  }
  getType(): DisputeType {
    return this.type;
  }
  getDescription(): string {
    return this.description;
  }
  getStatus(): DisputeStatus {
    return this.status;
  }
  getLawyerName(): string | undefined {
    return this.lawyerName;
  }
  getLawyerContact(): string | undefined {
    return this.lawyerContact;
  }
  getCaseNumber(): string | undefined {
    return this.caseNumber;
  }
  getResolution(): string | undefined {
    return this.resolution;
  }
  getResolvedAt(): Date | undefined {
    return this.resolvedAt;
  }
  getEvidenceUrls(): string[] {
    return [...this.evidenceUrls];
  }
  getFiledAt(): Date {
    return this.filedAt;
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
      willId: this.willId,
      disputantId: this.disputantId,
      type: this.type,
      description: this.description,
      status: this.status,
      lawyerName: this.lawyerName,
      lawyerContact: this.lawyerContact,
      caseNumber: this.caseNumber,
      resolution: this.resolution,
      resolvedAt: this.resolvedAt,
      evidenceUrls: this.evidenceUrls,
      filedAt: this.filedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
