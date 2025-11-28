import { AggregateRoot } from '@nestjs/cqrs';
import { HearingStatus, HearingType } from '@prisma/client';

import { HearingAdjournedEvent } from '../events/hearing-adjourned.event';
import { HearingCompletedEvent } from '../events/hearing-completed.event';
import { HearingScheduledEvent } from '../events/hearing-scheduled.event';

export interface HearingOutcome {
  orders: string[];
  rulings: string[];
  nextSteps: string[];
  complianceDeadline?: Date;
}

// Value Object for Kenyan Court Identification
export class CourtIdentification {
  constructor(
    public readonly courtStation: string,
    public readonly causeListNumber?: string,
    public readonly courtroom?: string,
  ) {
    if (!courtStation.trim()) {
      throw new Error('Court station is required');
    }
  }

  getFormattedReference(): string {
    return this.causeListNumber
      ? `${this.courtStation} - ${this.causeListNumber}`
      : this.courtStation;
  }
}

// Main Entity
export class CourtHearing extends AggregateRoot {
  constructor(
    private readonly id: string,
    private readonly caseId: string, // ProbateCase reference
    private hearingNumber: string,
    private date: Date,
    private type: HearingType,
    private courtIdentification: CourtIdentification,
    private status: HearingStatus = HearingStatus.SCHEDULED,
    private judgeName?: string,
    private presidedBy?: string,
    private virtualLink?: string,
    private startTime: string = '09:00',
    private endTime: string = '10:00',
    private outcomeNotes?: string,
    private outcome?: HearingOutcome,
    private adjournmentCount: number = 0,
    private adjournmentReasons: string[] = [],
    private minutesTaken: boolean = false,
    private ordersIssued: boolean = false,
    private complianceDeadline?: Date,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
  ) {
    super();
    this.validate();
  }

  // ==========================================================================
  // FACTORY METHODS (Creation & Reconstitution)
  // ==========================================================================

  static schedule(
    id: string,
    caseId: string,
    date: Date,
    type: HearingType,
    courtStation: string,
    options?: {
      hearingNumber?: string;
      causeListNumber?: string;
      courtroom?: string;
      judgeName?: string;
      startTime?: string;
      endTime?: string;
      virtualLink?: string;
    },
  ): CourtHearing {
    // Validate legal requirements before creation
    CourtHearing.validateHearingDate(date);

    const courtId = new CourtIdentification(
      courtStation,
      options?.causeListNumber,
      options?.courtroom,
    );

    const hearingNumber = options?.hearingNumber || CourtHearing.generateHearingNumber();

    const hearing = new CourtHearing(
      id,
      caseId,
      hearingNumber,
      date,
      type,
      courtId,
      HearingStatus.SCHEDULED,
      options?.judgeName,
      undefined, // presidedBy
      options?.virtualLink,
      options?.startTime,
      options?.endTime,
    );

    hearing.apply(new HearingScheduledEvent(hearing.id, hearing.caseId, hearing.date));
    return hearing;
  }

  static reconstitute(props: {
    id: string;
    caseId: string;
    hearingNumber: string;
    date: Date;
    type: HearingType;
    courtStation: string;
    status: HearingStatus;
    causeListNumber?: string;
    courtroom?: string;
    judgeName?: string;
    presidedBy?: string;
    virtualLink?: string;
    startTime?: string;
    endTime?: string;
    outcomeNotes?: string;
    outcome?: HearingOutcome;
    adjournmentCount?: number;
    adjournmentReasons?: string[];
    minutesTaken?: boolean;
    ordersIssued?: boolean;
    complianceDeadline?: Date;
    createdAt: Date;
    updatedAt: Date;
  }): CourtHearing {
    const courtId = new CourtIdentification(
      props.courtStation,
      props.causeListNumber,
      props.courtroom,
    );

    return new CourtHearing(
      props.id,
      props.caseId,
      props.hearingNumber,
      props.date,
      props.type,
      courtId,
      props.status,
      props.judgeName,
      props.presidedBy,
      props.virtualLink,
      props.startTime,
      props.endTime,
      props.outcomeNotes,
      props.outcome,
      props.adjournmentCount,
      props.adjournmentReasons,
      props.minutesTaken,
      props.ordersIssued,
      props.complianceDeadline,
      props.createdAt,
      props.updatedAt,
    );
  }

