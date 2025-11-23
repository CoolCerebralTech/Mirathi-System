export class DisputeCourtFiledEvent {
  constructor(
    public readonly disputeId: string,
    public readonly willId: string,
    public readonly courtCaseNumber: string,
    public readonly courtName: string,
    public readonly filingDate: Date,
  ) {}

  getEventType(): string {
    return 'DisputeCourtFiledEvent';
  }
}
