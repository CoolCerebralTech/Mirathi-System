import { AggregateRoot } from '@nestjs/cqrs';
import { HearingType } from '../../../common/types/kenyan-law.types';
import { HearingScheduledEvent } from '../events/hearing-scheduled.event';
import { HearingOutcomeRecordedEvent } from '../events/hearing-outcome-recorded.event';
import { HearingAdjournedEvent } from '../events/hearing-adjourned.event';
import { HearingCancelledEvent } from '../events/hearing-cancelled.event';

export type HearingStatus = 'SCHEDULED' | 'COMPLETED' | 'ADJOURNED' | 'CANCELLED' | 'IN_PROGRESS';

export interface HearingOutcome {
  orders: string[];
  rulings: string[];
  nextSteps: string[];
  complianceDeadline?: Date;
}

// Safe interface for reconstitution
export interface CourtHearingProps {
  id: string;
  caseId: string;
  hearingNumber: string;
  date: Date | string;
  type: HearingType;
  courtStation: string;
  status: HearingStatus;
  virtualLink?: string | null;
  courtroom?: string | null;
  judgeName?: string | null;
  causeListNumber?: string | null;
  startTime?: string;
  endTime?: string;
  outcomeNotes?: string | null;
  outcome?: HearingOutcome | null;
  presidedBy?: string | null;
  adjournmentCount?: number;
  adjournmentReasons?: string[];
  minutesTaken?: boolean;
  ordersIssued?: boolean;
  complianceDeadline?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export class CourtHearing extends AggregateRoot {
  private id: string;
  private caseId: string;
  private hearingNumber: string;

  // Scheduling Details
  private date: Date;
  private startTime: string;
  private endTime: string;
  private type: HearingType;
  private virtualLink: string | null;
  private courtroom: string | null;
  private judgeName: string | null;

  // Kenyan Court Specific
  private courtStation: string;
  private causeListNumber: string | null;

  // Outcome
  private status: HearingStatus;
  private outcomeNotes: string | null;
  private outcome: HearingOutcome | null;
  private presidedBy: string | null;
  private adjournmentCount: number;
  private adjournmentReasons: string[];

  // Legal Compliance
  private minutesTaken: boolean;
  private ordersIssued: boolean;
  private complianceDeadline: Date | null;

  private createdAt: Date;
  private updatedAt: Date;

  private constructor(
    id: string,
    caseId: string,
    date: Date,
    type: HearingType,
    courtStation: string,
  ) {
    super();
    this.id = id;
    this.caseId = caseId;
    this.date = date;
    this.type = type;
    this.courtStation = courtStation;

    this.status = 'SCHEDULED';
    this.virtualLink = null;
    this.courtroom = null;
    this.judgeName = null;
    this.causeListNumber = null;
    this.startTime = '09:00';
    this.endTime = '10:00';
    this.outcomeNotes = null;
    this.outcome = null;
    this.presidedBy = null;
    this.adjournmentCount = 0;
    this.adjournmentReasons = [];
    this.minutesTaken = false;
    this.ordersIssued = false;
    this.complianceDeadline = null;
    this.hearingNumber = this.generateHearingNumber();

    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // FACTORY METHODS
  // --------------------------------------------------------------------------

  static schedule(
    id: string,
    caseId: string,
    date: Date,
    type: HearingType,
    courtStation: string,
    options?: {
      virtualLink?: string;
      courtroom?: string;
      judgeName?: string;
      startTime?: string;
      endTime?: string;
      causeListNumber?: string;
    },
  ): CourtHearing {
    this.validateHearingDate(date);

    const hearing = new CourtHearing(id, caseId, date, type, courtStation);

    if (options) {
      if (options.virtualLink) hearing.virtualLink = options.virtualLink;
      if (options.courtroom) hearing.courtroom = options.courtroom;
      if (options.judgeName) hearing.judgeName = options.judgeName;
      if (options.startTime) hearing.startTime = options.startTime;
      if (options.endTime) hearing.endTime = options.endTime;
      if (options.causeListNumber) hearing.causeListNumber = options.causeListNumber;
    }

    hearing.apply(
      new HearingScheduledEvent(
        id,
        caseId,
        date,
        type,
        hearing.virtualLink || undefined,
        hearing.courtroom || undefined,
        hearing.judgeName || undefined,
      ),
    );
    return hearing;
  }

  static reconstitute(props: CourtHearingProps): CourtHearing {
    // Validate required fields
    if (!props.id || !props.caseId || !props.date || !props.type || !props.courtStation) {
      throw new Error('Missing required properties for CourtHearing reconstitution');
    }

    const hearing = new CourtHearing(
      props.id,
      props.caseId,
      new Date(props.date),
      props.type,
      props.courtStation,
    );

    // Safe property assignments with validation
    hearing.hearingNumber = props.hearingNumber || hearing.generateHearingNumber();
    hearing.status = props.status;
    hearing.virtualLink = props.virtualLink ?? null;
    hearing.courtroom = props.courtroom ?? null;
    hearing.judgeName = props.judgeName ?? null;
    hearing.causeListNumber = props.causeListNumber ?? null;
    hearing.startTime = props.startTime || '09:00';
    hearing.endTime = props.endTime || '10:00';
    hearing.outcomeNotes = props.outcomeNotes ?? null;
    hearing.outcome = props.outcome ?? null;
    hearing.presidedBy = props.presidedBy ?? null;
    hearing.adjournmentCount = props.adjournmentCount || 0;
    hearing.adjournmentReasons = props.adjournmentReasons || [];
    hearing.minutesTaken = props.minutesTaken ?? false;
    hearing.ordersIssued = props.ordersIssued ?? false;

    // Safe date handling for complianceDeadline
    if (props.complianceDeadline) {
      hearing.complianceDeadline = new Date(props.complianceDeadline);
    } else {
      hearing.complianceDeadline = null;
    }

    // Safe date handling for timestamps
    hearing.createdAt = new Date(props.createdAt);
    hearing.updatedAt = new Date(props.updatedAt);

    return hearing;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  /**
   * Mark hearing as in progress
   */
  markInProgress(presidingOfficer: string): void {
    if (this.status !== 'SCHEDULED') {
      throw new Error('Only scheduled hearings can be marked as in progress.');
    }

    this.status = 'IN_PROGRESS';
    this.presidedBy = presidingOfficer;
    this.updatedAt = new Date();
  }

  /**
   * Record that the hearing took place successfully.
   */
  complete(
    outcome: HearingOutcome,
    presidingOfficer: string,
    minutesTaken: boolean = true,
    ordersIssued: boolean = true,
  ): void {
    if (!['SCHEDULED', 'IN_PROGRESS'].includes(this.status)) {
      throw new Error('Hearing must be scheduled or in progress to complete.');
    }

    this.status = 'COMPLETED';
    this.outcome = outcome;
    this.presidedBy = presidingOfficer;
    this.minutesTaken = minutesTaken;
    this.ordersIssued = ordersIssued;
    this.complianceDeadline = outcome.complianceDeadline || null;
    this.updatedAt = new Date();

    this.apply(
      new HearingOutcomeRecordedEvent(
        this.id,
        this.caseId,
        'COMPLETED',
        this.formatOutcomeNotes(outcome),
        undefined,
        outcome.orders,
        outcome.nextSteps,
      ),
    );
  }

  /**
   * Hearing happened but was pushed to a later date without progress.
   */
  adjourn(reason: string, nextDate: Date, presidingOfficer: string): void {
    if (!['SCHEDULED', 'IN_PROGRESS'].includes(this.status)) {
      throw new Error('Hearing must be scheduled or in progress to adjourn.');
    }

    this.status = 'ADJOURNED';
    this.adjournmentCount++;
    this.adjournmentReasons.push(`${new Date().toISOString()}: ${reason}`);
    this.presidedBy = presidingOfficer;
    this.updatedAt = new Date();

    this.apply(
      new HearingAdjournedEvent(
        this.id,
        this.caseId,
        reason,
        nextDate,
        this.adjournmentCount,
        presidingOfficer,
      ),
    );
  }

  /**
   * Cancel a hearing before it occurs
   */
  cancel(reason: string, cancelledBy: string): void {
    if (this.status !== 'SCHEDULED') {
      throw new Error('Only scheduled hearings can be cancelled.');
    }

    this.status = 'CANCELLED';
    this.outcomeNotes = `Cancelled: ${reason}`;
    this.updatedAt = new Date();

    this.apply(new HearingCancelledEvent(this.id, this.caseId, reason, cancelledBy, new Date()));
  }

  reschedule(newDate: Date, reason?: string): void {
    if (!['SCHEDULED', 'ADJOURNED'].includes(this.status)) {
      throw new Error('Cannot reschedule a completed or cancelled hearing.');
    }

    // Correct call to static method
    CourtHearing.validateHearingDate(newDate);

    const oldDate = this.date;
    this.date = newDate;
    this.status = 'SCHEDULED';
    this.updatedAt = new Date();

    if (reason) {
      this.outcomeNotes = `Rescheduled from ${oldDate.toDateString()}: ${reason}`;
    }

    this.apply(
      new HearingScheduledEvent(
        this.id,
        this.caseId,
        newDate,
        this.type,
        this.virtualLink || undefined,
        this.courtroom || undefined,
        this.judgeName || undefined,
      ),
    );
  }

  /**
   * Add compliance tracking for court orders
   */
  markComplianceDeadline(deadline: Date, requirement: string): void {
    if (this.status !== 'COMPLETED') {
      throw new Error('Can only set compliance deadlines for completed hearings.');
    }

    if (!this.outcome) {
      this.outcome = { orders: [], rulings: [], nextSteps: [] };
    }

    this.outcome.complianceDeadline = deadline;
    this.outcome.nextSteps.push(
      `Compliance required by ${deadline.toDateString()}: ${requirement}`,
    );
    this.updatedAt = new Date();
  }

  // --------------------------------------------------------------------------
  // VALIDATION METHODS
  // --------------------------------------------------------------------------

  private static validateHearingDate(date: Date): void {
    if (date < new Date()) {
      throw new Error('Cannot schedule a hearing in the past.');
    }

    // Kenyan courts typically don't sit on weekends
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      throw new Error('Court hearings are typically not scheduled on weekends.');
    }

    // Kenyan court hours (simplified)
    const hour = date.getHours();
    if (hour < 8 || hour > 17) {
      throw new Error('Court hearings are typically scheduled between 8:00 AM and 5:00 PM.');
    }
  }

  private generateHearingNumber(): string {
    const timestamp = new Date().getTime().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `HRG-${timestamp}-${random}`;
  }

  private formatOutcomeNotes(outcome: HearingOutcome): string {
    const notes: string[] = [];

    if (outcome.orders.length > 0) {
      notes.push(`Orders: ${outcome.orders.join('; ')}`);
    }

    if (outcome.rulings.length > 0) {
      notes.push(`Rulings: ${outcome.rulings.join('; ')}`);
    }

    if (outcome.nextSteps.length > 0) {
      notes.push(`Next Steps: ${outcome.nextSteps.join('; ')}`);
    }

    return notes.join(' | ');
  }

  // --------------------------------------------------------------------------
  // QUERY METHODS
  // --------------------------------------------------------------------------

  isOverdue(): boolean {
    if (this.complianceDeadline) {
      return new Date() > this.complianceDeadline;
    }
    return false;
  }

  getAdjournmentHistory(): string[] {
    return [...this.adjournmentReasons];
  }

  requiresCompliance(): boolean {
    return this.complianceDeadline !== null;
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  getId(): string {
    return this.id;
  }
  getCaseId(): string {
    return this.caseId;
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
  getOutcomeNotes(): string | null {
    return this.outcomeNotes;
  }
  getOutcome(): HearingOutcome | null {
    return this.outcome;
  }
  getPresidedBy(): string | null {
    return this.presidedBy;
  }
  getCourtStation(): string {
    return this.courtStation;
  }
  getCourtroom(): string | null {
    return this.courtroom;
  }
  getJudgeName(): string | null {
    return this.judgeName;
  }
  getVirtualLink(): string | null {
    return this.virtualLink;
  }
  getHearingNumber(): string {
    return this.hearingNumber;
  }
  getCauseListNumber(): string | null {
    return this.causeListNumber;
  }
  getAdjournmentCount(): number {
    return this.adjournmentCount;
  }
  getComplianceDeadline(): Date | null {
    return this.complianceDeadline;
  }
  getStartTime(): string {
    return this.startTime;
  }
  getEndTime(): string {
    return this.endTime;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // Method to get all properties for persistence
  getProps(): CourtHearingProps {
    return {
      id: this.id,
      caseId: this.caseId,
      hearingNumber: this.hearingNumber,
      date: this.date,
      type: this.type,
      courtStation: this.courtStation,
      status: this.status,
      virtualLink: this.virtualLink,
      courtroom: this.courtroom,
      judgeName: this.judgeName,
      causeListNumber: this.causeListNumber,
      startTime: this.startTime,
      endTime: this.endTime,
      outcomeNotes: this.outcomeNotes,
      outcome: this.outcome,
      presidedBy: this.presidedBy,
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