  // ==========================================================================
  // BUSINESS LOGIC (Domain Behavior)
  // ==========================================================================

  // Legal Invariant: Hearing must be scheduled before it can proceed
  markInProgress(presidingOfficer: string): void {
    if (this.status !== HearingStatus.SCHEDULED) {
      throw new Error(
        `Only scheduled hearings can be marked in progress. Current status: ${this.status}`,
      );
    }

    this.validatePresidingOfficer(presidingOfficer);
    this.ensureHearingDateIsToday();

    this.status = HearingStatus.IN_PROGRESS;
    this.presidedBy = presidingOfficer;
    this.updatedAt = new Date();
  }

  // Legal Invariant: Completed hearings must have recorded outcomes
  complete(outcome: HearingOutcome, presidingOfficer: string): void {
    if (![HearingStatus.SCHEDULED, HearingStatus.IN_PROGRESS].includes(this.status)) {
      throw new Error('Only scheduled or in-progress hearings can be completed');
    }

    this.validatePresidingOfficer(presidingOfficer);
    this.validateHearingOutcome(outcome);

    this.status = HearingStatus.COMPLETED;
    this.outcome = outcome;
    this.presidedBy = presidingOfficer;
    this.minutesTaken = true;
    this.ordersIssued = outcome.orders.length > 0;
    this.complianceDeadline = outcome.complianceDeadline;
    this.updatedAt = new Date();

    this.apply(new HearingCompletedEvent(this.id, this.caseId, outcome));
  }

  // Legal Requirement: Track adjournment history for court records
  adjourn(reason: string, nextDate: Date, presidingOfficer: string): void {
    if (![HearingStatus.SCHEDULED, HearingStatus.IN_PROGRESS].includes(this.status)) {
      throw new Error('Only scheduled or in-progress hearings can be adjourned');
    }

    CourtHearing.validateHearingDate(nextDate);

    this.status = HearingStatus.ADJOURNED;
    this.adjournmentCount++;
    this.adjournmentReasons.push(`${new Date().toISOString()}: ${reason}`);
    this.presidedBy = presidingOfficer;
    this.updatedAt = new Date();

    this.apply(new HearingAdjournedEvent(this.id, this.caseId, reason, nextDate));
  }

  cancel(reason: string): void {
    if (this.status !== HearingStatus.SCHEDULED) {
      throw new Error('Only scheduled hearings can be cancelled');
    }

    this.status = HearingStatus.CANCELLED;
    this.outcomeNotes = `Cancelled: ${reason}`;
    this.updatedAt = new Date();
  }

  // ==========================================================================
  // VALIDATION & LEGAL COMPLIANCE
  // ==========================================================================

  private validate(): void {
    if (!this.id) throw new Error('Hearing ID is required');
    if (!this.caseId) throw new Error('Case ID is required');
    if (!this.hearingNumber) throw new Error('Hearing number is required');
    if (!this.date) throw new Error('Hearing date is required');
    if (!this.type) throw new Error('Hearing type is required');
    if (!this.courtIdentification) throw new Error('Court identification is required');

    CourtHearing.validateHearingDate(this.date);
  }

  private static validateHearingDate(date: Date): void {
    if (date < new Date()) {
      throw new Error('Cannot schedule hearing in the past');
    }

    // Kenyan courts don't typically sit on weekends
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      throw new Error('Court hearings cannot be scheduled on weekends');
    }

