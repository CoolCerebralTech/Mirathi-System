export class HearingAdjournedEvent {
  constructor(
    public readonly hearingId: string,
    public readonly caseId: string,
    public readonly reason: string,
    public readonly nextDate: Date,
    public readonly adjournmentCount: number,
    public readonly presidingOfficer: string,
  ) {}

  getEventType(): string {
    return 'HearingAdjournedEvent';
  }
}
