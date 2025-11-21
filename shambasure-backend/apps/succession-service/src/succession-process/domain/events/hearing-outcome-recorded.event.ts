import { HearingStatus } from '../entities/court-hearing.entity';

export class HearingOutcomeRecordedEvent {
  constructor(
    public readonly hearingId: string,
    public readonly caseId: string,
    public readonly status: HearingStatus,
    public readonly outcomeSummary: string,
    public readonly nextHearingDate?: Date, // If adjourned/scheduled immediately
    public readonly timestamp: Date = new Date(),
  ) {}
}
