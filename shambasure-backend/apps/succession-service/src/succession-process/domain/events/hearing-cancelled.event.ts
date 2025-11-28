export class HearingCancelledEvent {
  constructor(
    public readonly hearingId: string,
    public readonly caseId: string,
    public readonly reason: string,
    public readonly cancelledBy: string,
    public readonly cancellationDate: Date,
  ) {}

  getEventType(): string {
    return 'HearingCancelledEvent';
  }
}
