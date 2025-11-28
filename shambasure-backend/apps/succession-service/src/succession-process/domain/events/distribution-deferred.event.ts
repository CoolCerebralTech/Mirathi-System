export class DistributionDeferredEvent {
  constructor(
    public readonly distributionId: string,
    public readonly estateId: string,
    public readonly deferralReason: string,
    public readonly expectedDate: Date,
    public readonly deferredBy: string,
  ) {}

  getEventType(): string {
    return 'DistributionDeferredEvent';
  }
}
