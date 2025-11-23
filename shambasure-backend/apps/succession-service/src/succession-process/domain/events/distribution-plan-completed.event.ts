export class DistributionPlanCompletedEvent {
  constructor(
    public readonly estateId: string,
    public readonly completionDate: Date,
    public readonly totalDistributions: number,
    public readonly completedBy?: string,
  ) {}

  getEventType(): string {
    return 'DistributionPlanCompletedEvent';
  }
}
