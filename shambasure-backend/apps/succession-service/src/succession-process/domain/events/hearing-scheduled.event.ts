export class HearingScheduledEvent {
  constructor(
    public readonly hearingId: string,
    public readonly caseId: string,
    public readonly date: Date,
    public readonly type: string,
    public readonly virtualLink?: string,
    public readonly courtroom?: string,
    public readonly judgeName?: string,
  ) {}

  getEventType(): string {
    return 'HearingScheduledEvent';
  }

  getPayload() {
    return {
      hearingId: this.hearingId,
      caseId: this.caseId,
      date: this.date,
      type: this.type,
      virtualLink: this.virtualLink,
      courtroom: this.courtroom,
      judgeName: this.judgeName,
    };
  }
}
