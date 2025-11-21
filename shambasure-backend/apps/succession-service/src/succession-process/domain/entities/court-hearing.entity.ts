import { AggregateRoot } from '@nestjs/cqrs';
import { HearingType } from '../../../common/types/kenyan-law.types';
import { HearingScheduledEvent } from '../events/hearing-scheduled.event';
import { HearingOutcomeRecordedEvent } from '../events/hearing-outcome-recorded.event';

export type HearingStatus = 'SCHEDULED' | 'COMPLETED' | 'ADJOURNED' | 'CANCELLED';

export class CourtHearing extends AggregateRoot {
  private id: string;
  private caseId: string; // Links to ProbateCase

  // Scheduling Details
  private date: Date;
  private type: HearingType;
  private virtualLink: string | null;

  // Outcome
  private status: HearingStatus;
  private outcomeNotes: string | null;
  private presidedBy: string | null; // Judge/Magistrate Name

  private createdAt: Date;
  private updatedAt: Date;

  private constructor(id: string, caseId: string, date: Date, type: HearingType) {
    super();
    this.id = id;
    this.caseId = caseId;
    this.date = date;
    this.type = type;

    this.status = 'SCHEDULED';
    this.virtualLink = null;
    this.outcomeNotes = null;
    this.presidedBy = null;

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
    virtualLink?: string,
  ): CourtHearing {
    if (date < new Date()) {
      // Allow slight past buffer? Generally no, scheduling is future.
      // But for data entry of past events, we might allow.
      // Strict mode:
      // throw new Error('Cannot schedule a hearing in the past.');
    }

    const hearing = new CourtHearing(id, caseId, date, type);
    if (virtualLink) hearing.virtualLink = virtualLink;

    hearing.apply(new HearingScheduledEvent(id, caseId, date, type, virtualLink));
    return hearing;
  }

  static reconstitute(props: any): CourtHearing {
    const hearing = new CourtHearing(props.id, props.caseId, new Date(props.date), props.type);

    hearing.status = props.status;
    hearing.virtualLink = props.virtualLink || null;
    hearing.outcomeNotes = props.outcomeNotes || null;
    hearing.presidedBy = props.presidedBy || null;
    hearing.createdAt = new Date(props.createdAt);
    hearing.updatedAt = new Date(props.updatedAt);

    return hearing;
  }

  // --------------------------------------------------------------------------
  // BUSINESS LOGIC
  // --------------------------------------------------------------------------

  /**
   * Record that the hearing took place successfully.
   */
  complete(outcome: string, presidedBy: string): void {
    if (this.status !== 'SCHEDULED') {
      throw new Error('Hearing is not in SCHEDULED state.');
    }

    this.status = 'COMPLETED';
    this.outcomeNotes = outcome;
    this.presidedBy = presidedBy;
    this.updatedAt = new Date();

    this.apply(new HearingOutcomeRecordedEvent(this.id, this.caseId, 'COMPLETED', outcome));
  }

  /**
   * Hearing happened but was pushed to a later date without progress.
   */
  adjourn(reason: string, nextDate?: Date): void {
    if (this.status !== 'SCHEDULED') {
      throw new Error('Hearing is not in SCHEDULED state.');
    }

    this.status = 'ADJOURNED';
    this.outcomeNotes = `Adjourned: ${reason}`;
    this.updatedAt = new Date();

    this.apply(
      new HearingOutcomeRecordedEvent(this.id, this.caseId, 'ADJOURNED', reason, nextDate),
    );
  }

  reschedule(newDate: Date): void {
    if (this.status !== 'SCHEDULED') {
      throw new Error('Cannot reschedule a completed or cancelled hearing.');
    }

    this.date = newDate;
    this.updatedAt = new Date();

    // Re-emit schedule event or a specific reschedule event
    this.apply(
      new HearingScheduledEvent(
        this.id,
        this.caseId,
        newDate,
        this.type,
        this.virtualLink || undefined,
      ),
    );
  }

  // --------------------------------------------------------------------------
  // GETTERS
  // --------------------------------------------------------------------------

  getId() {
    return this.id;
  }
  getCaseId() {
    return this.caseId;
  }
  getDate() {
    return this.date;
  }
  getType() {
    return this.type;
  }
  getStatus() {
    return this.status;
  }
  getOutcome() {
    return this.outcomeNotes;
  }
}
