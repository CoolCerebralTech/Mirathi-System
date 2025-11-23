export class DistributionPlanCreatedEvent {
  constructor(
    public readonly estateId: string,
    public readonly grantId: string,
    public readonly createdAt: Date = new Date(),
  ) {}

  getEventType(): string {
    return 'DistributionPlanCreatedEvent';
  }
}
