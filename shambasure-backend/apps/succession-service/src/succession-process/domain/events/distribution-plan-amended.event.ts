export class DistributionPlanAmendedEvent {
  constructor(
    public readonly estateId: string,
    public readonly amendmentReason: string,
    public readonly amendedBy: string,
    public readonly changes: string[],
    public readonly courtOrderNumber?: string,
  ) {}

  getEventType(): string {
    return 'DistributionPlanAmendedEvent';
  }
}