    // Kenyan court hours validation
    const hour = date.getHours();
    if (hour < 8 || hour > 17) {
      throw new Error('Court hearings must be scheduled between 8:00 AM and 5:00 PM');
    }
  }

  private validatePresidingOfficer(officer: string): void {
    if (!officer?.trim() || officer.trim().length < 3) {
      throw new Error('Valid presiding officer name is required (min 3 characters)');
    }
  }

  private validateHearingOutcome(outcome: HearingOutcome): void {
    if (!outcome.orders?.length && !outcome.rulings?.length) {
      throw new Error('Hearing outcome must include at least orders or rulings');
    }
  }

  private ensureHearingDateIsToday(): void {
    const today = new Date();
    if (this.date.toDateString() !== today.toDateString()) {
      throw new Error('Hearing can only be marked in progress on its scheduled date');
    }
  }

  private static generateHearingNumber(): string {
    const courtCode = 'HC'; // High Court default
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `HRG-${courtCode}-${year}-${random}`;
  }

  // ==========================================================================
  // QUERY METHODS
  // ==========================================================================

  isComplianceOverdue(): boolean {
    return this.complianceDeadline ? new Date() > this.complianceDeadline : false;
  }

  canBeRescheduled(): boolean {
    const hoursUntilHearing = (this.date.getTime() - Date.now()) / (1000 * 60 * 60);
    return this.status === HearingStatus.SCHEDULED && hoursUntilHearing > 48;
  }

  getAdjournmentHistory(): ReadonlyArray<string> {
    return [...this.adjournmentReasons];
  }

  // ==========================================================================
  // GETTERS (Persistence Interface)
  // ==========================================================================

  // Aligns with Prisma schema CourtHearing model
  getId(): string {
    return this.id;
  }
  getCaseId(): string {
    return this.caseId;
  }
  getHearingNumber(): string {
    return this.hearingNumber;
  }
  getDate(): Date {
    return this.date;
  }
  getType(): HearingType {
    return this.type;
  }
  getStatus(): HearingStatus {
    return this.status;
  }
  getCourtStation(): string {
    return this.courtIdentification.courtStation;
  }
  getCauseListNumber(): string | undefined {
    return this.courtIdentification.causeListNumber;
  }
  getCourtroom(): string | undefined {
    return this.courtIdentification.courtroom;
  }
  getJudgeName(): string | undefined {
    return this.judgeName;
  }
  getPresidedBy(): string | undefined {
    return this.presidedBy;
  }
  getVirtualLink(): string | undefined {
    return this.virtualLink;
  }
  getStartTime(): string {
    return this.startTime;
  }
  getEndTime(): string {
    return this.endTime;
  }
  getOutcomeNotes(): string | undefined {
    return this.outcomeNotes;
  }
  getOutcome(): HearingOutcome | undefined {
    return this.outcome;
  }
  getAdjournmentCount(): number {
    return this.adjournmentCount;
  }
  getAdjournmentReasons(): string[] {
    return [...this.adjournmentReasons];
  }
  getMinutesTaken(): boolean {
    return this.minutesTaken;
  }
  getOrdersIssued(): boolean {
    return this.ordersIssued;
  }
  getComplianceDeadline(): Date | undefined {
    return this.complianceDeadline;
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
      caseId: this.caseId,
      hearingNumber: this.hearingNumber,
      date: this.date,
      type: this.type,
      courtStation: this.courtIdentification.courtStation,
      status: this.status,
      causeListNumber: this.courtIdentification.causeListNumber,
      courtroom: this.courtIdentification.courtroom,
      judgeName: this.judgeName,
      presidedBy: this.presidedBy,
      virtualLink: this.virtualLink,
      startTime: this.startTime,
      endTime: this.endTime,
      outcomeNotes: this.outcomeNotes,
      outcome: this.outcome,
      adjournmentCount: this.adjournmentCount,
      adjournmentReasons: this.adjournmentReasons,
      minutesTaken: this.minutesTaken,
      ordersIssued: this.ordersIssued,
      complianceDeadline: this.complianceDeadline,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
