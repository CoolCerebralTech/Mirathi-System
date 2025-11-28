export class DistributionDisputedEvent {
  constructor(
    public readonly distributionId: string,
    public readonly estateId: string,
    public readonly disputeReason: string,
    public readonly disputedBy: string,
    public readonly disputeDate: Date,
  ) {}

  getEventType(): string {
    return 'DistributionDisputedEvent';
  }
}
