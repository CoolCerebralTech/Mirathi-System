import { AggregateRoot } from '@nestjs/cqrs';
import { DisputeStatus, DisputeType } from '@prisma/client';
import { DisputeFiledEvent } from '../events/dispute-filed.event';
import { DisputeResolvedEvent } from '../events/dispute-resolved.event';
import { DisputeMediationStartedEvent } from '../events/dispute-mediation-started.event';
import { DisputeCourtFiledEvent } from '../events/dispute-court-filed.event';
import { DisputeStatusChangedEvent } from '../events/dispute-status-changed.event';
import { LegalGrounds } from '../value-objects/legal-grounds.vo';

// Safe interface for reconstitution
export interface DisputeProps {
  id: string;
  willId: string;
  disputantId: string;
  type: DisputeType;
  grounds: LegalGrounds | { ground: string; description: string; supportingEvidence: string[] };
  status: DisputeStatus;
  caseNumber?: string | null;
  resolution?: string | null;
  resolvedAt?: Date | string | null;
  evidenceUrls: string[];
  lawyerName?: string | null;
  lawyerContact?: string | null;
  mediationDetails?: {
    mediatorName?: string | null;
    mediationDate?: Date | string | null;
    location?: string | null;
    outcome?: string | null;
  } | null;
  courtDetails?: {
    courtName?: string | null;
    judgeName?: string | null;
    filingDate?: Date | string | null;
    nextHearingDate?: Date | string | null;
  } | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export class Dispute extends AggregateRoot {
  private id: string;
  private willId: string;
  private disputantId: string;

  // Legal Details
  private type: DisputeType;
  private grounds: LegalGrounds;
  private caseNumber: string | null;
  private lawyerName: string | null;
  private lawyerContact: string | null;

  // Process
  private status: DisputeStatus;
  private resolution: string | null;
  private resolvedAt: Date | null;

  // Evidence
  private evidenceUrls: string[];

  // Mediation Details
  private mediationDetails: {
    mediatorName: string | null;
    mediationDate: Date | null;
    location: string | null;
    outcome: string | null;
  };

  // Court Details
  private courtDetails: {
    courtName: string | null;
    judgeName: string | null;
    filingDate: Date | null;
    nextHearingDate: Date | null;
  };

  private createdAt: Date;
  private updatedAt: Date;

  private constructor(
    id: string,
    willId: string,
    disputantId: string,
    type: DisputeType,
    grounds: LegalGrounds,
  ) {
    super();
    this.id = id;
    this.willId = willId;
    this.disputantId = disputantId;
    this.type = type;
    this.grounds = grounds;

    this.status = 'FILED';
    this.caseNumber = null;
    this.lawyerName = null;
    this.lawyerContact = null;
    this.resolution = null;
    this.resolvedAt = null;
    this.evidenceUrls = [];

    this.mediationDetails = {
      mediatorName: null,
      mediationDate: null,
      location: null,
      outcome: null,
    };

    this.courtDetails = {
      courtName: null,
      judgeName: null,
      filingDate: null,
      nextHearingDate: null,
    };

    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static create(
    id: string,
    willId: string,
    disputantId: string,
    type: DisputeType,
    description: string,
    evidenceRef: string[] = [],
    options?: {
      lawyerName?: string;
      lawyerContact?: string;
    },
  ): Dispute {
    const grounds = LegalGrounds.createFromDisputeType(type, description, evidenceRef);

    const dispute = new Dispute(id, willId, disputantId, type, grounds);
    dispute.evidenceUrls = evidenceRef;

    if (options) {
      if (options.lawyerName) dispute.lawyerName = options.lawyerName;
      if (options.lawyerContact) dispute.lawyerContact = options.lawyerContact;
    }

    dispute.apply(
      new DisputeFiledEvent(
        id,
        willId,
        disputantId,
        type,
        description,
        grounds.getSupportingEvidence(),
        evidenceRef.length,
      ),
    );

    return dispute;
  }

  static reconstitute(props: DisputeProps): Dispute {
    if (!props.id || !props.willId || !props.disputantId || !props.type || !props.grounds) {
      throw new Error('Missing required properties for Dispute reconstitution');
    }

    let grounds: LegalGrounds;
    if (props.grounds instanceof LegalGrounds) {
      grounds = props.grounds;
    } else {
      grounds = LegalGrounds.createFromString(
        props.grounds.ground,
        props.grounds.description,
        props.grounds.supportingEvidence || [],
      );
    }

    const dispute = new Dispute(props.id, props.willId, props.disputantId, props.type, grounds);

    dispute.status = props.status;
    dispute.caseNumber = props.caseNumber ?? null;
    dispute.lawyerName = props.lawyerName ?? null;
    dispute.lawyerContact = props.lawyerContact ?? null;
    dispute.resolution = props.resolution ?? null;
    dispute.evidenceUrls = props.evidenceUrls || [];

    if (props.resolvedAt) {
      dispute.resolvedAt = new Date(props.resolvedAt);
    } else {
      dispute.resolvedAt = null;
    }

    if (props.mediationDetails) {
      dispute.mediationDetails = {
        mediatorName: props.mediationDetails.mediatorName ?? null,
        mediationDate: props.mediationDetails.mediationDate
          ? new Date(props.mediationDetails.mediationDate)
          : null,
        location: props.mediationDetails.location ?? null,
        outcome: props.mediationDetails.outcome ?? null,
      };
    }

    if (props.courtDetails) {
      dispute.courtDetails = {
        courtName: props.courtDetails.courtName ?? null,
        judgeName: props.courtDetails.judgeName ?? null,
        filingDate: props.courtDetails.filingDate ? new Date(props.courtDetails.filingDate) : null,
        nextHearingDate: props.courtDetails.nextHearingDate
          ? new Date(props.courtDetails.nextHearingDate)
          : null,
      };
    }

    dispute.createdAt = new Date(props.createdAt);
    dispute.updatedAt = new Date(props.updatedAt);

    return dispute;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  markUnderReview(reviewedBy: string): void {
    if (this.status !== 'FILED')
      throw new Error('Only filed disputes can be marked as under review.');

    const oldStatus = this.status;
    this.status = 'UNDER_REVIEW';
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

  startMediation(
    mediatorName: string,
    mediationDate: Date,
    location: string,
    startedBy: string,
  ): void {
    if (!['FILED', 'UNDER_REVIEW'].includes(this.status))
      throw new Error('Dispute must be filed or under review to start mediation.');

    const oldStatus = this.status;
    this.status = 'MEDIATION';
    this.mediationDetails.mediatorName = mediatorName;
    this.mediationDetails.mediationDate = mediationDate;
    this.mediationDetails.location = location;
    this.updatedAt = new Date();

    this.apply(
      new DisputeMediationStartedEvent(this.id, this.willId, mediatorName, mediationDate, location),
    );
    this.apply(
      new DisputeStatusChangedEvent(
        this.id,
        this.willId,
        oldStatus,
        this.status,
        'Mediation process started',
        startedBy,
      ),
    );
  }

  recordMediationOutcome(outcome: string): void {
    if (this.status !== 'MEDIATION')
      throw new Error('Can only record outcome for disputes in mediation.');
    this.mediationDetails.outcome = outcome;
    this.updatedAt = new Date();
  }

  fileInCourt(courtCaseNumber: string, courtName: string, filingDate: Date, filedBy: string): void {
    if (this.status === 'RESOLVED' || this.status === 'DISMISSED')
      throw new Error('Cannot escalate a closed dispute.');

    const oldStatus = this.status;
    this.status = 'COURT_PROCEEDING';
    this.caseNumber = courtCaseNumber;
    this.courtDetails.courtName = courtName;
    this.courtDetails.filingDate = filingDate;
    this.updatedAt = new Date();

    this.apply(
      new DisputeCourtFiledEvent(this.id, this.willId, courtCaseNumber, courtName, filingDate),
    );
    this.apply(
      new DisputeStatusChangedEvent(
        this.id,
        this.willId,
        oldStatus,
        this.status,
        'Dispute filed in court',
        filedBy,
      ),
    );
  }

  updateCourtHearing(judgeName: string, nextHearingDate: Date): void {
    if (this.status !== 'COURT_PROCEEDING')
      throw new Error('Can only update court details for disputes in court proceedings.');
    this.courtDetails.judgeName = judgeName;
    this.courtDetails.nextHearingDate = nextHearingDate;
    this.updatedAt = new Date();
  }

  resolve(
    outcome: string,
    isDismissed: boolean,
    resolvedBy: string,
    resolutionType?: string,
    courtOrderNumber?: string,
  ): void {
    if (this.status === 'RESOLVED' || this.status === 'DISMISSED') return;

    const oldStatus = this.status;
    this.status = isDismissed ? 'DISMISSED' : 'RESOLVED';
    this.resolution = outcome;
    this.resolvedAt = new Date();
    this.updatedAt = new Date();

    this.apply(
      new DisputeResolvedEvent(
        this.id,
        this.willId,
        outcome,
        this.status,
        this.resolvedAt,
        resolutionType,
        courtOrderNumber,
      ),
    );
    this.apply(
      new DisputeStatusChangedEvent(
        this.id,
        this.willId,
        oldStatus,
        this.status,
        `Dispute ${isDismissed ? 'dismissed' : 'resolved'}`,
        resolvedBy,
      ),
    );
  }

  withdraw(reason: string, withdrawnBy: string): void {
    this.resolve(`Withdrawn by applicant: ${reason}`, true, withdrawnBy, 'WITHDRAWN');
  }

  addEvidence(evidenceUrl: string): void {
    if (this.status === 'RESOLVED' || this.status === 'DISMISSED')
      throw new Error('Cannot add evidence to a closed dispute.');
    this.evidenceUrls.push(evidenceUrl);
    this.grounds.addSupportingEvidence(evidenceUrl);
    this.updatedAt = new Date();
  }

  assignLawyer(lawyerName: string, lawyerContact: string): void {
    this.lawyerName = lawyerName;
    this.lawyerContact = lawyerContact;
    this.updatedAt = new Date();
  }

  isEligibleForMediation(): boolean {
    const nonMediableTypes: DisputeType[] = ['FRAUD'];
    return !nonMediableTypes.includes(this.type) && ['FILED', 'UNDER_REVIEW'].includes(this.status);
  }

  isOverdue(): boolean {
    const filingDate = this.createdAt;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return filingDate < sixMonthsAgo && !['RESOLVED', 'DISMISSED'].includes(this.status);
  }

  getDaysSinceFiling(): number {
    const today = new Date();
    const diffTime = today.getTime() - this.createdAt.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Getters
  getId(): string {
    return this.id;
  }
  getWillId(): string {
    return this.willId;
  }
  getDisputantId(): string {
    return this.disputantId;
  }
  getStatus(): DisputeStatus {
    return this.status;
  }
  getGrounds(): LegalGrounds {
    return this.grounds;
  }
  getResolution(): string | null {
    return this.resolution;
  }
  getType(): DisputeType {
    return this.type;
  }
  getCaseNumber(): string | null {
    return this.caseNumber;
  }
  getLawyerName(): string | null {
    return this.lawyerName;
  }
  getLawyerContact(): string | null {
    return this.lawyerContact;
  }
  getEvidenceUrls(): string[] {
    return [...this.evidenceUrls];
  }
  getMediationDetails() {
    return { ...this.mediationDetails };
  }
  getCourtDetails() {
    return { ...this.courtDetails };
  }
  getResolvedAt(): Date | null {
    return this.resolvedAt;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getProps(): DisputeProps {
    return {
      id: this.id,
      willId: this.willId,
      disputantId: this.disputantId,
      type: this.type,
      grounds: this.grounds,
      status: this.status,
      caseNumber: this.caseNumber,
      resolution: this.resolution,
      resolvedAt: this.resolvedAt,
      evidenceUrls: this.evidenceUrls,
      lawyerName: this.lawyerName,
      lawyerContact: this.lawyerContact,
      mediationDetails: this.mediationDetails,
      courtDetails: this.courtDetails,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
