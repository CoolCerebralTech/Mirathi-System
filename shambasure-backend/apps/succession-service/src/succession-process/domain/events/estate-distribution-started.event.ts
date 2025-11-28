export class EstateDistributionStartedEvent {
  constructor(
    public readonly estateId: string,
    public readonly startDate: Date,
  ) {}

  getEventType(): string {
    return 'EstateDistributionStartedEvent';
  }
}
