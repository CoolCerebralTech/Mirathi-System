export class DisputeMediationStartedEvent {
  constructor(
    public readonly disputeId: string,
    public readonly willId: string,
    public readonly mediatorName: string,
    public readonly mediationDate: Date,
    public readonly location: string,
  ) {}

  getEventType(): string {
    return 'DisputeMediationStartedEvent';
  }
}
