export class HearingOutcomeRecordedEvent {
  constructor(
    public readonly hearingId: string,
    public readonly caseId: string,
    public readonly status: string,
    public readonly outcomeNotes: string,
    public readonly nextDate?: Date,
    public readonly ordersIssued?: string[],
    public readonly nextSteps?: string[],
  ) {}

  getEventType(): string {
    return 'HearingOutcomeRecordedEvent';
  }

  getPayload() {
    return {
      hearingId: this.hearingId,
      caseId: this.caseId,
      status: this.status,
      outcomeNotes: this.outcomeNotes,
      nextDate: this.nextDate,
      ordersIssued: this.ordersIssued,
      nextSteps: this.nextSteps,
    };
  }
}
